const serviceCenterAssignmentService = require("../service/serviceCenterAssignment");

/**
 * Get suggested service centers for a ticket based on its state
 */
const getSuggestedServiceCenters = async (req, res) => {
  try {
    const { state } = req.query;
    
    if (!state) {
      return res.status(400).json({ message: "State parameter is required" });
    }

    const suggestions = await serviceCenterAssignmentService.getSuggestedServiceCentersForState(state);
    
    res.status(200).json({
      state,
      suggestedServiceCenters: suggestions
    });
  } catch (error) {
    console.error('Error getting suggested service centers:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Assign a service center to a ticket (MACSOFT_SUPPORT only)
 */
const assignServiceCenter = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { centerCode } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has permission to assign service centers
    if (!['MACSOFT_ADMIN', 'MACSOFT_SUPPORT', 'MACSOFT_HEAD'].includes(userRole)) {
      return res.status(403).json({ 
        message: "Only MACSOFT_ADMIN, MACSOFT_SUPPORT, and MACSOFT_HEAD can assign service centers" 
      });
    }

    if (!centerCode) {
      return res.status(400).json({ message: "centerCode is required" });
    }

    const updatedTicket = await serviceCenterAssignmentService.assignServiceCenterToTicket(
      parseInt(ticketId),
      centerCode,
      userId
    );

    res.status(200).json({
      message: "Service center assigned successfully",
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('❌ Controller Error assigning service center:', error);
    console.error('❌ Full error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
    if (error.message.includes('not found') || error.message.includes('not active')) {
      return res.status(400).json({ message: error.message });
    }
    
    // Return more specific error message for debugging
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Remove service center assignment from a ticket
 */
const removeServiceCenterAssignment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has permission to remove service center assignments
    if (!['MACSOFT_ADMIN', 'MACSOFT_SUPPORT', 'MACSOFT_HEAD'].includes(userRole)) {
      return res.status(403).json({ 
        message: "Only MACSOFT_ADMIN, MACSOFT_SUPPORT, and MACSOFT_HEAD can remove service center assignments" 
      });
    }

    const updatedTicket = await serviceCenterAssignmentService.removeServiceCenterAssignment(
      parseInt(ticketId),
      userId
    );

    res.status(200).json({
      message: "Service center assignment removed successfully",
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error removing service center assignment:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all unassigned tickets
 */
const getUnassignedTickets = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Check if user has permission to view unassigned tickets
    if (!['MACSOFT_ADMIN', 'MACSOFT_SUPPORT', 'MACSOFT_HEAD'].includes(userRole)) {
      return res.status(403).json({ 
        message: "Insufficient permissions to view unassigned tickets" 
      });
    }

    const unassignedTickets = await serviceCenterAssignmentService.getUnassignedTickets();

    res.status(200).json({
      count: unassignedTickets.length,
      tickets: unassignedTickets
    });
  } catch (error) {
    console.error('Error fetching unassigned tickets:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get service center statistics and workload
 */
const getServiceCenterStats = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Check if user has permission to view service center stats
    if (!['MACSOFT_ADMIN', 'MACSOFT_SUPPORT', 'MACSOFT_HEAD'].includes(userRole)) {
      return res.status(403).json({ 
        message: "Insufficient permissions to view service center statistics" 
      });
    }

    const stats = await serviceCenterAssignmentService.getServiceCenterTicketStats();

    res.status(200).json({
      serviceCenters: stats
    });
  } catch (error) {
    console.error('Error fetching service center stats:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all service centers with their state assignments
 */
const getServiceCentersWithStates = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Check if user has permission to view service centers
    if (!['MACSOFT_ADMIN', 'MACSOFT_SUPPORT', 'MACSOFT_HEAD'].includes(userRole)) {
      return res.status(403).json({ 
        message: "Insufficient permissions to view service centers" 
      });
    }

    // Extract search filters from query parameters
    const { search, state, stateId } = req.query;
    const filters = { search, state, stateId };

    const serviceCenters = await serviceCenterAssignmentService.getServiceCentersWithStates(filters);

    res.status(200).json({
      serviceCenters
    });
  } catch (error) {
    console.error('Error fetching service centers:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update serviceable states for a service center
 */
const updateServiceCenterStates = async (req, res) => {
  try {
    const { centerCode } = req.params;
    const { states } = req.body;
    const userRole = req.user.role;

    // Check if user has permission to update service center states
    if (!['MACSOFT_ADMIN', 'MACSOFT_HEAD'].includes(userRole)) {
      return res.status(403).json({ 
        message: "Only MACSOFT_ADMIN and MACSOFT_HEAD can update service center states" 
      });
    }

    if (!Array.isArray(states)) {
      return res.status(400).json({ message: "states must be an array" });
    }

    const updatedServiceCenter = await serviceCenterAssignmentService.updateServiceCenterStates(
      centerCode,
      states
    );

    res.status(200).json({
      message: "Service center states updated successfully",
      serviceCenter: updatedServiceCenter
    });
  } catch (error) {
    console.error('Error updating service center states:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getSuggestedServiceCenters,
  assignServiceCenter,
  removeServiceCenterAssignment,
  getUnassignedTickets,
  getServiceCenterStats,
  getServiceCentersWithStates,
  updateServiceCenterStates,
};