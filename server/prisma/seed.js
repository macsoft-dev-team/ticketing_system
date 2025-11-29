const { prisma } = require("../lib/clients");

const fs = require("fs");
const path = require("path");

async function main() {
  const files = [
    "organisation",
    "project",
    "serviceCenter",
    "user",
    "product",
    "state",
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
