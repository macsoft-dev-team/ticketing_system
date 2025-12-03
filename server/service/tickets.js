const { prisma } = require("../lib/clients");
const {
  generateTicketFileUrl,
  ensureTicketDirectory,
} = require("../lib/ticket_file_handler");
const {
  createTicketNotification,
  saveAndBroadcastNotification,
} = require("../lib/notificationUtils");
const { createMilestone } = require("./milestones");
const { generateTicketCode } = require("../lib/ticketCodeGenerator");
const { getStageConfig } = require("../lib/milestoneConfig");
const fs = require("fs");
const path = require("path");

const getTickets = async (skip, take, filter, userId, role) => {
  try {
    // Base params (includes + ordering)
    const params = {
      include: {
        createdByUser: true,
        updatedByUser: true,
        serviceCenter: {
          select: {
            id: true,
            name: true,
            centerCode: true,
            address: true,
          },
        },
        messages: {
          include: {
            sender: true,
            attachments: true,
          },
        },
        notifications: {
          include: {
            recipients: true,
          },
        },
        attachments: true,
        ticketMilestones: {
          include: {
            changer: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            attachments: true,
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    };

    // Pagination: treat `skip` as 1-based page number (same semantics as before)
    const pageNum = Number.isFinite(parseInt(skip, 10))
      ? parseInt(skip, 10)
      : 0;
    const pageSize = Number.isFinite(parseInt(take, 10))
      ? parseInt(take, 10)
      : 10;
    if (pageNum > 0) params.skip = (pageNum - 1) * pageSize;
    if (pageSize > 0) params.take = pageSize;

    // Start composing where clause
    const where = {};

    // Text search (trim + case-insensitive where supported)
    if (filter && filter.search) {
      const s = String(filter.search).trim();
      if (s.length > 0) {
        // `mode: "insensitive"` works on supported connectors (MySQL/Postgres)
        where.OR = [
          { ticketCode: { contains: s } },
          { description: { contains: s } },
          { customerName: { contains: s } },
          { controllerNo: { contains: s } },
          { imei: { contains: s } },
          { hp: { contains: s } },
          { motorType: { contains: s } },
          { stateCode: { contains: s } },
          { district: { contains: s } },
          { village: { contains: s } },
          { block: { contains: s } },
          { complaintType: { contains: s } },
          { faultCode: { contains: s } },
        ];
      }
    }

    // status filter
    if (filter && filter.status) {
      where.status = filter.status;
    }

    // milestone stage filter - filter tickets by their milestone stage and status
    if (filter && filter.milestoneStage) {
      where.ticketMilestones = {
        some: {
          stage: filter.milestoneStage,
          status: 'IN_PROGRESS' // Filter by milestones that are in progress
        }
      };
    }

    // Fetch the calling user (we need centerCode + primary State + assigned states)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        centerCode: true,
        State: { select: { id: true, name: true, stateCode: true } }, // primary state
        states: { select: { id: true, name: true, stateCode: true } }, // assigned states (array)
      },
    });

    // Build allowed states set from Customer Service Head: primary state + states array
    const allowedStateNames = new Set();
    const allowedStateIds = new Set();

    if (user?.State?.name) allowedStateNames.add(user.State.name);
    if (user?.State?.id) allowedStateIds.add(user.State.id);
    (user?.states || []).forEach((s) => {
      if (s?.name) allowedStateNames.add(s.name);
      if (s?.id) allowedStateIds.add(s.id);
    });

    const allowedStateNamesArr = Array.from(allowedStateNames);
    const allowedStateIdsArr = Array.from(allowedStateIds);

    // -------------------------
    // Role-based RBAC on `where` (applies to the ticket list & count)
    if (role === "CUSTOMER_FIELD_ENGINEER") {
      // Only tickets created by this user
      where.createdBy = userId;
    } else if (role === "SERVICE_CENTER_TECHNICIAN") {
      // Only tickets assigned to technician's service center
      if (user?.centerCode) {
        where.assignedServiceCenter = user.centerCode;
      } else {
        // No center => no tickets
        where.id = -1;
      }
    } else if (role === "CUSTOMER_SERVICE_HEAD") {
      // CSH sees tickets only if the ticket creator's primary state (createdByUser.stateId)
      // is in the CSH's allowed state IDs (primary + assigned states).
      if (allowedStateIdsArr.length) {
        where.AND = [
          { createdByUser: { stateId: { in: allowedStateIdsArr } } },
        ];
        // NOTE:
        // - If you also want to restrict by the ticket.state string (the ticket's own state name),
        //   add `{ state: { in: allowedStateNamesArr } }` into the AND array.
        // - Current behavior enforces: creator's primary state must be one of CSH's allowed states.
      } else {
        // head has no allowed states => no tickets
        where.id = -1;
      }
    } else {
      // MACSOFT_ADMIN / MACSOFT_HEAD / MACSOFT_SUPPORT -> no additional filters (global)
    }

    // Important: attach composed where to params
    params.where = where;

    // -------------------------
    // Build statusCountWhere and milestoneCountWhere using same RBAC rules
    let statusCountWhere = {};
    let milestoneCountWhere = {
      stage: {
        in: [
          "TICKET_RAISED",
          "SENT_TO_SERVICE_CENTER",
          "RECEIVED_AT_SERVICE_CENTER",
        ],
      },
      ticket: {
        status: { not: "CLOSED" },
      },
    };

    if (role === "CUSTOMER_FIELD_ENGINEER") {
      statusCountWhere = { createdBy: userId };
      milestoneCountWhere.ticket.createdBy = userId;
    } else if (role === "SERVICE_CENTER_TECHNICIAN") {
      if (user?.centerCode) {
        statusCountWhere = { assignedServiceCenter: user.centerCode };
        milestoneCountWhere.ticket.assignedServiceCenter = user.centerCode;
      } else {
        statusCountWhere = { id: -1 };
        milestoneCountWhere.ticket.id = -1;
      }
    } else if (role === "CUSTOMER_SERVICE_HEAD") {
      if (allowedStateIdsArr.length) {
        // Mirror logic used for fetching tickets: only counts for tickets
        // where createdByUser.stateId is in allowedStateIdsArr.
        statusCountWhere = {
          AND: [{ createdByUser: { stateId: { in: allowedStateIdsArr } } }],
        };

        // Also apply same AND within milestone ticket filter (plus stage + not closed)
        milestoneCountWhere.ticket = {
          ...milestoneCountWhere.ticket,
          AND: [{ createdByUser: { stateId: { in: allowedStateIdsArr } } }],
        };
      } else {
        statusCountWhere = { id: -1 };
        milestoneCountWhere.ticket.id = -1;
      }
    } else {
      // MACSOFT_*: global counts (no filter)
      statusCountWhere = {};
      // milestoneCountWhere stays as-is (stage + ticket.status not closed)
    }

    // -------------------------
    // Run queries in parallel for speed
    const [
      ticketsStatusCount,
      ticketsMilestoneCount,
      totalFilteredCount,
      tickets,
    ] = await Promise.all([
      prisma.ticket.groupBy({
        by: ["status"],
        _count: { status: true },
        where: statusCountWhere,
      }),
      prisma.ticketMilestone.groupBy({
        by: ["stage"],
        _count: { id: true },
        where: milestoneCountWhere,
      }),
      prisma.ticket.count({ where: params.where }), // respects RBAC + filters
      prisma.ticket.findMany(params),
    ]);

    // transform grouped results into simple objects
    const _transformedMilestoneCount = {};
    ticketsMilestoneCount.forEach((m) => {
      _transformedMilestoneCount[m.stage] = m._count.id;
    });

    const _transformedStatusCount = {};
    ticketsStatusCount.forEach((s) => {
      _transformedStatusCount[s.status] = s._count.status;
    });

    // ALL count (respecting RBAC for counts)
    _transformedStatusCount.ALL = await prisma.ticket.count({
      where: statusCountWhere,
    });

    // attach milestone-specific counts into statusCount response
    _transformedStatusCount.TICKET_RAISED =
      _transformedMilestoneCount.TICKET_RAISED || 0;
    _transformedStatusCount.SENT_TO_SERVICE_CENTER =
      _transformedMilestoneCount.SENT_TO_SERVICE_CENTER || 0;
    _transformedStatusCount.RECEIVED_AT_SERVICE_CENTER =
      _transformedMilestoneCount.RECEIVED_AT_SERVICE_CENTER || 0;

    return {
      tickets,
      count: totalFilteredCount,
      statusCount: _transformedStatusCount,
    };
  } catch (error) {
    // rethrow so caller can handle/log
    throw error;
  }
};

