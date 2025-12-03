const express = require("express");
const { prisma } = require("../lib/clients");

const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const organisations = await prisma.organisation.findMany({
      select: {
        orgCode: true,
        name: true,
      },
    });
    res.json(organisations);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
