const express = require('express');
const { prisma } = require('../lib/clients');

const router = express.Router();

// Get all states without authentication
router.get('/', async (req, res) => {
  try {
    const states = await prisma.state.findMany({
      select: {
        id: true,
        name: true,
        stateCode: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Map to ensure we return consistent format with 'code' field
    const formattedStates = states.map(state => ({
      id: state.id,
      name: state.name,
      code: state.stateCode
    }));

    res.json(formattedStates);
  } catch (error) {
    console.error("Error fetching states:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;