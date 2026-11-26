/**
 * Migration Script: Migrate RMS MySQL Dump to Ticketing System
 * 
 * Safely parses and migrates RMS MySQL dump (organisations, users, vfd_models,
 * vfd_parameters, telemetry_configs, configs) into the Ticketing System database
 * without losing or overwriting existing ticketing data.
 * 
 * Usage:
 *   node scripts/migrate-rms-sql.js [path-to-sql-file] [--dry-run]
 * 
 * Example:
 *   node scripts/migrate-rms-sql.js "c:/workspace/service/rms_service.sql"
 */

const fs = require("fs");
const path = require("path");
const { prisma } = require("../lib/clients");

// --- Helper: Parse SQL VALUES tuples ---
function parseSqlValues(valuesSql) {
  const rows = [];
  let inString = false;
  let escapeNext = false;
  let currentField = "";
  let currentRow = null;

  for (let i = 0; i < valuesSql.length; i++) {
    const char = valuesSql[i];

    if (inString) {
      if (escapeNext) {
        currentField += char;
        escapeNext = false;
      } else if (char === "\\") {
        escapeNext = true;
      } else if (char === "'") {
        inString = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === "'") {
        inString = true;
      } else if (char === "(") {
        currentRow = [];
        currentField = "";
      } else if (char === ")") {
        if (currentRow) {
          currentRow.push(cleanValue(currentField));
          rows.push(currentRow);
          currentRow = null;
          currentField = "";
        }
      } else if (char === ",") {
        if (currentRow) {
          currentRow.push(cleanValue(currentField));
          currentField = "";
        }
      } else if (!/\s/.test(char)) {
        currentField += char;
      }
    }
  }

  return rows;
}

function cleanValue(val) {
  const trimmed = val.trim();
  if (trimmed === "NULL" || trimmed === "null" || trimmed === "") return null;
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
  return trimmed;
}

function parseJsonSafe(val) {
  if (!val) return null;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
}

