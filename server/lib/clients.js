const { PrismaClient } = require("../prisma/generated/prisma/client");

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL + "?connection_limit=25&pool_timeout=30&sslaccept=strict",
  log: ['warn', 'error'],
});

module.exports = {
  prisma,
};
