/**
 * Map/Clone Configurations to an Existing Customer (e.g. CRI PUMPS - CRIPUMPS001)
 * 
 * Usage:
 *   node map-config-to-customer.js [CUSTOMER_CODE] [PROJECT_CODE] [--dry-run]
 * 
 * Examples:
 *   node map-config-to-customer.js CRIPUMPS001
 *   node map-config-to-customer.js KSB001
 *   node map-config-to-customer.js WAAREE001 PRJ001 --dry-run
 */

const { prisma } = require("../lib/clients");

async function mapConfigsToCustomer() {
  const rawArgs = process.argv.slice(2);
  const isDryRun = rawArgs.includes("--dry-run");
  const cleanArgs = rawArgs.filter(a => !a.startsWith("--"));

  let targetOrgCode = (cleanArgs[0] || "CRIPUMPS001").replace(/["']/g, "").trim();
  let targetProjectCode = (cleanArgs[1] || "").replace(/["']/g, "").trim();

  // Guard: Detect if user accidentally passed a script or SQL filename
  if (targetOrgCode.endsWith(".js") || targetOrgCode.endsWith(".sql") || targetOrgCode.includes("/") || targetOrgCode.includes("\\")) {
    console.error("\n==================================================");
    console.error(" [Error] Invalid Customer Code detected:", targetOrgCode);
    console.error("==================================================");
    console.error("It looks like you passed a file path instead of an existing customer code.");
    console.error("\n1. If you intended to run the RMS SQL Database Migration:");
    console.error(`   Run: node migrate-rms-sql.js ${targetOrgCode.endsWith(".sql") ? `"${targetOrgCode}"` : '"rms_service.sql"'} ${isDryRun ? "--dry-run" : ""}`);
    console.error("\n2. If you intended to map configurations to an existing customer:");
    console.error("   Run: node map-config-to-customer.js [CUSTOMER_CODE]");
    console.error("   Example: node map-config-to-customer.js CRIPUMPS001\n");
    process.exit(1);
  }

  targetOrgCode = targetOrgCode.trim().toUpperCase();

  console.log("==================================================");
  console.log(`   Map Configurations to Existing Customer: [${targetOrgCode}]`);
  console.log("==================================================");
  console.log(`Target Customer Org : ${targetOrgCode}`);
  console.log(`Dry Run Mode        : ${isDryRun ? "YES (No writes)" : "NO"}`);
  console.log("--------------------------------------------------");

  // 1. Look up existing Customer Organisation - DO NOT CREATE
  let org = await prisma.organisation.findFirst({
    where: {
      OR: [
        { orgCode: targetOrgCode },
        { name: { contains: targetOrgCode } },
      ],
    },
  });

  if (!org) {
    const allOrgs = await prisma.organisation.findMany({
      select: { id: true, orgCode: true, name: true, isActive: true },
    });

    console.error(`\n[Error] Customer Organisation [${targetOrgCode}] was NOT found.`);
    console.error("Existing customers currently in your database:");
    if (allOrgs.length === 0) {
      console.error("  (No customers found in database)");
    } else {
      for (const o of allOrgs) {
        console.error(`  - Code: "${o.orgCode}" | Name: "${o.name}" (${o.isActive ? "Active" : "Inactive"})`);
      }
    }
    console.error("\nPlease run with one of the valid Customer Codes listed above.");
    console.error("Example: node map-config-to-customer.js CRIPUMPS001\n");
    process.exit(1);
  }

  console.log(`  ✓ Found existing Customer: [${org.orgCode}] "${org.name}" (ID: ${org.id})`);

  // Ensure customer is active
  if (!org.isActive) {
    if (!isDryRun) {
      await prisma.organisation.update({
        where: { id: org.id },
        data: { isActive: true },
      });
    }
    console.log(`  ✓ Customer [${org.orgCode}] activated.`);
  }

  // 2. Resolve Project for this Customer
  let project = null;
  if (targetProjectCode) {
    project = await prisma.project.findUnique({
      where: { projectCode: targetProjectCode },
    });
  }

  if (!project) {
    // Check if the customer already has an existing project
    project = await prisma.project.findFirst({
      where: { organisationId: org.id },
    });
  }

  if (!project) {
    // Fallback to any existing project like PRJ001
    project = await prisma.project.findFirst();
  }

  const finalProjectCode = project ? project.projectCode : (targetProjectCode || "PRJ001");
  console.log(`  ✓ Using Project: [${finalProjectCode}]`);

  // 3. Find base configurations to clone
  let baseConfigs = await prisma.config.findMany({
    where: { companyId: "MACSOFT" },
  });

  if (baseConfigs.length === 0) {
    baseConfigs = await prisma.config.findMany({ take: 20 });
  }

  if (baseConfigs.length === 0) {
    console.log("  [!] No base configuration presets found in the database.");
    return;
  }

  // De-duplicate base configs by hp, type, acDc, oilWater
  const uniquePresets = new Map();
  for (const c of baseConfigs) {
    const key = `${c.hp}_${c.type}_${c.acDc}_${c.oilWater}`;
    if (!uniquePresets.has(key)) {
      uniquePresets.set(key, c);
    }
  }

  console.log(`  Found ${uniquePresets.size} unique base presets to map.`);

  // 4. Find user for this customer (or admin)
  const defaultUser = await prisma.user.findFirst({
    where: {
      OR: [
        { orgCode: org.orgCode },
        { role: "MACSOFT_ADMIN" },
        { name: "admin" },
      ],
    },
  });
  const userId = defaultUser ? defaultUser.id : 1;

  let mappedCount = 0;
  for (const [key, cfg] of uniquePresets) {
    const uniqueKey = {
      userId_projectId_companyId_hp_type_acDc_oilWater: {
        userId,
        projectId: finalProjectCode,
        companyId: org.orgCode,
        hp: cfg.hp,
        type: cfg.type,
        acDc: cfg.acDc,
        oilWater: cfg.oilWater,
      },
    };

    if (!isDryRun) {
      await prisma.config.upsert({
        where: uniqueKey,
        update: {
          commands: cfg.commands,
          version: cfg.version,
        },
        create: {
          userId,
          projectId: finalProjectCode,
          companyId: org.orgCode,
          hp: cfg.hp,
          type: cfg.type,
          acDc: cfg.acDc,
          oilWater: cfg.oilWater,
          commands: cfg.commands,
          version: cfg.version,
        },
      });
    }
    mappedCount++;
    console.log(`    + Mapped preset: ${cfg.hp}HP ${cfg.type} (${cfg.acDc}/${cfg.oilWater}) -> [${org.orgCode}]`);
  }

  console.log("==================================================");
  console.log(`✓ Successfully mapped ${mappedCount} configuration presets to existing customer ${org.name} (${org.orgCode})!`);
  console.log("==================================================\n");
}

mapConfigsToCustomer()
  .catch((err) => {
    console.error("Mapping error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