const getTicketById = async (ticketId, userId, userRole = null) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdByUser: true,
        updatedByUser: true,
        serviceCenter: {
          select: {
            id: true,
            name: true,
            centerCode: true,
            address: true,
          },
        },
        messages: {
          include: {
            sender: true,
            attachments: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        notifications: {
          include: {
            recipients: true,
          },
        },
        attachments: true,
        ticketMilestones: {
          include: {
            changer: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Check access permissions based on user role
    if (userRole === "FIELD_ENGINEER") {
      // Field engineers can only see their own tickets
      if (ticket.createdBy !== userId) {
        throw new Error("Access denied: You can only view tickets you created");
      }
    } else if (
      userRole === "SERVICE_CENTER_HEAD" ||
      userRole === "SERVICE_CENTER_TECHNICIAN"
    ) {
      // Service center users can only see tickets assigned to their service center
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { centerCode: true },
      });

      if (!user?.centerCode) {
        throw new Error(
          "Access denied: No service center assigned to your account"
        );
      }

      if (ticket.assignedServiceCenter !== user.centerCode) {
        throw new Error(
          "Access denied: This ticket is not assigned to your service center"
        );
      }
    }
    // For other roles (MACSOFT_ADMIN, MACSOFT_HEAD, MACSOFT_SUPPORT), no restrictions

    return ticket;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if there's an active ticket for the given controller number
 * A ticket is considered active if:
 * 1. Status is not CLOSED
 * 2. OR no final milestone is completed (DONE status for REQUEST_CLEARED_AT_FIELD, DELIVERED_TO_FIELD, FIELD_CLEARANCE_APPROVED)
 */
const checkActiveTicketForController = async (controllerNo) => {
  try {
    // Find tickets with the same controller number
    const existingTickets = await prisma.ticket.findMany({
      where: {
        controllerNo: controllerNo,
        deletedAt: null // Only check non-deleted tickets
      },
      include: {
        ticketMilestones: {
          where: {
            stage: {
              in: ['REQUEST_CLEARED_AT_FIELD', 'DELIVERED_TO_FIELD', 'FIELD_CLEARANCE_APPROVED']
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingTickets.length === 0) {
      return { hasActiveTicket: false };
    }

    // Check each ticket to see if it's active
    const activeTickets = existingTickets.filter(ticket => {
      // If ticket status is CLOSED, check if it has completed final milestones
      if (ticket.status === 'CLOSED') {
        // Check if any final milestone is completed
        const hasFinalMilestone = ticket.ticketMilestones.some(milestone => 
          milestone.status === 'DONE' && 
          ['REQUEST_CLEARED_AT_FIELD', 'DELIVERED_TO_FIELD', 'FIELD_CLEARANCE_APPROVED'].includes(milestone.stage)
        );
        return !hasFinalMilestone; // If no final milestone is done, ticket is still active
      }
      
      // If status is not CLOSED (OPEN, IN_PROGRESS, RESOLVED), it's active
      return true;
    });

    if (activeTickets.length > 0) {
      const activeTicket = activeTickets[0]; // Most recent active ticket
      return {
        hasActiveTicket: true,
        activeTicket: {
          ticketCode: activeTicket.ticketCode,
          status: activeTicket.status,
          createdAt: activeTicket.createdAt,
          id: activeTicket.id
        }
      };
    }

    return { hasActiveTicket: false };
  } catch (error) {
    console.error('Error checking active ticket for controller:', error);
    throw new Error('Failed to check for existing tickets');
  }
};

const createTicket = async (ticket, userId, io, attachments = []) => {
  const {
    description,
    customerName,
    controllerNo,
    imei,
    hp,
    motorType,
    state,
    district,
    village,
    block,
    complaintType,
    faultCode,
    faultType,
    priority,
    category,
    ticketCodePrefix, // Optional custom prefix
    ticketCodeSuffix,
    farmerName
    // Optional custom suffix
  } = ticket;  
  try {
    // Validate controller number - check for active tickets
    if (controllerNo) {
      const controllerCheck = await checkActiveTicketForController(controllerNo);
      if (controllerCheck.hasActiveTicket) {
        throw new Error(
          `Active ticket already exists for controller ${controllerNo}. ` +
          `Please close ticket ${controllerCheck.activeTicket.ticketCode} (Status: ${controllerCheck.activeTicket.status}) ` +
          `before creating a new one. Created on ${new Date(controllerCheck.activeTicket.createdAt).toLocaleDateString()}.`
        );
      }
    }

    // Generate unique ticket code
    const ticketCode = await generateTicketCode(
      ticketCodePrefix,
      ticketCodeSuffix
    ); 
    // Process attachments - move from temp folder to ticket folder
    let processedAttachments = [];
    if (attachments && attachments.length > 0) {
      const baseDir =
        process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads");
      const ticketDir = path.join(baseDir, ticketCode);

      // Ensure ticket directory exists
      ensureTicketDirectory(ticketCode);

      processedAttachments = attachments.map((attachment) => {
        try {
          // Move file from temp to ticket folder
          const oldPath = attachment.path;
          const newFilename = attachment.filename;
          const newPath = path.join(ticketDir, newFilename);

          // Move the file
          fs.renameSync(oldPath, newPath);

          return {
            ...attachment,
            path: newPath,
          };
        } catch (error) {
          console.error("Error moving file:", error);
          // Return original attachment if move fails
          return attachment;
        }
      });
    }
    
    const newTicket = await prisma.ticket.create({
      data: {
        ticketCode: ticketCode,
        description: description,
        customerName: customerName,
        controllerNo: controllerNo,
        imei: imei,
        hp: hp,
        motorType: motorType,
        stateCode: state,
        district: district,
        village: village,
        block: block,
        priority: priority,
        category: category,
        faultType: faultType,
        status: "OPEN",
        complaintType: complaintType || category,
        faultCode: faultCode,
        createdBy: userId,
        farmerName: farmerName,
      },
      include: {
        createdByUser: true,
        updatedByUser: true,
        messages: {
          include: {
            sender: true,
            attachments: true,
          },
        },
        notifications: {
          include: {
            recipients: true,
          },
        },
        attachments: true,
        ticketMilestones: true,
      },
    });


    // Create initial milestones for the ticket
    const milestonesData = {
      stage: "TICKET_RAISED", // Updated to use new stage name
      order: 0,
      notes: "Ticket has been raised and awaiting service center assignment.",
      status: "IN_PROGRESS",
      startedAt: new Date(),
      eta: null,
      slaDueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      photoRequired: false,
    };

    milestonesData.ticketId = newTicket.id;
    milestonesData.changedBy = userId;
    await createMilestone(milestonesData);

    // Create initial message with ticket description
    const conversation = await prisma.message.create({
      data: {
        content: ticket.description,
        senderId: userId,
        ticketId: newTicket.id,
      },
    });

    // Create attachments if any files were uploaded (link to the message)
    if (processedAttachments && processedAttachments.length > 0) {
      await prisma.attachments.createMany({
        data: processedAttachments.map((attachment) => ({
          fileName: attachment.originalname || attachment.filename,
          fileType: attachment.mimetype,
          fileSize: attachment.size,
          fileUrl: generateTicketFileUrl(ticketCode, attachment.filename), // Ticket-specific URL path
          messageId: conversation.id,
          ticketId: newTicket.id,
        })),
      });
    }

    // Fetch the complete ticket with milestones after creating them
    const completeTicket = await prisma.ticket.findUnique({
      where: { id: newTicket.id },
      include: {
        createdByUser: true,
        updatedByUser: true,
        messages: {
          include: {
            sender: true,
            attachments: true,
          },
        },
        notifications: {
          include: {
            recipients: true,
          },
        },
        attachments: true,
        ticketMilestones: {
          include: {
            changer: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    // Create and broadcast ticket creation notification
    const notificationData = createTicketNotification(
      "created",
      completeTicket,
      userId,
      {
        messageId: conversation.id,
        priority: completeTicket.priority,
        customerName: completeTicket.customerName,
        description: completeTicket.description,
      }
    ); 

    // Get target users (ADMIN, HEAD, and SUPPORT roles)
    const targetUsers = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          {
            role: {
              in: ["MACSOFT_ADMIN", "MACSOFT_HEAD", "MACSOFT_SUPPORT"],
            },
          },
        ],
      },
      select: { id: true, name: true, role: true },
    });

    const targetUserIds = targetUsers.map((user) => user.id);
 
    // Save and broadcast notification
    await saveAndBroadcastNotification(
      prisma,
      io,
      notificationData,
      targetUserIds
    );

    if (io) {
      io.emit("ticket", completeTicket);
      io.emit("conversation", conversation);
    }
    return completeTicket;
  } catch (error) {
    throw error;
  }
};

const updateTicket = async (
  ticketId,
  ticketData,
  userId,
  io,
  userRole = null
) => {
  try {
    // First, verify the user has access to this ticket
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        createdBy: true,
        assignedServiceCenter: true,
      },
    });

    if (!existingTicket) {
      throw new Error("Ticket not found");
    }

    // Check access permissions based on user role
    if (userRole === "FIELD_ENGINEER") {
      // Field engineers can only update their own tickets
      if (existingTicket.createdBy !== userId) {
        throw new Error(
          "Access denied: You can only update tickets you created"
        );
      }
    } else if (
      userRole === "SERVICE_CENTER_HEAD" ||
      userRole === "SERVICE_CENTER_TECHNICIAN"
    ) {
      // Service center users can only update tickets assigned to their service center
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { centerCode: true },
      });

      if (!user?.centerCode) {
        throw new Error(
          "Access denied: No service center assigned to your account"
        );
      }

      if (existingTicket.assignedServiceCenter !== user.centerCode) {
        throw new Error(
          "Access denied: This ticket is not assigned to your service center"
        );
      }
    }
    // For other roles (MACSOFT_ADMIN, MACSOFT_HEAD, MACSOFT_SUPPORT), no restrictions

    const {
      ticketCode,
      description,
      customerName,
      controllerNo,
      imei,
      hp,
      motorType,
      state,
      district,
      village,
      block,
      complaintType,
      faultCode,
      faultType,
      status,
      priority,
      assignedServiceCenter,
    } = ticketData;
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ticketCode: ticketCode,
        description: description,
        customerName: customerName,
        controllerNo: controllerNo,
        imei: imei,
        hp: hp,
        motorType: motorType,
        stateCode: state,
        district: district,
        village: village,
        block: block,
        complaintType: complaintType,
        faultCode: faultCode,
        faultType: faultType,
        status: status,
        priority: priority,
        assignedServiceCenter: assignedServiceCenter,
        updatedBy: userId,
      },
    });
    // Create update conversation message
    const conversation = await prisma.message.create({
      data: {
        content: `Ticket updated: ${ticketData.description}`,
        senderId: userId,
        ticketId: updatedTicket.id,
      },
    });

    // Create and broadcast ticket update notification
    const notificationData = createTicketNotification(
      "updated",
      updatedTicket,
      userId,
      {
        messageId: conversation.id,
      }
    );

    // Get target users (ADMIN and HEAD roles)
    const targetUsers = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          {
            role: {
              in: [
                "MACSOFT_ADMIN",
                "MACSOFT_HEAD",
                "MACSOFT_SUPPORT",
                "SERVICE_CENTER_HEAD",
              ],
            },
          },
        ],
      },
      select: { id: true },
    });

    const targetUserIds = targetUsers.map((user) => user.id);

    // Save and broadcast notification
    await saveAndBroadcastNotification(
      prisma,
      io,
      notificationData,
      targetUserIds
    );

    if (io) {
      io.emit("ticket", updatedTicket);
      io.emit("conversation", conversation); 
    }
    return updatedTicket;
  } catch (error) {
    throw error;
  }
};