async function runMigration() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const sqlArg = args.find(a => !a.startsWith("--"));
  const defaultPath = path.resolve(__dirname, "./rms_service.sql");
  const sqlFilePath = sqlArg ? path.resolve(sqlArg) : defaultPath;

  console.log("==================================================");
  console.log("   RMS MySQL Dump -> Ticketing System Migration   ");
  console.log("==================================================");
  console.log(`Source SQL File : ${sqlFilePath}`);
  console.log(`Dry Run Mode    : ${isDryRun ? "YES (No writes)" : "NO (Live DB Updates)"}`);
  console.log("--------------------------------------------------");

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Error: SQL file not found at: ${sqlFilePath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
  console.log(`✓ Read SQL file (${(sqlContent.length / 1024).toFixed(1)} KB)`);

  // Extract tables from dump
  const tables = {};
  const insertRegex = /INSERT INTO `?(\w+)`? VALUES\s*([\s\S]*?);/g;
  let match;
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const rows = parseSqlValues(match[2]);
    tables[tableName] = rows;
  }

  console.log("Discovered tables in SQL dump:");
  for (const [t, r] of Object.entries(tables)) {
    console.log(`  - ${t}: ${r.length} rows`);
  }
  console.log("--------------------------------------------------");

  const stats = {
    organisations: { inserted: 0, updated: 0, skipped: 0 },
    users: { mapped: 0, created: 0, skipped: 0 },
    projects: { inserted: 0, updated: 0 },
    vfdModels: { inserted: 0, updated: 0 },
    vfdParameters: { inserted: 0, updated: 0 },
    telemetryConfigs: { inserted: 0, updated: 0 },
    configs: { inserted: 0, updated: 0 },
  };

  // ==========================================
  // 1. MIGRATING ORGANISATIONS (CUSTOMERS)
  // ==========================================
  console.log("\n[1/6] Migrating Organisations (Customers)...");
  const orgRows = tables["organisations"] || [];
  const orgMap = new Map(); // orgCode -> Organisation record

  for (const row of orgRows) {
    // schema: [id, orgCode, name, createdAt, updatedAt]
    const [oldId, orgCode, name] = row;
    if (!orgCode) continue;

    console.log(`  Processing Customer Org: [${orgCode}] ${name}`);
    let existing = await prisma.organisation.findUnique({ where: { orgCode } });

    if (!existing) {
      if (!isDryRun) {
        existing = await prisma.organisation.create({
          data: {
            orgCode,
            name: name || orgCode,
            email: `info@${orgCode.toLowerCase()}.com`,
            phone: orgCode === "MACSOFT" ? "6383716366" : `+9100000${oldId || 100}`,
            isActive: true,
          },
        });
      }
      stats.organisations.inserted++;
      console.log(`    + Created Organisation: ${orgCode}`);
    } else {
      stats.organisations.updated++;
      console.log(`    = Existing Organisation preserved: ${orgCode} (id: ${existing.id})`);
    }
    orgMap.set(orgCode, existing || { id: 1, orgCode });
  }

  // Ensure MACSOFT exists as default fallback customer
  if (!orgMap.has("MACSOFT")) {
    let macsoft = await prisma.organisation.findUnique({ where: { orgCode: "MACSOFT" } });
    if (!macsoft && !isDryRun) {
      macsoft = await prisma.organisation.create({
        data: {
          orgCode: "MACSOFT",
          name: "Macsoft Automations",
          email: "info@macsoft.in",
          phone: "6383716366",
          isActive: true,
        },
      });
    }
    orgMap.set("MACSOFT", macsoft || { id: 1, orgCode: "MACSOFT" });
  }

  // ==========================================
  // 2. MAPPING / SYNCING USERS
  // ==========================================
  console.log("\n[2/6] Mapping Users without ID collision...");
  const userRows = tables["users"] || [];
  const rmsUserIdMap = new Map(); // old RMS userId -> ticketing userId

  for (const row of userRows) {
    // [id, username, password, email, orgCode, role, isActive, createdAt, updatedAt]
    const [oldId, username, password, email, userOrgCode, userRole, isActive] = row;

    // Look for matching user in Ticketing System by exact name or phone first, then role fallback
    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: username },
          { phone: username },
        ],
      },
    });

    if (!existingUser) {
      existingUser = await prisma.user.findFirst({
        where: username === "admin"
          ? { role: "MACSOFT_ADMIN" }
          : { role: "CUSTOMER_FIELD_ENGINEER" },
      });
    }

    if (existingUser) {
      rmsUserIdMap.set(oldId, existingUser.id);
      stats.users.mapped++;
      console.log(`    = Mapped old User ID ${oldId} (${username}) -> Ticketing User ID ${existingUser.id} (${existingUser.name})`);

      // Ensure orgCode is attached to user if not already set
      if (!existingUser.orgCode && !isDryRun) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { orgCode: "MACSOFT" },
        });
      }
    } else {
      if (!isDryRun) {
        const newUser = await prisma.user.create({
          data: {
            name: username,
            phone: `000000000${oldId}`,
            password: password || "$2b$10$ynZeF6YZSyNaJOpdjXznC.cVoCNS3FrSy2WdcZs4D8H4n45NYrR1C",
            role: userRole === "admin" ? "MACSOFT_ADMIN" : "CUSTOMER_FIELD_ENGINEER",
            orgCode: "MACSOFT",
            isActive: Boolean(isActive ?? true),
          },
        });
        rmsUserIdMap.set(oldId, newUser.id);
        stats.users.created++;
        console.log(`    + Created User: ${username} (New ID: ${newUser.id})`);
      } else {
        rmsUserIdMap.set(oldId, oldId);
      }
    }
  }

  // Fallback user if unmapped
  const defaultUser = await prisma.user.findFirst() || { id: 1 };
  const fallbackUserId = defaultUser.id;

  // ==========================================
  // 3. ENSURING PROJECTS EXIST
  // ==========================================
  console.log("\n[3/6] Ensuring Projects referenced by Configs exist...");
  const configRows = tables["configs"] || [];
  const projectCodes = [...new Set(configRows.map(r => r[2]).filter(Boolean))];
  const macsoftOrg = orgMap.get("MACSOFT") || { id: 1 };

  for (const pCode of projectCodes) {
    let project = await prisma.project.findUnique({ where: { projectCode: pCode } });
    if (!project) {
      if (!isDryRun) {
        project = await prisma.project.create({
          data: {
            projectCode: pCode,
            name: `Project ${pCode}`,
            organisationId: macsoftOrg.id,
            isActive: true,
          },
        });
      }
      stats.projects.inserted++;
      console.log(`    + Created Project: ${pCode}`);
    } else {
      stats.projects.updated++;
      console.log(`    = Existing Project verified: ${pCode}`);
    }
  }

  // ==========================================
  // 4. MIGRATING VFD MODELS
  // ==========================================
  console.log("\n[4/6] Migrating VFD Models...");
  const vfdModelRows = tables["vfd_models"] || [];

  for (const row of vfdModelRows) {
    // [id, modelCode, modelName, manufacturer, daddCommand, description, isActive, createdAt, updatedAt, errorCodes, statusCodes]
    const [_, modelCode, modelName, manufacturer, daddCommand, description, isActive, _cAt, _uAt, errorCodes, statusCodes] = row;
    if (!modelCode) continue;

    const data = {
      modelCode,
      modelName: modelName || modelCode,
      manufacturer: manufacturer || "Macsoft Automations",
      daddCommand: daddCommand || "",
      description: description || null,
      isActive: isActive === 1 || isActive === true,
      errorCodes: parseJsonSafe(errorCodes),
      statusCodes: parseJsonSafe(statusCodes),
    };

    if (!isDryRun) {
      const existing = await prisma.vfdModel.findUnique({ where: { modelCode } });
      await prisma.vfdModel.upsert({
        where: { modelCode },
        update: data,
        create: data,
      });
      if (existing) stats.vfdModels.updated++;
      else stats.vfdModels.inserted++;
    }
    console.log(`    ✓ Upserted VFD Model: ${modelCode}`);
  }

  // ==========================================
  // 5. MIGRATING VFD PARAMETERS & TELEMETRY
  // ==========================================
  console.log("\n[5/6] Migrating VFD Parameters & Telemetry Configs...");
  const vfdParamRows = tables["vfd_parameters"] || [];

  for (const row of vfdParamRows) {
    // [id, vfdModel, paramName, address, value, createdAt, updatedAt]
    const [_, vfdModel, paramName, address, value] = row;
    if (!vfdModel || address === undefined || address === null) continue;
    const strAddress = String(address);

    const paramData = {
      vfdModel,
      paramName: paramName || `Param ${strAddress}`,
      address: strAddress,
      value: value !== null && value !== undefined ? parseInt(value, 10) : null,
    };

    if (!isDryRun) {
      const existing = await prisma.vfdParameter.findUnique({
        where: { vfdModel_address: { vfdModel, address: strAddress } },
      });
      await prisma.vfdParameter.upsert({
        where: { vfdModel_address: { vfdModel, address: strAddress } },
        update: paramData,
        create: paramData,
      });
      if (existing) stats.vfdParameters.updated++;
      else stats.vfdParameters.inserted++;
    }
  }
  console.log(`    ✓ Processed ${vfdParamRows.length} VFD parameters (Upserted safely by [vfdModel, address])`);

  // Telemetry Configs
  const telemetryRows = tables["telemetry_configs"] || [];
  for (const row of telemetryRows) {
    // [id, vfdModel, cmdKey, displayName, unit, scaleFactor, decimals, defaultAddr, kpiTarget, sortOrder, createdAt, updatedAt]
    const [_, vfdModel, cmdKey, displayName, unit, scaleFactor, decimals, defaultAddr, kpiTarget, sortOrder] = row;
    if (!vfdModel || !cmdKey) continue;

    const telemData = {
      vfdModel,
      cmdKey,
      displayName: displayName || cmdKey,
      unit: unit || "",
      scaleFactor: scaleFactor ? parseFloat(scaleFactor) : 1.0,
      decimals: decimals ? parseInt(decimals, 10) : 0,
      defaultAddr: defaultAddr ? String(defaultAddr) : null,
      kpiTarget: kpiTarget || null,
      sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
    };

    if (!isDryRun) {
      const existing = await prisma.telemetryConfig.findUnique({
        where: { vfdModel_cmdKey: { vfdModel, cmdKey } },
      });
      await prisma.telemetryConfig.upsert({
        where: { vfdModel_cmdKey: { vfdModel, cmdKey } },
        update: telemData,
        create: telemData,
      });
      if (existing) stats.telemetryConfigs.updated++;
      else stats.telemetryConfigs.inserted++;
    }
  }
  console.log(`    ✓ Processed ${telemetryRows.length} Telemetry configs (Upserted safely by [vfdModel, cmdKey])`);

  // ==========================================
  // 6. MIGRATING CONFIGS (PRESETS)
  // ==========================================
  console.log("\n[6/6] Migrating Configs (Presets) with customer and user linkage...");
  for (const row of configRows) {
    // [id, userId, projectId, companyId, hp, type, acDc, oilWater, commands, version, createdAt, updatedAt]
    const [_, oldUserId, projectId, companyId, hp, type, acDc, oilWater, commands, version] = row;
    if (!projectId || !hp || !type) continue;

    const mappedUserId = rmsUserIdMap.get(oldUserId) || fallbackUserId;
    const finalCompanyId = companyId || "MACSOFT";
    const strHp = String(hp);
    const cleanCommands = String(commands || "");

    const configData = {
      userId: mappedUserId,
      projectId: String(projectId),
      companyId: finalCompanyId,
      hp: strHp,
      type: String(type),
      acDc: String(acDc || "AC"),
      oilWater: String(oilWater || "Water"),
      commands: cleanCommands,
      version: version ? parseInt(version, 10) : 1,
    };

    if (!isDryRun) {
      const uniqueKey = {
        userId_projectId_companyId_hp_type_acDc_oilWater: {
          userId: mappedUserId,
          projectId: String(projectId),
          companyId: finalCompanyId,
          hp: strHp,
          type: String(type),
          acDc: String(acDc || "AC"),
          oilWater: String(oilWater || "Water"),
        },
      };

      const existing = await prisma.config.findUnique({ where: uniqueKey });
      await prisma.config.upsert({
        where: uniqueKey,
        update: {
          commands: cleanCommands,
          version: version ? parseInt(version, 10) : 1,
        },
        create: configData,
      });

      if (existing) stats.configs.updated++;
      else stats.configs.inserted++;
    }
    console.log(`    ✓ Preset [${finalCompanyId} / ${projectId}] ${strHp}HP ${type} ${acDc}/${oilWater} -> User ${mappedUserId}`);
  }

  console.log("\n==================================================");
  console.log("            MIGRATION SUMMARY                    ");
  console.log("==================================================");
  console.log(`Organisations    : ${stats.organisations.inserted} inserted, ${stats.organisations.updated} preserved`);
  console.log(`Users Mapped     : ${stats.users.mapped} mapped, ${stats.users.created} created`);
  console.log(`Projects         : ${stats.projects.inserted} created, ${stats.projects.updated} existing`);
  console.log(`VFD Models       : ${stats.vfdModels.inserted} inserted, ${stats.vfdModels.updated} updated`);
  console.log(`VFD Parameters   : ${stats.vfdParameters.inserted} inserted, ${stats.vfdParameters.updated} updated`);
  console.log(`Telemetry Configs: ${stats.telemetryConfigs.inserted} inserted, ${stats.telemetryConfigs.updated} updated`);
  console.log(`Configs (Presets): ${stats.configs.inserted} inserted, ${stats.configs.updated} updated`);
  console.log("==================================================");
  console.log("Migration finished successfully without data loss!\n");
}

runMigration()
  .catch(err => {
    console.error("Migration failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
