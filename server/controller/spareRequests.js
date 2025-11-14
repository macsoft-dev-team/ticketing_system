const spareRequestService = require("../service/spareRequests");
const moment = require("moment");
async function createSpareRequest(req, res) {
  console.log('🚀 Spare request creation started');
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  console.log('👤 User ID:', req.user?.id, 'Role:', req.user?.role);
  
  try {
    const userId = req.user.id; // From authentication middleware
    const userRole = req.user.role; // Get user role
    const {
      ticketCode,
      spareItems,
      requestReason,
      urgencyLevel,
      expectedDelivery,
      additionalNotes,
    } = req.body;

    // Validate required fields
    if (!ticketCode) {
      return res.status(400).json({
        success: false,
        message: "Ticket code is required",
      });
    }

    if (!spareItems || !Array.isArray(spareItems) || spareItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one spare item is required",
      });
    }

    // Validate each spare item
    for (const item of spareItems) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "Each spare item must have productId and quantity",
        });
      }

      if (item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }
    }

    const spareRequest = await spareRequestService.createSpareRequest({
      ticketCode,
      createdBy: userId,
      userRole: userRole,
      spareItems,
      requestReason,
      urgencyLevel,
      expectedDelivery,
      additionalNotes,
      io: req.io, // Pass socket.io instance
    });

    // Emit socket event for real-time notification
    if (req.io) {
      req.io.emit("spare-request-created", {
        ticketCode,
        spareRequestId: spareRequest.id,
        createdBy: userId,
      });
    }

    res.status(201).json({
      success: true,
      message: "Spare request created successfully and milestone updated",
      data: spareRequest,
    });
  } catch (error) {
    console.error("❌ Error in createSpareRequest controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create spare request",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

async function getSpareRequestsByTicket(req, res) {
  try {
    const { ticketCode } = req.params;

    const spareRequests = await spareRequestService.getSpareRequestsByTicket(
      ticketCode
    );

    res.status(200).json({
      success: true,
      data: spareRequests,
    });
  } catch (error) {
    console.error("❌ Error in getSpareRequestsByTicket controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch spare requests",
    });
  }
}

async function updateSpareRequestStatus(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const spareRequest = await spareRequestService.updateSpareRequestStatus(
      parseInt(id),
      {
        status,
        updatedBy: userId,
      }
    );

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit("spare-request-updated", {
        spareRequestId: spareRequest.id,
        status,
        updatedBy: userId,
      });
    }

    res.status(200).json({
      success: true,
      message: "Spare request status updated successfully",
      data: spareRequest,
    });
  } catch (error) {
    console.error("❌ Error in updateSpareRequestStatus controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update spare request status",
    });
  }
}

/**
 * Get all spare requests (with optional filters)
 * GET /api/spare-requests
 */
async function getAllSpareRequests(req, res) {
  try {
    const { skip, take, filters } = req.query;

    const { spareRequests, count } =
      await spareRequestService.getAllSpareRequests(skip, take, filters);
    const _transformSpareRequests = spareRequests.map((request) => {
      return {
        ...request,
        createdAt: moment(request.createdAt).toISOString(),
        updatedAt: moment(request.updatedAt).toISOString(),
        createdBy: request.createdByUser ? request.createdByUser.name : null,
        updatedBy: request.updatedByUser ? request.updatedByUser.name : null,
      };
    });

    res.status(200).json({
      spareRequests: _transformSpareRequests,
      totalPages: Math.ceil(count / (take || 10)),
      currentPage: parseInt(skip) || 1,
    });
  } catch (error) {
    console.error("❌ Error in getAllSpareRequests controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch spare requests",
    });
  }
}

/**
 * Update spare request item status - Role-based validation
 * PUT /api/spare-requests/items/:itemId/status
 */
async function updateSpareRequestItemStatus(req, res) {
  try {
    const { itemId } = req.params;
    const { status } = req.body;
    const { role: userRole, id: userId } = req.user;

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Role-based validation - Only MACSOFT_ADMIN and MACSOFT_HEAD can approve/reject
    const allowedRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD'];
    const normalizedUserRole = userRole.toUpperCase();
    
    if (!allowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only MACSOFT_ADMIN and MACSOFT_HEAD can approve/reject spare requests. Your role: ${userRole}`,
      });
    }

    // Validate status values
    const validStatuses = ['pending', 'approved', 'rejected', 'in-progress'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
      });
    }

    const item = await spareRequestService.updateSpareRequestItemStatus(
      parseInt(itemId),
      status,
      userId
    );

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit("spare-request-item-updated", {
        itemId: parseInt(itemId),
        status,
        updatedBy: userId,
        updatedByRole: userRole,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      message: `Spare request item ${status} successfully by ${userRole}`,
      data: item,
    });
  } catch (error) {
    console.error(
      "❌ Error in updateSpareRequestItemStatus controller:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update spare request item status",
    });
  }
}

/**
 * Bulk approve all spare requests for a ticket
 * PUT /api/spare-requests/ticket/:ticketCode/bulk-approve
 */
async function bulkApproveSpareRequestsByTicket(req, res) {
  try {
    const { ticketCode } = req.params;
    const { role: userRole, id: userId } = req.user;

    // Role-based validation - Only MACSOFT_ADMIN and MACSOFT_HEAD can bulk approve
    const allowedRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD'];
    const normalizedUserRole = userRole.toUpperCase();
    
    if (!allowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only MACSOFT_ADMIN and MACSOFT_HEAD can bulk approve spare requests. Your role: ${userRole}`,
      });
    }

    const result = await spareRequestService.bulkApproveSpareRequestsByTicket(
      ticketCode,
      userId
    );

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit("spare-requests-bulk-approved", {
        ticketCode,
        approvedBy: userId,
        approvedByRole: userRole,
        timestamp: new Date().toISOString(),
        approvalResult: result,
      });
    }

    res.status(200).json({
      success: true,
      message: `Bulk approved ${result.approvedRequests} spare requests with ${result.approvedItems} items for ticket ${ticketCode}`,
      data: result,
    });
  } catch (error) {
    console.error(
      "❌ Error in bulkApproveSpareRequestsByTicket controller:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to bulk approve spare requests",
    });
  }
}

module.exports = {
  createSpareRequest,
  getSpareRequestsByTicket,
  updateSpareRequestStatus,
  getAllSpareRequests,
  updateSpareRequestItemStatus,
  bulkApproveSpareRequestsByTicket,
};
