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

/**
 * Utility function to read backup JSON from file path
 */
const readBackupFromFile = async (backupUrl) => {
  try {
    if (!backupUrl || !fs.existsSync(backupUrl)) {
      return null;
    }
    const jsonData = fs.readFileSync(backupUrl, "utf8");
    return JSON.parse(jsonData);
  } catch (error) {
    console.error("Error reading backup JSON from file:", error);
    return null;
  }
};

/**
 * Archive ticket data to JSON when ticket is closed
 * Fetches all related data (messages, MessageSeen, notifications, NotificationRecipient)
 * and stores it as JSON file, with the file path saved in backupurl field
 */
const archiveTicketData = async (ticketId) => {
  try {
    // Fetch all ticket data with relations
    const ticketData = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
            seenBy: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    role: true,
                  },
                },
              },
            },
            attachments: true,
          },
        },
        notifications: {
          include: {
            recipients: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    role: true,
                  },
                },
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        ticketMilestones: {
          include: {
            changer: {
              select: {
                id: true,
                name: true,
                phone: true,
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

    if (!ticketData) {
      throw new Error("Ticket not found for archiving");
    }

    // Prepare archive data
    const archiveData = {
      archivedAt: new Date().toISOString(),
      ticketId: ticketData.id,
      ticketCode: ticketData.ticketCode,
      messages: ticketData.messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        sender: msg.sender,
        attachments: msg.attachments,
        seenBy: msg.seenBy.map((seen) => ({
          id: seen.id,
          seenAt: seen.seenAt,
          user: seen.user,
        })),
      })),
      notifications: ticketData.notifications.map((notif) => ({
        id: notif.id,
        title: notif.title,
        description: notif.description,
        type: notif.type,
        createdAt: notif.createdAt,
        createdBy: notif.createdBy,
        recipients: notif.recipients.map((recipient) => ({
          id: recipient.id,
          seen: recipient.seen,
          seenAt: recipient.seenAt,
          user: recipient.user,
        })),
      })),
      milestones: ticketData.ticketMilestones.map((milestone) => ({
        id: milestone.id,
        stage: milestone.stage,
        status: milestone.status,
        order: milestone.order,
        description: milestone.description,
        allowedRoles: milestone.allowedRoles,
        startedAt: milestone.startedAt,
        completedAt: milestone.completedAt,
        eta: milestone.eta,
        slaDueAt: milestone.slaDueAt,
        photoRequired: milestone.photoRequired,
        notes: milestone.notes,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt,
        changedBy: milestone.changer,
        attachments: milestone.attachments.map((att) => ({
          id: att.id,
          fileName: att.fileName,
          fileType: att.fileType,
          fileSize: att.fileSize,
          fileUrl: att.fileUrl,
          createdAt: att.createdAt,
        })),
      })),
    };

    // Convert to JSON string
    const backupJson = JSON.stringify(archiveData, null, 2);

    // Optionally save to file
    const ticketDir = ensureTicketDirectory(ticketData.ticketCode);
    const backupFilePath = path.join(ticketDir, `archive_${Date.now()}.json`);
    fs.writeFileSync(backupFilePath, backupJson, "utf8");

    // Update ticket with backup file path and metadata
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        backupcreatedAt: new Date(),
        backupurl: backupFilePath,
      },
    });

    // Delete the archived data
    // First delete MessageSeen records
    const messageIds = ticketData.messages.map((msg) => msg.id);
    if (messageIds.length > 0) {
      await prisma.messageSeen.deleteMany({
        where: {
          messageId: { in: messageIds },
        },
      });
    }

    // Delete NotificationRecipient records
    const notificationIds = ticketData.notifications.map((notif) => notif.id);
    if (notificationIds.length > 0) {
      await prisma.notificationRecipient.deleteMany({
        where: {
          notificationId: { in: notificationIds },
        },
      });
    }

    // Delete Notifications
    if (notificationIds.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          id: { in: notificationIds },
        },
      });
    }

    // Delete Messages
    if (messageIds.length > 0) {
      await prisma.message.deleteMany({
        where: {
          id: { in: messageIds },
        },
      });
    }

    // Delete milestone attachments (must be done before deleting milestones due to foreign key)
    const milestoneIds = ticketData.ticketMilestones.map((m) => m.id);
    if (milestoneIds.length > 0) {
      await prisma.attachments.deleteMany({
        where: {
          milestoneId: { in: milestoneIds },
        },
      });
    }

    // Delete all milestones for the ticket
    if (milestoneIds.length > 0) {
      await prisma.ticketMilestone.deleteMany({
        where: {
          ticketId: ticketId,
        },
      });
    }

    console.log(
      `Successfully archived and cleaned ticket ${ticketData.ticketCode}`,
    );
    return {
      success: true,
      backupFilePath,
      archivedData: archiveData,
    };
  } catch (error) {
    console.error("Error archiving ticket data:", error);
    throw error;
  }
};

