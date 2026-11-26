/**
 * Map/Clone Configurations to a Specific Customer (e.g. CRI PUMPS - CRIPUMPS001)
 * 
 * Usage:
 *   node scripts/map-config-to-customer.js [targetOrgCode] [targetProjectId]
 * 
 * Example:
 *   node scripts/map-config-to-customer.js CRIPUMPS001 PRJ001
 */

const { prisma } = require("../lib/clients");

async function mapConfigsToCustomer() {
  const targetOrgCode = process.argv[2] || "CRIPUMPS001";
  const targetProjectCode = process.argv[3] || "PRJ001";

  console.log(`\nMapping configurations to Customer: [${targetOrgCode}]...`);

  // 1. Ensure target Organisation exists and is ACTIVE
  let org = await prisma.organisation.findUnique({
    where: { orgCode: targetOrgCode },
  });

  if (!org) {
    console.log(`  Creating Organisation [${targetOrgCode}]...`);
    org = await prisma.organisation.create({
      data: {
        name: targetOrgCode === "CRIPUMPS001" ? "CRI PUMPS" : targetOrgCode,
        orgCode: targetOrgCode,
        email: "solar@cripumps.com",
        phone: "9962264503",
        address: "COIMBATORE",
        isActive: true,
      },
    });
    console.log(`  ✓ Organisation [${targetOrgCode}] created and marked ACTIVE.`);
  } else if (!org.isActive) {
    await prisma.organisation.update({
      where: { orgCode: targetOrgCode },
      data: { isActive: true },
    });
    console.log(`  ✓ Organisation [${targetOrgCode}] activated.`);
  } else {
    console.log(`  ✓ Organisation [${targetOrgCode}] already exists (Active).`);
  }

  // 2. Ensure Project exists under this Customer
  let project = await prisma.project.findUnique({
    where: { projectCode: targetProjectCode },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        projectCode: targetProjectCode,
        name: `${org.name} Project ${targetProjectCode}`,
        organisationId: org.id,
        isActive: true,
      },
    });
    console.log(`  ✓ Project [${targetProjectCode}] created for ${org.name}.`);
  }

  // 3. Find base configurations (e.g. from MACSOFT)
  const baseConfigs = await prisma.config.findMany({
    where: { companyId: "MACSOFT" },
  });

  if (baseConfigs.length === 0) {
    console.log("  No base configurations found under MACSOFT to clone.");
    return;
  }

  console.log(`  Found ${baseConfigs.length} base configuration presets under MACSOFT.`);

  // 4. Find or use default engineer / admin user for CRI
  let defaultUser = await prisma.user.findFirst({
    where: {
      OR: [
        { orgCode: targetOrgCode },
        { role: "MACSOFT_ADMIN" },
        { name: "admin" },
      ],
    },
  });

  const userId = defaultUser ? defaultUser.id : 1;

  let mappedCount = 0;
  for (const cfg of baseConfigs) {
    const uniqueKey = {
      userId_projectId_companyId_hp_type_acDc_oilWater: {
        userId,
        projectId: targetProjectCode,
        companyId: targetOrgCode,
        hp: cfg.hp,
        type: cfg.type,
        acDc: cfg.acDc,
        oilWater: cfg.oilWater,
      },
    };

    await prisma.config.upsert({
      where: uniqueKey,
      update: {
        commands: cfg.commands,
        version: cfg.version,
      },
      create: {
        userId,
        projectId: targetProjectCode,
        companyId: targetOrgCode,
        hp: cfg.hp,
        type: cfg.type,
        acDc: cfg.acDc,
        oilWater: cfg.oilWater,
        commands: cfg.commands,
        version: cfg.version,
      },
    });
    mappedCount++;
    console.log(`    + Mapped: ${cfg.hp}HP ${cfg.type} (${cfg.acDc}/${cfg.oilWater}) -> [${targetOrgCode}]`);
  }

  console.log(`\n✓ Successfully mapped ${mappedCount} configuration presets to ${org.name} (${targetOrgCode})!`);
}

mapConfigsToCustomer()
  .catch((err) => {
    console.error("Mapping error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
