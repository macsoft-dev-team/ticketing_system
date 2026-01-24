const { PrismaClient } = require("../prisma/generated/prisma/client");

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: ['warn', 'error'],
});

module.exports = {
  prisma,
};
