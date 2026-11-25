const { prisma } = require("../lib/clients");

async function main() {
  console.log("Checking for rms_service database tables...");

  try {
    // 1. Migrate VfdModel
    const existingModels = await prisma.vfdModel.count();
    if (existingModels === 0) {
      console.log("Migrating vfd_models...");
      await prisma.$executeRawUnsafe(`
        INSERT INTO ticketing.vfd_models (id, modelCode, modelName, manufacturer, daddCommand, description, isActive, createdAt, updatedAt, errorCodes, statusCodes)
        SELECT id, modelCode, modelName, manufacturer, daddCommand, description, isActive, createdAt, updatedAt, errorCodes, statusCodes
        FROM rms_service.vfd_models
        ON DUPLICATE KEY UPDATE modelName=VALUES(modelName);
      `);
      console.log("vfd_models migrated successfully.");
    } else {
      console.log(`vfd_models already has ${existingModels} records.`);
    }

    // 2. Migrate VfdParameter
    const existingParams = await prisma.vfdParameter.count();
    if (existingParams === 0) {
      console.log("Migrating vfd_parameters...");
      await prisma.$executeRawUnsafe(`
        INSERT INTO ticketing.vfd_parameters (id, vfdModel, paramName, address, value, createdAt, updatedAt)
        SELECT id, vfdModel, paramName, address, value, createdAt, updatedAt
        FROM rms_service.vfd_parameters
        ON DUPLICATE KEY UPDATE paramName=VALUES(paramName);
      `);
      console.log("vfd_parameters migrated successfully.");
    } else {
      console.log(`vfd_parameters already has ${existingParams} records.`);
    }

    // 3. Migrate TelemetryConfig
    const existingTelemetry = await prisma.telemetryConfig.count();
    if (existingTelemetry === 0) {
      console.log("Migrating telemetry_configs...");
      await prisma.$executeRawUnsafe(`
        INSERT INTO ticketing.telemetry_configs (id, vfdModel, cmdKey, displayName, unit, scaleFactor, decimals, defaultAddr, kpiTarget, sortOrder, createdAt, updatedAt)
        SELECT id, vfdModel, cmdKey, displayName, unit, scaleFactor, decimals, defaultAddr, kpiTarget, sortOrder, createdAt, updatedAt
        FROM rms_service.telemetry_configs
        ON DUPLICATE KEY UPDATE displayName=VALUES(displayName);
      `);
      console.log("telemetry_configs migrated successfully.");
    } else {
      console.log(`telemetry_configs already has ${existingTelemetry} records.`);
    }

    // 4. Ensure users exist for Config foreign key, then migrate Configs
    const fs = require("fs");
    const userPath = "./prisma/seeders/user.json";
    if (fs.existsSync(userPath)) {
      const users = JSON.parse(fs.readFileSync(userPath, "utf8"));
      for (const u of users) {
        await prisma.user.upsert({ where: { id: u.id }, update: u, create: u });
      }
      console.log(`Seeded ${users.length} users.`);
    }

    const existingConfigs = await prisma.config.count();
    if (existingConfigs === 0) {
      console.log("Migrating configs...");
      await prisma.$executeRawUnsafe(`
        INSERT INTO ticketing.configs (id, userId, projectId, companyId, hp, type, acDc, oilWater, commands, version, createdAt, updatedAt)
        SELECT id, userId, projectId, companyId, hp, type, acDc, oilWater, commands, version, createdAt, updatedAt
        FROM rms_service.configs
        ON DUPLICATE KEY UPDATE commands=VALUES(commands);
      `);
      console.log("configs migrated successfully.");
    } else {
      console.log(`configs already has ${existingConfigs} records.`);
    }

    const counts = {
      vfdModels: await prisma.vfdModel.count(),
      vfdParameters: await prisma.vfdParameter.count(),
      telemetryConfigs: await prisma.telemetryConfig.count(),
    };
    console.log("Migration complete! Current counts:", counts);
  } catch (error) {
    console.error("Migration error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
