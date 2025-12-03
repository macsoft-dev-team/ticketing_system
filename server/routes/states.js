const express = require("express");
const { prisma } = require("../lib/clients");

const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const states = await prisma.state.findMany();
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
