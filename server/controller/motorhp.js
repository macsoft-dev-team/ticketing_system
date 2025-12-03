const motorhpService = require("../service/motorhp");
const moment = require("moment");

const getMotorHPs = async (req, res) => {
  try {
    const { skip, take, filter } = req.query;
    const { motorhps, count } = await motorhpService.getMotorHPs(
      skip,
      take,
      filter
    );
    const transformMotorHPs = motorhps.map((motorhp) => ({
      id: motorhp.id,
      label: motorhp.label,
      value: motorhp.value,
      sortOrder: motorhp.sortOrder,
      active: motorhp.active,
      createdAt: moment(motorhp.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: moment(motorhp.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.status(200).json({
      motorhps: transformMotorHPs,
      totalPages: Math.ceil(count / (take || 10)),
      currentPage: parseInt(skip) || 1,
      totalCount: count
    });
  } catch (error) {
    console.error("Error fetching motor HPs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getMotorHPById = async (req, res) => {
  const { id } = req.params;
  try {
    const motorhp = await motorhpService.getMotorHPById(id);
    if (!motorhp) {
      return res.status(404).json({ error: "Motor HP not found" });
    }
    res.json(motorhp);
  } catch (error) {
    console.error("Error fetching motor HP by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createMotorHP = async (req, res) => {
  const motorhpData = req.body;
  try {
    // Validate required fields
    if (!motorhpData.label || !motorhpData.value) {
      return res.status(400).json({ 
        error: "Label and value are required fields" 
      });
    }

    const newMotorHP = await motorhpService.createMotorHP(motorhpData);
    res.status(201).json({
      message: "Motor HP created successfully",
      motorhp: newMotorHP
    });
  } catch (error) {
    console.error("Error creating motor HP:", error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: "Motor HP with this label already exists" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

const updateMotorHP = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    // Validate required fields
    if (!updateData.label || !updateData.value) {
      return res.status(400).json({ 
        error: "Label and value are required fields" 
      });
    }

    const updatedMotorHP = await motorhpService.updateMotorHP(id, updateData);
    res.json({
      message: "Motor HP updated successfully",
      motorhp: updatedMotorHP
    });
  } catch (error) {
    console.error("Error updating motor HP:", error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: "Motor HP with this label already exists" });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: "Motor HP not found" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

const deleteMotorHP = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedMotorHP = await motorhpService.deleteMotorHP(id);
    res.json({
      message: "Motor HP deleted successfully",
      motorhp: deletedMotorHP
    });
  } catch (error) {
    console.error("Error deleting motor HP:", error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: "Motor HP not found" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

const getAllActiveMotorHPs = async (req, res) => {
  try {
    const motorhps = await motorhpService.getAllActiveMotorHPs();
    res.json(motorhps);
  } catch (error) {
    console.error("Error fetching active motor HPs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getMotorHPs,
  getMotorHPById,
  createMotorHP,
  updateMotorHP,
  deleteMotorHP,
  getAllActiveMotorHPs
};