const updateStatus = async (ticketId, status, userId, io, userRole = null) => {
  try {
    // First, verify the user has access to this ticket
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        createdBy: true,
        assignedServiceCenter: true,
        status: true,
      },
    });

    if (!existingTicket) {
      throw new Error("Ticket not found");
    }

    // Check access permissions based on user role
    if (userRole === "FIELD_ENGINEER") {
      // Field engineers can only update their own tickets
      if (existingTicket.createdBy !== userId) {
        throw new Error(
          "Access denied: You can only update tickets you created"
        );
      }
    } else if (
      userRole === "SERVICE_CENTER_HEAD" ||
      userRole === "SERVICE_CENTER_TECHNICIAN"
    ) {
      // Service center users can only update tickets assigned to their service center
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { centerCode: true },
      });

      if (!user?.centerCode) {
        throw new Error(
          "Access denied: No service center assigned to your account"
        );
      }

      if (existingTicket.assignedServiceCenter !== user.centerCode) {
        throw new Error(
          "Access denied: This ticket is not assigned to your service center"
        );
      }
    }
    // For other roles (MACSOFT_ADMIN, MACSOFT_HEAD, MACSOFT_SUPPORT), no restrictions

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: status },
    });
    // Determine action based on status change
    let action = "updated";
    if (status === "CLOSED") {
      action = "closed";
    } else if (status === "OPEN" || status === "IN_PROGRESS") {
      action = "reopened";
    }

    // Create and broadcast ticket status update notification
    const notificationData = createTicketNotification(
      action,
      updatedTicket,
      userId,
      {
        oldStatus: updatedTicket.status,
        newStatus: status,
      }
    );

    // Save and broadcast notification to all users
    await saveAndBroadcastNotification(prisma, io, notificationData);

    if (io) {
      io.emit("ticket", updatedTicket);
    }
    return updatedTicket;
  } catch (error) {
    throw error;
  }
};

