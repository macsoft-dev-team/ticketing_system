const spareRequestService = require("../service/spareRequests");
const moment = require("moment");
async function createSpareRequest(req, res) {
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
    const { skip, take, filter } = req.query;
    const transformedFilter = filter ? JSON.parse(filter) : {};
    const { spareRequests, count } =
      await spareRequestService.getAllSpareRequests(
        skip,
        take,
        transformedFilter
      );

    const _transformSpareRequests = spareRequests.map((request) => {
      return {
        ...request,
        createdAt: moment(request.createdAt).format("DD MMM YYYY, hh:mm A"),
        updatedAt: moment(request.updatedAt).format("DD MMM YYYY, hh:mm A"),
        createdBy: request.createdByUser ? request.createdByUser.name : null,
        updatedBy: request.updatedByUser ? request.updatedByUser.name : null,
      };
    });

    const takeNum = take ? parseInt(take) : 10;
    const skipNum = skip ? parseInt(skip) : 0;

    res.status(200).json({
      spareRequests: _transformSpareRequests,
      totalPages: Math.ceil(count / takeNum),
      currentPage: Math.floor(skipNum / takeNum) + 1,
      total: count,
      skip: skipNum,
      take: takeNum,
    });
  } catch (error) {
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
    const allowedRoles = ["MACSOFT_ADMIN", "MACSOFT_HEAD"];
    const normalizedUserRole = userRole.toUpperCase();

    if (!allowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only MACSOFT_ADMIN and MACSOFT_HEAD can approve/reject spare requests. Your role: ${userRole}`,
      });
    }

    // Validate status values
    const validStatuses = ["pending", "approved", "rejected", "in-progress"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
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
    const allowedRoles = ["MACSOFT_ADMIN", "MACSOFT_HEAD"];
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
    res.status(500).json({
      success: false,
      message: error.message || "Failed to bulk approve spare requests",
    });
  }
}

/**
 * Approve individual spare request item
 * POST /api/spare-requests/:id/approve
 */
async function approveSpareRequestItem(req, res) {
  try {
    const { id } = req.params;
    const { role: userRole, id: userId, name: userName } = req.user;

    // Role-based validation - Only MACSOFT_ADMIN and MACSOFT_HEAD can approve
    const allowedRoles = ["MACSOFT_ADMIN", "MACSOFT_HEAD"];
    const normalizedUserRole = userRole.toUpperCase();

    if (!allowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only MACSOFT_ADMIN and MACSOFT_HEAD can approve spare requests. Your role: ${userRole}`,
      });
    }

    const result = await spareRequestService.approveSpareRequestItem(
      parseInt(id),
      userId,
      userName,
      userRole
    );

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit("spare-request-approved", {
        itemId: parseInt(id),
        approvedBy: userId,
        approvedByRole: userRole,
        timestamp: new Date().toISOString(),
      });

      // If milestone transition occurred, emit milestone update
      if (result.milestoneTransitionResult) {
        const { previousStage, newStage, milestoneId, ticketId } =
          result.milestoneTransitionResult;

        req.io.emit("milestone-updated", {
          ticketId,
          milestoneId,
          previousStage,
          newStage,
          changedBy: userId,
          changedByName: userName,
          changedByRole: userRole,
          isTicketClosed: false,
          ticketStatus: "IN_PROGRESS",
          spareRequestsApproved: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Spare request item approved successfully by ${userRole}`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to approve spare request item",
    });
  }
}

/**
 * Reject individual spare request item
 * POST /api/spare-requests/:id/reject
 */
async function rejectSpareRequestItem(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { role: userRole, id: userId, name: userName } = req.user;

    // Role-based validation - Only MACSOFT_ADMIN and MACSOFT_HEAD can reject
    const allowedRoles = ["MACSOFT_ADMIN", "MACSOFT_HEAD"];
    const normalizedUserRole = userRole.toUpperCase();

    if (!allowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only MACSOFT_ADMIN and MACSOFT_HEAD can reject spare requests. Your role: ${userRole}`,
      });
    }

    const result = await spareRequestService.rejectSpareRequestItem(
      parseInt(id),
      userId,
      userName,
      userRole,
      reason
    );

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit("spare-request-rejected", {
        itemId: parseInt(id),
        rejectedBy: userId,
        rejectedByRole: userRole,
        reason,
        timestamp: new Date().toISOString(),
      });

      // If milestone transition occurred, emit milestone update
      if (result.milestoneTransitionResult) {
        const { previousStage, newStage, milestoneId, ticketId } =
          result.milestoneTransitionResult;

        req.io.emit("milestone-updated", {
          ticketId,
          milestoneId,
          previousStage,
          newStage,
          changedBy: userId,
          changedByName: userName,
          changedByRole: userRole,
          isTicketClosed: false,
          ticketStatus: "IN_PROGRESS",
          spareRequestsProcessed: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Spare request item rejected successfully by ${userRole}`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reject spare request item",
    });
  }
}

/**
 * Get pending spare requests for approval (admin view)
 * GET /api/spare-requests/pending-approval
 */
async function getPendingSpareRequestsForApproval(req, res) {
  try {
    const { role: userRole, id: userId } = req.user;
    const { skip, take } = req.query;

    // Role-based validation - Only MACSOFT_ADMIN and MACSOFT_HEAD can access
    const allowedRoles = ["MACSOFT_ADMIN", "MACSOFT_HEAD"];
    const normalizedUserRole = userRole.toUpperCase();

    if (!allowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only MACSOFT_ADMIN and MACSOFT_HEAD can view pending approvals. Your role: ${userRole}`,
      });
    }

    const { spareRequests, count } =
      await spareRequestService.getPendingSpareRequestsForApproval({
        skip: skip ? parseInt(skip) : 0,
        take: take ? parseInt(take) : 20,
      });

    res.status(200).json({
      success: true,
      data: spareRequests,
      totalCount: count,
      currentPage:
        Math.floor((skip ? parseInt(skip) : 0) / (take ? parseInt(take) : 20)) +
        1,
      totalPages: Math.ceil(count / (take ? parseInt(take) : 20)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch pending spare requests",
    });
  }
}