// RBAC Socket emission helper
const emitTicketEventWithRBAC = (
  io,
  eventName,
  ticketData,
  eventData = null,
) => {
  if (!io || !ticketData) return;

  const dataToEmit = eventData || ticketData;

  // Always emit to MACSOFT roles (global access)
  io.to("role-MACSOFT_ADMIN").emit(eventName, dataToEmit);
  io.to("role-MACSOFT_HEAD").emit(eventName, dataToEmit);
  io.to("role-MACSOFT_SUPPORT").emit(eventName, dataToEmit);

  // Emit to ticket creator (if they are a field engineer)
  if (ticketData.createdBy) {
    io.to(`notifications-${ticketData.createdBy}`).emit(eventName, dataToEmit);
  }

  // Emit to assigned service center
  if (ticketData.assignedServiceCenter) {
    io.to(`center-${ticketData.assignedServiceCenter}`).emit(
      eventName,
      dataToEmit,
    );
  }

  // Emit to Customer Service Heads based on ticket's state/location
  // Note: This could be enhanced with state-based targeting
  io.to("role-CUSTOMER_SERVICE_HEAD").emit(eventName, dataToEmit);
};

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
            seenBy: {
              select: {
                userId: true,
                seenAt: true,
              },
            },
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
        state: true,
      },
      orderBy: [
        { isBuzzerOn: "desc" }, // Buzzer alert tickets first
        { createdAt: "desc" }, // Then by creation date
      ],
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
        const searchType = filter.searchType || "controller"; // default to controller

        if (searchType === "ticket") {
          // Search only in ticket code
          where.ticketCode = { contains: s };
        } else if (searchType === "controller") {
          // Search only in controller number
          where.controllerNo = { contains: s };
        } else if (searchType === "imeinumber") {
          // Search only in IMEI number
          where.imei = { contains: s };
        } else {
          // Fallback to search all fields if searchType is not recognized
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
    }

    // status filter
    if (filter && filter.status) {
      where.status = filter.status;
    }

    // stage filter - filter tickets by their current milestone stage
    if (filter && (filter.stage || filter.milestoneStage)) {
      const stageToFilter = filter.stage || filter.milestoneStage;
      where.ticketMilestones = {
        some: {
          stage: stageToFilter,
          status: "IN_PROGRESS", // Filter by milestones that are currently in progress
        },
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

    const sortedTickets = tickets.slice().sort((a, b) => {
      const aMsg =
        a.messages && a.messages.length > 0
          ? a.messages[a.messages.length - 1].createdAt
          : a.createdAt;
      const bMsg =
        b.messages && b.messages.length > 0
          ? b.messages[b.messages.length - 1].createdAt
          : b.createdAt;
      return new Date(bMsg) - new Date(aMsg);
    });
    return {
      tickets: sortedTickets,
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

    // Build where clause based on role
    let where = { id: ticketId };

    if (userRole === "CUSTOMER_FIELD_ENGINEER") {
      // Only tickets created by this user
      where.createdBy = userId;
    } else if (userRole === "SERVICE_CENTER_TECHNICIAN") {
      // Only tickets assigned to technician's service center
      if (user?.centerCode) {
        where.assignedServiceCenter = user.centerCode;
      } else {
        // No center => no access
        where.id = -1;
      }
    } else if (userRole === "CUSTOMER_SERVICE_HEAD") {
      // CSH sees tickets only if the ticket creator's primary state (createdByUser.stateId)
      // is in the CSH's allowed state IDs (primary + assigned states).
      if (allowedStateIdsArr.length) {
        where.AND = [
          { createdByUser: { stateId: { in: allowedStateIdsArr } } },
        ];
      } else {
        // head has no allowed states => no access
        where.id = -1;
      }
    }
    // For MACSOFT_ADMIN, MACSOFT_HEAD, MACSOFT_SUPPORT -> no additional filters (global access)

    // First, check if ticket is closed and has archived data
    const ticketStatus = await prisma.ticket.findFirst({
      where,
      select: {
        id: true,
        status: true,
        backupcreatedAt: true,
        backupurl: true,
      },
    });

    if (!ticketStatus) {
      throw new Error("Ticket not found or access denied");
    }

    // If ticket is CLOSED and has archived data, return the archived data
    if (ticketStatus.status === "CLOSED" && ticketStatus.backupurl) {
      try {
        const archivedData = await readBackupFromFile(ticketStatus.backupurl);
        if (!archivedData) {
          throw new Error("Failed to read backup data from file");
        }

        // Fetch basic ticket info and merge with archived data
        const basicTicket = await prisma.ticket.findFirst({
          where,
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
            state: true,
            selectedDistrict: true,
          },
        });

        // Return ticket with archived messages, notifications, and milestones
        return {
          ...basicTicket,
          messages: archivedData.messages || [],
          notifications: archivedData.notifications || [],
          ticketMilestones: archivedData.milestones || [],
          isArchived: true,
          archivedAt: archivedData.archivedAt,
        };
      } catch (parseError) {
        console.error("Error parsing archived data:", parseError);
        // If parsing fails, fall through to normal query
      }
    }

    // For non-closed tickets or tickets without archived data, fetch normally
    const ticket = await prisma.ticket.findFirst({
      where,
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
            seenBy: {
              include: {
                user: {
                  select: { id: true, name: true, role: true },
                },
              },
            },
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
        state: true,
        selectedDistrict: true,
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found or access denied");
    }

    return {
      ...ticket,
      isArchived: false,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Check if there's an active ticket for the given controller number
 * A ticket is considered active if:
 * 1. Status is not CLOSED
 * 2. OR no final milestone is completed (DONE status for REQUEST_CLEARED_AT_FIELD, DELIVERED_TO_FIELD, FIELD_CLEARANCE_APPROVED, TICKET_CLOSED)
 *
 * New tickets are permitted when:
 * - No existing tickets for the controller, OR
 * - All existing tickets have TICKET_CLOSED milestone in DONE status
 */
const checkActiveTicketForController = async (controllerNo) => {
  try {
    // Find tickets with the same controller number
    const existingTickets = await prisma.ticket.findMany({
      where: {
        controllerNo: controllerNo,
        deletedAt: null, // Only check non-deleted tickets
      },
      include: {
        ticketMilestones: {
          where: {
            stage: {
              in: [
                "REQUEST_CLEARED_AT_FIELD",
                "DELIVERED_TO_FIELD",
                "FIELD_CLEARANCE_APPROVED",
                "TICKET_CLOSED",
              ],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingTickets.length === 0) {
      return { hasActiveTicket: false };
    }

    // Check each ticket to see if it's active
    const activeTickets = existingTickets.filter((ticket) => {
      // If ticket status is CLOSED, check if it's archived or has completed final milestones
      if (ticket.status === "CLOSED") {
        // If ticket has backup URL, it's been archived and should be considered inactive
        if (
          ticket && 
          ticket.backupurl &&
          ticket.backupcreatedAt
        ) {
          return false; // Archived tickets are inactive
        }

        // For non-archived CLOSED tickets, check if any final milestone is completed
        const hasFinalMilestone = ticket.ticketMilestones.some(
          (milestone) =>
            milestone.status === "DONE" &&
            [
              "REQUEST_CLEARED_AT_FIELD",
              "DELIVERED_TO_FIELD",
              "FIELD_CLEARANCE_APPROVED",
              "TICKET_CLOSED",
            ].includes(milestone.stage),
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
          id: activeTicket.id,
        },
      };
    }

    return { hasActiveTicket: false };
  } catch (error) {
    console.error("Error checking active ticket for controller:", error);
    throw new Error("Failed to check for existing tickets");
  }
};

/**
 * Create a new ticket with role-based workflow
 *
 * For SERVICE_CENTER_TECHNICIAN:
 * - Auto-assigns their service center to the ticket
 * - Auto-progresses through milestones up to DIAGNOSIS_IN_PROGRESS
 * - Creates notification for repair/replacement decision
 *
 * For other roles:
 * - Standard ticket creation workflow
 */
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
    farmerName,
    cableLength,
    pumpPlacementDepth,
    // Optional custom suffix
  } = ticket;
  try {
    // Fetch user information to determine role-based logic
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        centerCode: true,
        serviceCenter: {
          select: {
            id: true,
            centerCode: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate controller number - check for active tickets
    if (controllerNo) {
      const controllerCheck =
        await checkActiveTicketForController(controllerNo);
      if (controllerCheck.hasActiveTicket) {
        throw new Error(
          `Active ticket already exists for controller ${controllerNo}. ` +
            `Please close ticket ${controllerCheck.activeTicket.ticketCode} (Status: ${controllerCheck.activeTicket.status}) ` +
            `before creating a new one. Created on ${new Date(controllerCheck.activeTicket.createdAt).toLocaleDateString()}.`,
        );
      }
    }

    // Generate unique ticket code
    const ticketCode = await generateTicketCode(
      ticketCodePrefix,
      ticketCodeSuffix,
    );

    // For SERVICE_CENTER_TECHNICIAN, auto-assign their service center
    let assignedServiceCenter = null;
    if (user.role === "SERVICE_CENTER_TECHNICIAN" && user.centerCode) {
      assignedServiceCenter = user.centerCode;
    }
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
        assignedServiceCenter: assignedServiceCenter,
        farmerName: farmerName,
        cableLength: cableLength,
        pumpPlacementDepth: pumpPlacementDepth,
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
    if (user.role === "SERVICE_CENTER_TECHNICIAN") {
      // For SERVICE_CENTER_TECHNICIAN, create milestones up to RECEIVED_AT_SERVICE_CENTER
      const milestoneStages = [
        {
          stage: "TICKET_RAISED",
          order: 0,
          notes: "Ticket raised by service center technician.",
          status: "DONE",
          startedAt: new Date(),
          completedAt: new Date(),
        },
        {
          stage: "SERVICE_CENTER_ASSIGNED",
          order: 1,
          notes: `Auto-assigned to service center: ${user.serviceCenter?.name || user.centerCode}`,
          status: "DONE",
          startedAt: new Date(),
          completedAt: new Date(),
        },
        {
          stage: "RECEIVED_AT_SERVICE_CENTER",
          order: 5,
          notes:
            "Controller received at service center by technician. Please upload 4 required photos: Controller Front, Controller Bottom, Full View Open, MCB Close Up.",
          status: "IN_PROGRESS",
          startedAt: new Date(),
          eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days ETA
          slaDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days SLA
          photoRequired: true,
        },
      ];

      // Create all milestones in sequence
      for (const milestoneData of milestoneStages) {
        await createMilestone({
          ...milestoneData,
          ticketId: newTicket.id,
          changedBy: userId,
          photoRequired: milestoneData.photoRequired || false,
        });
      }
    } else {
      // Standard milestone creation for other roles
      const milestonesData = {
        stage: "TICKET_RAISED",
        order: 0,
        notes: "Ticket has been raised and awaiting service center assignment.",
        status: "IN_PROGRESS",
        startedAt: new Date(),
        eta: null,
        slaDueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        photoRequired: false,
        ticketId: newTicket.id,
        changedBy: userId,
      };

      await createMilestone(milestonesData);
    }

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
            seenBy: {
              select: {
                userId: true,
                seenAt: true,
              },
            },
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
    let notificationData;
    let targetUserIds = [];

    if (user.role === "SERVICE_CENTER_TECHNICIAN") {
      // For SERVICE_CENTER_TECHNICIAN, create notification about diagnosis ready
      notificationData = createTicketNotification(
        "diagnosis_ready",
        completeTicket,
        userId,
        {
          messageId: conversation.id,
          priority: completeTicket.priority,
          customerName: completeTicket.customerName,
          description: completeTicket.description,
          serviceCenter: user.serviceCenter?.name || user.centerCode,
        },
      );

      // Target other technicians in the same service center and management roles
      const targetUsers = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                {
                  role: {
                    in: ["MACSOFT_ADMIN", "MACSOFT_HEAD", "MACSOFT_SUPPORT"],
                  },
                },
                {
                  AND: [
                    { centerCode: user.centerCode },
                    {
                      role: {
                        in: [
                          "SERVICE_CENTER_TECHNICIAN",
                          "CUSTOMER_SERVICE_HEAD",
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        select: { id: true, name: true, role: true },
      });

      targetUserIds = targetUsers.map((u) => u.id);
    } else {
      // Standard notification for other roles
      notificationData = createTicketNotification(
        "created",
        completeTicket,
        userId,
        {
          messageId: conversation.id,
          priority: completeTicket.priority,
          customerName: completeTicket.customerName,
          description: completeTicket.description,
        },
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

      targetUserIds = targetUsers.map((u) => u.id);
    }

    // Save and broadcast notification
    await saveAndBroadcastNotification(
      prisma,
      io,
      notificationData,
      targetUserIds,
    );

    if (io) {
      // Use RBAC-aware emission
      emitTicketEventWithRBAC(io, "ticket", completeTicket);
      emitTicketEventWithRBAC(io, "conversation", completeTicket, conversation);

      // Emit new ticket creation for real-time updates in ticket lists
      const newTicketData = {
        ...completeTicket,
        isNewTicket: true,
        createdAt: completeTicket.createdAt,
      };
      emitTicketEventWithRBAC(
        io,
        "ticket-created",
        completeTicket,
        newTicketData,
      );
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
  userRole = null,
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
          "Access denied: You can only update tickets you created",
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
          "Access denied: No service center assigned to your account",
        );
      }

      if (existingTicket.assignedServiceCenter !== user.centerCode) {
        throw new Error(
          "Access denied: This ticket is not assigned to your service center",
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

    // Archive ticket data if closing
    if (status === "CLOSED") {
      try {
        await archiveTicketData(ticketId);
        console.log(`Ticket ${ticketId} data archived successfully`);
      } catch (archiveError) {
        console.error(`Failed to archive ticket ${ticketId}:`, archiveError);
        // Continue with the flow even if archiving fails
      }
    }

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
      },
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
      targetUserIds,
    );

    if (io) {
      // Use RBAC-aware emission
      emitTicketEventWithRBAC(io, "ticket", updatedTicket);
      emitTicketEventWithRBAC(io, "conversation", updatedTicket, conversation);
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
          "Access denied: You can only update tickets you created",
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
          "Access denied: No service center assigned to your account",
        );
      }

      if (existingTicket.assignedServiceCenter !== user.centerCode) {
        throw new Error(
          "Access denied: This ticket is not assigned to your service center",
        );
      }
    }
    // For other roles (MACSOFT_ADMIN, MACSOFT_HEAD, MACSOFT_SUPPORT), no restrictions

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: status },
    });

    // Archive ticket data if closing
    if (status === "CLOSED") {
      try {
        await archiveTicketData(ticketId);
        console.log(`Ticket ${ticketId} data archived successfully`);
      } catch (archiveError) {
        console.error(`Failed to archive ticket ${ticketId}:`, archiveError);
        // Continue with the flow even if archiving fails
      }
    }

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
      },
    );

    // Save and broadcast notification to all users
    await saveAndBroadcastNotification(prisma, io, notificationData);

    if (io) {
      // Use RBAC-aware emission
      emitTicketEventWithRBAC(io, "ticket", updatedTicket);
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
          "Access denied: You can only delete tickets you created",
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
          "Access denied: No service center assigned to your account",
        );
      }

      if (ticketToDelete.assignedServiceCenter !== user.centerCode) {
        throw new Error(
          "Access denied: This ticket is not assigned to your service center",
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
      userId,
    );

    // Save and broadcast notification to all users
    await saveAndBroadcastNotification(prisma, io, notificationData);

    if (io) {
      // Use RBAC-aware emission
      const deleteEventData = {
        ticketId: ticketId,
        ticketCode: ticketToDelete.ticketCode,
      };
      emitTicketEventWithRBAC(
        io,
        "ticketDeleted",
        ticketToDelete,
        deleteEventData,
      );
    }

    return deletedTicket;
  } catch (error) {
    throw error;
  }
};

const searchByControllerNumber = async (controllerNo, userId, userRole) => {
  try {
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

    // Build where clause
    let where = {
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
    };

    // Apply role-based filtering
    if (userRole === "CUSTOMER_FIELD_ENGINEER") {
      // Only tickets created by this user
      where.createdBy = userId;
    } else if (userRole === "SERVICE_CENTER_TECHNICIAN") {
      // Only tickets assigned to technician's service center
      if (user?.centerCode) {
        where.assignedServiceCenter = user.centerCode;
      } else {
        // No center => no tickets
        where.id = -1;
      }
    } else if (userRole === "CUSTOMER_SERVICE_HEAD") {
      // CSH sees tickets only if the ticket creator's primary state (createdByUser.stateId)
      // is in the CSH's allowed state IDs (primary + assigned states).
      if (allowedStateIdsArr.length) {
        where.AND = [
          { createdByUser: { stateId: { in: allowedStateIdsArr } } },
        ];
      } else {
        // head has no allowed states => no tickets
        where.id = -1;
      }
    }
    // For MACSOFT_ADMIN, MACSOFT_HEAD, MACSOFT_SUPPORT -> no additional filters (global access)

    const ticket = await prisma.ticket.findFirst({
      where,
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

    return ticket; // Will return null if not found or access denied
  } catch (error) {
    throw error;
  }
};

const searchTickets = async (keyword, userId, userRole) => {
  try {
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

    // Build where clause with search terms
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
        { block: { contains: keyword } },
      ],
      // For receive controller, we want tickets that are ready to be received
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
    };

    // Apply role-based filtering
    if (userRole === "CUSTOMER_FIELD_ENGINEER") {
      // Only tickets created by this user
      where.createdBy = userId;
    } else if (userRole === "SERVICE_CENTER_TECHNICIAN") {
      // Only tickets assigned to technician's service center
      if (user?.centerCode) {
        where.assignedServiceCenter = user.centerCode;
      } else {
        // No center => no tickets
        where.id = -1;
      }
    } else if (userRole === "CUSTOMER_SERVICE_HEAD") {
      // CSH sees tickets only if the ticket creator's primary state (createdByUser.stateId)
      // is in the CSH's allowed state IDs (primary + assigned states).
      if (allowedStateIdsArr.length) {
        where.AND = [
          { createdByUser: { stateId: { in: allowedStateIdsArr } } },
        ];
      } else {
        // head has no allowed states => no tickets
        where.id = -1;
      }
    }
    // For MACSOFT_ADMIN, MACSOFT_HEAD, MACSOFT_SUPPORT -> no additional filters (global access)

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
      take: 50, // Limit results for performance
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
  archiveTicketData,
};
