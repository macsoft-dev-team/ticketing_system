const express = require('express');
const router = express.Router();
const motorhpController = require('../controller/motorhp');

// Get all motor HPs with pagination and filtering
router.get('/', motorhpController.getMotorHPs);

// Get all active motor HPs for dropdowns
router.get('/active', motorhpController.getAllActiveMotorHPs);

// Get motor HP by ID
router.get('/:id', motorhpController.getMotorHPById);

// Create new motor HP
router.post('/', motorhpController.createMotorHP);

// Update motor HP
router.put('/:id', motorhpController.updateMotorHP);

// Delete motor HP (soft delete)
router.delete('/:id', motorhpController.deleteMotorHP);

module.exports = router;