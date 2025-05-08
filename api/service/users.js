const { prisma } = require("../lib/clients");
const { hashPassword } = require("../lib/hashPassword");

const getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: "ADMIN",
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch users");
  }
};

module.exports = {
  getAll,
};
