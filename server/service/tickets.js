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
const fs = require("fs");
const path = require("path");

const getTickets = async (skip, take, filter, userId, role) => {
  try {
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
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    if (skip) params.skip = (parseInt(skip) - 1) * parseInt(take || 10);
    if (take) params.take = parseInt(take);

    // Initialize where clause
    params.where = {};

    if (filter && filter.search) {
      params.where.OR = [
        { ticketCode: { contains: filter.search } },
        { description: { contains: filter.search } },
        { customerName: { contains: filter.search } },
        { controllerNo: { contains: filter.search } },
        { imei: { contains: filter.search } },
        { hp: { contains: filter.search } },
        { motorType: { contains: filter.search } },
        { state: { contains: filter.search } },
        { district: { contains: filter.search } },
        { village: { contains: filter.search } },
        { block: { contains: filter.search } },
        { complaintType: { contains: filter.search } },
        { faultCode: { contains: filter.search } },
      ];
    }
    if (filter && filter.status) {
      params.where = {
        ...params.where,
        status: filter.status,
      };
    }
    // CUSTOMER_FIELD_ENGINEER should only see their own tickets
    if (role === "CUSTOMER_FIELD_ENGINEER") {
      params.where = {
        ...params.where,
        createdBy: userId,
      };
    }

    // CUSTOMER_SERVICE_HEAD and SERVICE_CENTER_TECHNICIAN should only see tickets assigned to their service center
    if (role === "CUSTOMER_SERVICE_HEAD" || role === "SERVICE_CENTER_TECHNICIAN") {
      // Get user's service center code
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { centerCode: true },
      });

      if (user?.centerCode) {
        params.where = {
          ...params.where,
          assignedServiceCenter: user.centerCode,
        };
      } else {
        // If user doesn't have a service center assigned, they see no tickets
        params.where = {
          ...params.where,
          id: -1, // This ensures no tickets are returned
        };
      }
    }

    // For CUSTOMER_FIELD_ENGINEER, only count their own tickets
    // For SERVICE_CENTER users, only count tickets assigned to their service center
    let statusCountWhere = {};
    if (role === "CUSTOMER_FIELD_ENGINEER") {
      statusCountWhere = { createdBy: userId };
    } else if (role === "SERVICE_CENTER_HEAD" || role === "SERVICE_CENTER_TECHNICIAN") {
      // Get user's service center code for status count
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { centerCode: true },
      });

      if (user?.centerCode) {
        statusCountWhere = { assignedServiceCenter: user.centerCode };
      } else {
        // If user doesn't have a service center assigned, they see no tickets
        statusCountWhere = { id: -1 };
      }
    }

    const ticketsStatusCount = await prisma.ticket.groupBy({
      by: ["status"],
      _count: { status: true },
      where: statusCountWhere,
    });

    // Get count of tickets at each milestone stage (only for live/active tickets, not closed)
    // For FIELD_ENGINEER, only count milestones for their own tickets
    // For SERVICE_CENTER users, only count milestones for tickets assigned to their service center
    let milestoneCountWhere = {
      stage: { in: ["TICKET_RAISED", "SENT_TO_SERVICE_CENTER", "RECEIVED_AT_SERVICE_CENTER"] },
      ticket: { 
        status: { not: "CLOSED" }
      },
    };

    if (role === "FIELD_ENGINEER") {
      milestoneCountWhere.ticket.createdBy = userId;
    } else if (role === "SERVICE_CENTER_HEAD" || role === "SERVICE_CENTER_TECHNICIAN") {
      // Get user's service center code for milestone count
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { centerCode: true },
      });

      if (user?.centerCode) {
        milestoneCountWhere.ticket.assignedServiceCenter = user.centerCode;
      } else {
        // If user doesn't have a service center assigned, they see no milestones
        milestoneCountWhere.ticket.id = -1;
      }
    }

    const ticketsMilestoneCount = await prisma.ticketMilestone.groupBy({
      by: ["stage"],
      _count: { id: true },
      where: milestoneCountWhere,
    });

    console.log("Milestone counts:", ticketsMilestoneCount);

    const _transformedMilestoneCount = {};
    ticketsMilestoneCount.forEach((milestoneGroup) => {
      _transformedMilestoneCount[milestoneGroup.stage] =
        milestoneGroup._count.id;
    });
    console.log("Transformed milestone counts:", _transformedMilestoneCount);

    const _transformedStatusCount = {};
    ticketsStatusCount.forEach((statusGroup) => {
      _transformedStatusCount[statusGroup.status] = statusGroup._count.status;
    });
    // For FIELD_ENGINEER and SERVICE_CENTER users, only count their respective tickets for ALL count
    _transformedStatusCount.ALL = await prisma.ticket.count({
      where: statusCountWhere,
    });
    
    // Add milestone counts to statusCount object
    _transformedStatusCount.TICKET_RAISED = _transformedMilestoneCount.TICKET_RAISED || 0;
    _transformedStatusCount.SENT_TO_SERVICE_CENTER = _transformedMilestoneCount.SENT_TO_SERVICE_CENTER || 0;
    _transformedStatusCount.RECEIVED_AT_SERVICE_CENTER = _transformedMilestoneCount.RECEIVED_AT_SERVICE_CENTER || 0;
    
    const count = await prisma.ticket.count({ where: params.where });
    const tickets = await prisma.ticket.findMany(params);
    return {
      tickets,
      count,
      statusCount: _transformedStatusCount,
    };
  } catch (error) {
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
    } else if (userRole === "SERVICE_CENTER_HEAD" || userRole === "SERVICE_CENTER_TECHNICIAN") {
      // Service center users can only see tickets assigned to their service center
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { centerCode: true },
      });

      if (!user?.centerCode) {
        throw new Error("Access denied: No service center assigned to your account");
      }

      if (ticket.assignedServiceCenter !== user.centerCode) {
        throw new Error("Access denied: This ticket is not assigned to your service center");
      }
    }
    // For other roles (MACSOFT_ADMIN, MACSOFT_HEAD, MACSOFT_SUPPORT), no restrictions

    return ticket;
  } catch (error) {
    throw error;
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
    ticketCodeSuffix, // Optional custom suffix
  } = ticket;
  try {
    // Generate unique ticket code
    const ticketCode = await generateTicketCode(
      ticketCodePrefix,
      ticketCodeSuffix
    );
    console.log("Generated ticket code:", ticketCode);

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
        state: state,
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
      notes:
        "Ticket has been raised and awaiting service center assignment.",
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

    console.log("📢 Creating notification:", {
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      ticketCode: completeTicket.ticketCode,
    });

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
      select: { id: true, name: true, role: true},
    });

    const targetUserIds = targetUsers.map((user) => user.id);

    console.log("🔔 Notifying users for new ticket:", {
      ticketCode: ticketCode,
      targetUsers: targetUsers.map((u) => ({ name: u.name, role: u.role })),
      totalCount: targetUsers.length,
    });

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
      console.log(
        `📄 New ticket created: ${completeTicket.ticketCode} by user ${userId}`
      );
    }
    return completeTicket;
  } catch (error) {
    throw error;
  }
};