const deleteTicket = async (ticketId, userId, io, userRole = null) => {
  try {
    // Get ticket details before deletion for notification and access control
    const ticketToDelete = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketCode: true,
        customerName: true,
        createdBy: true,
        assignedServiceCenter: true,
      },
    });

    if (!ticketToDelete) {
      throw new Error("Ticket not found");
    }

    // Check access permissions based on user role
    if (userRole === "FIELD_ENGINEER") {
      // Field engineers can only delete their own tickets
      if (ticketToDelete.createdBy !== userId) {
        throw new Error(
          "Access denied: You can only delete tickets you created"
        );
      }
    } else if (
      userRole === "SERVICE_CENTER_HEAD" ||
      userRole === "SERVICE_CENTER_TECHNICIAN"
    ) {
      // Service center users can only delete tickets assigned to their service center
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { centerCode: true },
      });

      if (!user?.centerCode) {
        throw new Error(
          "Access denied: No service center assigned to your account"
        );
      }

      if (ticketToDelete.assignedServiceCenter !== user.centerCode) {
        throw new Error(
          "Access denied: This ticket is not assigned to your service center"
        );
      }
    }
    // For other roles (MACSOFT_ADMIN, MACSOFT_HEAD, MACSOFT_SUPPORT), no restrictions

    // Delete related records
    const deletedNotificationRecipients =
      await prisma.notificationRecipient.deleteMany({
        where: { notification: { ticketId: ticketId } },
      });
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { ticketId: ticketId },
    });
    const deletedMessages = await prisma.message.deleteMany({
      where: { ticketId: ticketId },
    });
    const deletedAttachments = await prisma.attachments.deleteMany({
      where: { ticketId: ticketId },
    });
    const deletedTicket = await prisma.ticket.delete({
      where: { id: ticketId },
    });

    // Create and broadcast ticket deletion notification
    const notificationData = createTicketNotification(
      "deleted",
      ticketToDelete,
      userId
    );

    // Save and broadcast notification to all users
    await saveAndBroadcastNotification(prisma, io, notificationData);

    if (io) {
      io.emit("ticketDeleted", {
        ticketId: ticketId,
        ticketCode: ticketToDelete.ticketCode,
      });
    }

    return deletedTicket;
  } catch (error) {
    throw error;
  }
};

