const express = require("express");
const { prisma } = require("../lib/clients");

const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
        select: {
            projectCode: true,
            name: true
        }
    });
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