const updateTicket = async (ticketId, ticketData, userId, io, userRole = null) => {
  try {
    // First, verify the user has access to this ticket
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { 
        id: true, 
        createdBy: true, 
        assignedServiceCenter: true 
      },
    });

    if (!existingTicket) {
      throw new Error("Ticket not found");
    }

    // Check access permissions based on user role
    if (userRole === "FIELD_ENGINEER") {
      // Field engineers can only update their own tickets
      if (existingTicket.createdBy !== userId) {
        throw new Error("Access denied: You can only update tickets you created");
      }
    } else if (userRole === "SERVICE_CENTER_HEAD" || userRole === "SERVICE_CENTER_TECHNICIAN") {
      // Service center users can only update tickets assigned to their service center
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { centerCode: true },
      });

      if (!user?.centerCode) {
        throw new Error("Access denied: No service center assigned to your account");
      }

      if (existingTicket.assignedServiceCenter !== user.centerCode) {
        throw new Error("Access denied: This ticket is not assigned to your service center");
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
        state: state,
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
      console.log(
        `📝 Ticket updated: ${updatedTicket.ticketCode} by user ${userId}`
      );
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
        status: true 
      },
    });

    if (!existingTicket) {
      throw new Error("Ticket not found");
    }

    // Check access permissions based on user role
    if (userRole === "FIELD_ENGINEER") {
      // Field engineers can only update their own tickets
      if (existingTicket.createdBy !== userId) {
        throw new Error("Access denied: You can only update tickets you created");
      }
    } else if (userRole === "SERVICE_CENTER_HEAD" || userRole === "SERVICE_CENTER_TECHNICIAN") {
      // Service center users can only update tickets assigned to their service center
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { centerCode: true },
      });

      if (!user?.centerCode) {
        throw new Error("Access denied: No service center assigned to your account");
      }

      if (existingTicket.assignedServiceCenter !== user.centerCode) {
        throw new Error("Access denied: This ticket is not assigned to your service center");
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
      console.log(
        `🔄 Ticket status updated: ${updatedTicket.ticketCode} → ${status} by user ${userId}`
      );
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
        assignedServiceCenter: true 
      },
    });

    if (!ticketToDelete) {
      throw new Error("Ticket not found");
    }

    // Check access permissions based on user role
    if (userRole === "FIELD_ENGINEER") {
      // Field engineers can only delete their own tickets
      if (ticketToDelete.createdBy !== userId) {
        throw new Error("Access denied: You can only delete tickets you created");
      }
    } else if (userRole === "SERVICE_CENTER_HEAD" || userRole === "SERVICE_CENTER_TECHNICIAN") {
      // Service center users can only delete tickets assigned to their service center
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { centerCode: true },
      });

      if (!user?.centerCode) {
        throw new Error("Access denied: No service center assigned to your account");
      }

      if (ticketToDelete.assignedServiceCenter !== user.centerCode) {
        throw new Error("Access denied: This ticket is not assigned to your service center");
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
      console.log(
        `🗑️ Ticket deleted: ${ticketToDelete.ticketCode} by user ${userId}`
      );
    }

    return deletedTicket;
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
};
