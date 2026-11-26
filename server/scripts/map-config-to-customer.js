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

const fs = require("fs");
const path = require("path");
const { prisma } = require("../lib/clients");

// Built-in standard RMS presets as automatic fallback
const DEFAULT_PRESETS = [
  { hp: "3", type: "Openwell", acDc: "AC", oilWater: "Water", commands: "wvfd:4096=300,4097=30,4098=415,4099=50,4100=300,4101=10,4102=70,4103=15,4104=80", version: 1 },
  { hp: "5", type: "Submersible", acDc: "AC", oilWater: "Water", commands: "wvfd:4096=500,4097=100,4098=415,4099=50,4100=500,4101=15,4102=80,4103=20,4104=100", version: 1 },
  { hp: "5", type: "Submersible", acDc: "DC", oilWater: "Water", commands: "wvfd:4096=500,4097=100,4098=240,4099=50,4100=550,4101=18,4102=75,4103=22,4104=110", version: 1 },
  { hp: "7.5", type: "Submersible", acDc: "AC", oilWater: "Water", commands: "wvfd:4096=750,4097=150,4098=415,4099=50,4100=750,4101=20,4102=85,4103=25,4104=120", version: 1 },
  { hp: "10", type: "Openwell", acDc: "AC", oilWater: "Water", commands: "wvfd:4096=1000,4097=50,4098=415,4099=50,4100=1000,4101=25,4102=90,4103=30,4104=150", version: 1 },
  { hp: "15", type: "Submersible", acDc: "AC", oilWater: "Water", commands: "wvfd:4096=1500,4097=200,4098=415,4099=50,4100=1500,4101=35,4102=95,4103=40,4104=200", version: 1 },
  { hp: "20", type: "Submersible", acDc: "AC", oilWater: "Water", commands: "wvfd:4096=2000,4097=250,4098=415,4099=50,4100=2000,4101=45,4102=100,4103=50,4104=250", version: 1 }
];

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
    console.error("\n1. To run the RMS SQL Database Migration:");
    console.error(`   Run: node migrate-rms-sql.js ${targetOrgCode.endsWith(".sql") ? `"${targetOrgCode}"` : '"rms_service.sql"'} ${isDryRun ? "--dry-run" : ""}`);
    console.error("\n2. To map configurations to an existing customer (e.g. CRI PUMPS):");
    console.error("   Run: node map-config-to-customer.js CRIPUMPS001");
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

    console.error(`\n[Error] Customer Organisation [${targetOrgCode}] was NOT found in the database.`);
    console.error("Existing customers currently in your database:");
    if (allOrgs.length === 0) {
      console.error("  (No customers found in database)");
    } else {
      for (const o of allOrgs) {
        console.error(`  - Code: "${o.orgCode}" | Name: "${o.name}" (${o.isActive ? "Active" : "Inactive"})`);
      }
    }
    console.error("\nPlease specify one of the valid Customer Codes listed above.");
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
    project = await prisma.project.findFirst({
      where: { organisationId: org.id },
    });
  }

  if (!project) {
    project = await prisma.project.findFirst();
  }

  const finalProjectCode = project ? project.projectCode : (targetProjectCode || "PRJ001");
  console.log(`  ✓ Using Project: [${finalProjectCode}]`);

  // 3. Find base configurations: Try DB first, fallback to standard presets
  let basePresets = [];
  const existingDbConfigs = await prisma.config.findMany({ take: 50 });

  if (existingDbConfigs.length > 0) {
    console.log(`  Found ${existingDbConfigs.length} configurations in DB to use as base.`);
    const uniqueMap = new Map();
    for (const c of existingDbConfigs) {
      const key = `${c.hp}_${c.type}_${c.acDc}_${c.oilWater}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          hp: c.hp,
          type: c.type,
          acDc: c.acDc,
          oilWater: c.oilWater,
          commands: c.commands,
          version: c.version || 1,
        });
      }
    }
    basePresets = Array.from(uniqueMap.values());
  } else {
    console.log("  No existing configs in database yet. Using standard RMS default pump presets.");
    basePresets = DEFAULT_PRESETS;
  }

  console.log(`  Ready to map ${basePresets.length} pump presets.`);

  // 4. Find valid user ID for this customer or system admin
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
  for (const cfg of basePresets) {
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
          version: cfg.version || 1,
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
          version: cfg.version || 1,
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
