const express = require("express");
const { prisma } = require("../lib/clients");

const router = express.Router();

// Get all states without authentication
router.get("/", async (req, res) => {
  try {
    const states = await prisma.state.findMany({
      include: {
        districts: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Map to ensure we return consistent format with 'code' field
    const formattedStates = states.map((state) => ({
      id: state.id,
      name: state.name,
      code: state.stateCode,
      districts: state.districts,
    }));

    res.json(formattedStates);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
