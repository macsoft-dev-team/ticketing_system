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
          await model.upsert({
            where: { id },
            update: { ...rest },
            create: { id, ...rest },
          });
        }
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
