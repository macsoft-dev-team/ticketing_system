const express = require('express');
const router = express.Router();
const serviceCenterAssignmentController = require('../controller/serviceCenterAssignment');
const authenticate = require('../middleware/authenticate');

// Get suggested service centers for a state
router.get('/suggested', authenticate, serviceCenterAssignmentController.getSuggestedServiceCenters);

// Get all unassigned tickets
router.get('/unassigned-tickets', authenticate, serviceCenterAssignmentController.getUnassignedTickets);

// Get service center statistics
router.get('/stats', authenticate, serviceCenterAssignmentController.getServiceCenterStats);

// Get all service centers with their state assignments
router.get('/service-centers', authenticate, serviceCenterAssignmentController.getServiceCentersWithStates);

// Assign service center to a ticket
router.post('/tickets/:ticketId/assign', authenticate, serviceCenterAssignmentController.assignServiceCenter);

// Remove service center assignment from a ticket
router.delete('/tickets/:ticketId/assign', authenticate, serviceCenterAssignmentController.removeServiceCenterAssignment);

// Update serviceable states for a service center
router.put('/service-centers/:centerCode/states', authenticate, serviceCenterAssignmentController.updateServiceCenterStates);

module.exports = router;