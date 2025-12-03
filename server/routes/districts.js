const express = require("express");
const { prisma } = require("../lib/clients");

const router = express.Router();

// Get districts by state ID
router.get("/by-state/:stateId", async (req, res) => {
  try {
    const { stateId } = req.params;

    const districts = await prisma.district.findMany({
      where: {
        stateCode: parseInt(stateId),
      },
      orderBy: {
        districtName: "asc",
      },
    });

    return res.json(districts);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all districts
router.get("/", async (req, res) => {
  try {
    const districts = await prisma.district.findMany({
      include: {
        state: true,
      },
      orderBy: {
        districtName: "asc",
      },
    });

    return res.json(districts);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
