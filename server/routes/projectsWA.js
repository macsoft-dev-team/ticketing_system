const express = require("express");
const { prisma } = require("../lib/clients");

const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        isActive: true, // Only fetch active projects
      },
      select: {
        projectCode: true,
        name: true,
        address: true,
        state: {
          select: {
            id: true,
            name: true,
            stateCode: true,
          },
        },
        organisation: {
          select: {
            id: true,
            name: true,
            orgCode: true,
            address: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
