const { prisma } = require("../lib/clients");

const fs = require("fs");
const path = require("path");

async function main() {
  // Seed BuzzerAlertConfig first
  try {
    await prisma.buzzerAlertConfig.upsert({
      where: { id: 1 },
      update: {
        minHours: 3,
        minMinutes: 0,
        minSeconds: 0,
        maxHours: 5,
        maxMinutes: 0,
        maxSeconds: 0,
        isActive: true,
        description: "Time window for buzzer alerts when customer messages are pending"
      },
      create: {
        id: 1,
        minHours: 3,
        minMinutes: 0,
        minSeconds: 0,
        maxHours: 5,
        maxMinutes: 0,
        maxSeconds: 0,
        isActive: true,
        description: "Time window for buzzer alerts when customer messages are pending"
      }
    });
    console.log(`✓ Successfully seeded BuzzerAlertConfig`);
  } catch (error) {
    console.error(`Error seeding BuzzerAlertConfig:`, error);
  }

  const files = [
  /*   "organisation",
    "project",
    "serviceCenter",
    "user",
    "product",
    "state", */
    "motorhp",
    "district",
  ];

  for (const file of files) {
    const dataPath = path.join(__dirname, `./seeders/${file}.json`);
    if (fs.existsSync(dataPath)) {
      try {
        const data = fs.readFileSync(dataPath, "utf8");
        const json = JSON.parse(data);
        const model = prisma[file];
        
        for (const item of json) {
          const { id, ...rest } = item; // Extract id and the rest of the fields
          
          // Handle different models with different unique constraints
          let whereClause = { id };
          
          // For Project model, use projectCode for upsert to avoid constraint violations
          if (file === 'project' && item.projectCode) {
            whereClause = { projectCode: item.projectCode };
          }
          // For ServiceCenter model, use centerCode for upsert
          else if (file === 'serviceCenter' && item.centerCode) {
            whereClause = { centerCode: item.centerCode };
          }
          // For Organisation model, use orgCode for upsert
          else if (file === 'organisation' && item.orgCode) {
            whereClause = { orgCode: item.orgCode };
          }
          // For MotorHP model, use label for upsert
          else if (file === 'motorhp' && item.label) {
            whereClause = { label: item.label };
          }
          
          await model.upsert({
            where: whereClause,
            update: { ...rest },
            create: { id, ...rest },
          });
        }
        console.log(`✓ Successfully seeded ${file}`);
      } catch (error) {
        console.error(`Error processing file ${file}.json:`, error);
      }
    } else {
      console.warn(`File ${file}.json not found.`);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