const searchByControllerNumber = async (controllerNo, userId, userRole) => {
  try {
    // Find ticket by controller number
    const ticket = await prisma.ticket.findFirst({
      where: {
        controllerNo: {
          contains: controllerNo,
        },
        ticketMilestones: {
          some: {
            stage: {
              in: ["SENT_TO_SERVICE_CENTER"],
            },
            status: {
              in: ["IN_PROGRESS"],
            },
          },
        },
      },
      include: {
        createdByUser: true,
        updatedByUser: true,
        serviceCenter: {
          select: {
            id: true,
            name: true,
            centerCode: true,
            address: true,
          },
        },
        attachments: true,
        ticketMilestones: {
          include: {
            changer: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!ticket) {
      return null;
    }

    // Check role-based access
    if (userRole === "CUSTOMER_FIELD_ENGINEER" && ticket.createdBy !== userId) {
      throw new Error("Access denied: You can only view your own tickets");
    }

    if (
      userRole === "CUSTOMER_SERVICE_HEAD" ||
      userRole === "SERVICE_CENTER_TECHNICIAN"
    ) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { serviceCenterCode: true },
      });

      if (
        !user?.serviceCenterCode ||
        ticket.assignedServiceCenter !== user.serviceCenterCode
      ) {
        throw new Error(
          "Access denied: This ticket is not assigned to your service center"
        );
      }
    }

    return ticket;
  } catch (error) {
    throw error;
  }
};

const searchTickets = async (keyword, userId, userRole) => {
  try {
    // Build where clause based on role
    let where = {
      OR: [
        { ticketCode: { contains: keyword } },
        { controllerNo: { contains: keyword } },
        { imei: { contains: keyword } },
        { customerName: { contains: keyword } },
        { hp: { contains: keyword } },
        { motorType: { contains: keyword } },
        { stateCode: { contains: keyword } },
        { district: { contains: keyword } },
        { village: { contains: keyword } },
        { block: { contains: keyword } }
      ]
    };

    // Add role-based filtering
    if (userRole === "CUSTOMER_FIELD_ENGINEER") {
      where.createdBy = userId;
    } else if (userRole === "CUSTOMER_SERVICE_HEAD" || userRole === "SERVICE_CENTER_TECHNICIAN") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { serviceCenterCode: true },
      });

      if (user?.serviceCenterCode) {
        where.assignedServiceCenter = user.serviceCenterCode;
      }
    }

    // For receive controller, we want tickets that are ready to be received
    where.ticketMilestones = {
      some: {
        stage: {
          in: ["SENT_TO_SERVICE_CENTER"],
        },
        status: {
          in: ["IN_PROGRESS"],
        },
      },
    };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        serviceCenter: {
          select: {
            id: true,
            name: true,
            centerCode: true,
            address: true,
          },
        },
        ticketMilestones: {
          include: {
            changer: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50 // Limit results for performance
    });

    return tickets;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  updateStatus,
  deleteTicket,
  searchByControllerNumber,
  searchTickets,
  checkActiveTicketForController,
};
