const express = require("express");
const router = express.Router();
const serviceCenterController = require("../controller/serviceCenter");

// Get all service centers with pagination, filtering, and search
router.get("/", serviceCenterController.getAll);

// Get a specific service center by ID
router.get("/:id", serviceCenterController.getById);

// Create a new service center
router.post("/", serviceCenterController.createServiceCenter);

// Update a service center
router.put("/:id", serviceCenterController.updateServiceCenter);

// Delete a service center
router.delete("/:id", serviceCenterController.deleteServiceCenter);

module.exports = router;