/**
 * Bulk approve multiple spare request items
 * POST /api/spare-requests/bulk-approve
 */
async function bulkApproveSpareRequestItems(req, res) {
  try {
    const { itemIds } = req.body;
    const { role: userRole, id: userId, name: userName } = req.user;

    // Role-based validation - Only MACSOFT_ADMIN and MACSOFT_HEAD can bulk approve
    const allowedRoles = ["MACSOFT_ADMIN", "MACSOFT_HEAD"];
    const normalizedUserRole = userRole.toUpperCase();

    if (!allowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only MACSOFT_ADMIN and MACSOFT_HEAD can bulk approve spare requests. Your role: ${userRole}`,
      });
    }

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item ID is required for bulk approval",
      });
    }

    const result = await spareRequestService.bulkApproveSpareRequestItems(
      itemIds,
      userId,
      userName,
      userRole
    );

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit("spare-requests-bulk-approved", {
        itemIds,
        approvedBy: userId,
        approvedByRole: userRole,
        timestamp: new Date().toISOString(),
        result,
      });

      // Emit milestone transition events for any tickets that completed
      if (
        result.milestoneTransitions &&
        result.milestoneTransitions.length > 0
      ) {
        result.milestoneTransitions.forEach((transition) => {
          req.io.emit("milestone-updated", {
            ticketId: transition.ticketId,
            milestoneId: transition.milestoneId,
            previousStage: transition.previousStage,
            newStage: transition.newStage,
            changedBy: userId,
            changedByName: userName,
            changedByRole: userRole,
            isTicketClosed: false,
            ticketStatus: "IN_PROGRESS",
            spareRequestsApproved: true,
            timestamp: new Date().toISOString(),
          });
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk approved ${result.successful.length} spare request items successfully`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to bulk approve spare request items",
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
  approveSpareRequestItem,
  rejectSpareRequestItem,
  getPendingSpareRequestsForApproval,
  bulkApproveSpareRequestItems,
};
