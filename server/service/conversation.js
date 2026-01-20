const { prisma } = require("../lib/clients");
const { generateTicketFileUrl } = require("../lib/ticket_file_handler");
const {
  createNotification,
  saveAndBroadcastNotification,
  NOTIFICATION_TYPES,
} = require("../lib/notificationUtils");
const fs = require("fs");

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

// RBAC Socket emission helper for conversation events
const emitConversationEventWithRBAC = (
  io,
  eventName,
  ticketData,
  eventData
) => {
  if (!io || !ticketData) return;

  const dataToEmit = eventData;

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
      dataToEmit
    );
  }

  // Emit to Customer Service Heads
  io.to("role-CUSTOMER_SERVICE_HEAD").emit(eventName, dataToEmit);

  // Also emit to conversation room for real-time chat
  const conversationRoom = `conversation-${ticketData.id}`;
  io.to(conversationRoom).emit(eventName, dataToEmit);
};

const getConversations = async (ticketId) => {
  try {
    // First check if ticket is archived
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        status: true,
        backupurl: true,
      },
    });

    // If ticket is closed and has archived data, return archived messages
    if (ticket && ticket.status === "CLOSED" && ticket.backupurl) {
      try {
        const archivedData = await readBackupFromFile(ticket.backupurl);
        if (!archivedData) {
          throw new Error("Failed to read backup data from file");
        }
        // Return archived messages with proper structure
        return archivedData.messages || [];
      } catch (parseError) {
        console.error("Error parsing archived messages:", parseError);
        // Fall through to normal query if parsing fails
      }
    }

    // For non-archived tickets, fetch from database
    const conversations = await prisma.message.findMany({
      where: { ticketId: ticketId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        attachments: true,
        ticket: true,
        seenBy: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    return conversations;
  } catch (error) {
    throw error;
  }
};

const createConversation = async (conversation, userId, io, files = []) => {
  const { ticketId, message } = conversation;
  try {
    const newMessage = await prisma.message.create({
      data: {
        ticketId: ticketId,
        content: message,
        senderId: userId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        ticket: true,
        seenBy: true,
        attachments: true,
      },
    });

    // Create attachments if any files were uploaded
    if (files && files.length > 0) {
      // Get ticket code for generating proper file URLs
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { ticketCode: true },
      });

      await prisma.attachments.createMany({
        data: files.map((file) => ({
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          fileUrl: generateTicketFileUrl(
            ticket.ticketCode,
            file.filename,
            "conversations"
          ),
          messageId: newMessage.id,
          ticketId: ticketId,
        })),
      });

      // Fetch the message again with attachments
      const messageWithAttachments = await prisma.message.findUnique({
        where: { id: newMessage.id },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              phone: true,
              role: true,
            },
          },
          ticket: true,
          seenBy: true,
          attachments: true,
        },
      });

      // Replace the message object with the one that includes attachments
      Object.assign(newMessage, messageWithAttachments);
    }
    // Create notification using the standardized utility
    const notificationData = createNotification(
      NOTIFICATION_TYPES.MESSAGE_RECEIVED,
      `New message in ticket #${newMessage.ticket?.ticketCode}`,
      `New message from ${newMessage.sender?.name} in ticket #${
        newMessage.ticket?.ticketCode
      }: "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"`,
      {
        ticketId: ticketId,
        messageId: newMessage.id,
        userId: userId,
        ticketCode: newMessage.ticket?.ticketCode,
      }
    );

    // Get target users (all roles, excluding the sender)
    const targetUsers = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } }, // Exclude the sender
          {
            role: {
              in: [
                "MACSOFT_ADMIN",
                "MACSOFT_HEAD",
                "MACSOFT_SUPPORT",
                "CUSTOMER_SERVICE_HEAD",
                "SERVICE_CENTER_TECHNICIAN",
              ],
              not: "CUSTOMER_FIELD_ENGINEER",
            },
          },
        ],
      },
      select: { id: true, name: true, role: true },
    });

    //if userId not equal to createdby then add createdby to target users
    const ticketDetails = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { createdBy: true },
    });

    const targetUserIds = targetUsers.map((user) => user.id);
    if (ticketDetails.createdBy !== userId) {
      targetUserIds.push(ticketDetails.createdBy);
    }
    // Verify sender is not in target list
    const senderInTargets = targetUserIds.includes(userId);

    if (senderInTargets) {
      console.error(
        `   ❌ CRITICAL ERROR: Sender ${newMessage.sender?.name} is receiving their own notification!`
      );
    }

    // Save and broadcast notification using the standardized utility
    await saveAndBroadcastNotification(
      prisma,
      io,
      notificationData,
      targetUserIds
    );

    // If sender is a MACSOFT user, turn off buzzer alert for this ticket
    const senderUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const MACSOFT_ROLES = ["MACSOFT_ADMIN", "MACSOFT_HEAD", "MACSOFT_SUPPORT"];
    if (senderUser && MACSOFT_ROLES.includes(senderUser.role)) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { isBuzzerOn: false },
      });

      // Emit socket event to clear buzzer alert
      if (io) {
        io.to("role-MACSOFT_HEAD").emit("buzzer_alert_cleared", {
          ticketId,
          ticketCode: newMessage.ticket?.ticketCode,
        });
        io.to("role-MACSOFT_SUPPORT").emit("buzzer_alert_cleared", {
          ticketId,
          ticketCode: newMessage.ticket?.ticketCode,
        });
      }
    }

    if (io) {
      // Get ticket data for RBAC emission
      const ticketData = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          ticketCode: true,
          createdBy: true,
          assignedServiceCenter: true,
        },
      });

      // Use RBAC-aware emission
      if (ticketData) {
        emitConversationEventWithRBAC(
          io,
          "conversation",
          ticketData,
          newMessage
        );
      } else {
        // Fallback if ticket not found
        io.emit("conversation", newMessage);
      }

      // Emit ticket message update for ticket cards
      const ticketMessageData = {
        ticketId: ticketId,
        id: newMessage.id,
        content: newMessage.content,
        createdAt: newMessage.createdAt,
        senderId: newMessage.senderId,
        sender: newMessage.sender,
        attachments: newMessage.attachments || [],
        seenBy: newMessage.seenBy || [],
        // Additional ticket-level data
        ticketUpdates: {
          lastMessageAt: newMessage.createdAt,
          lastMessageBy: newMessage.sender?.name || "Unknown",
          hasNewMessage: true,
          lastActivity: newMessage.createdAt,
        },
      };

      // Broadcast to authorized users to update ticket cards using RBAC
      if (ticketData) {
        emitConversationEventWithRBAC(
          io,
          "ticket-message",
          ticketData,
          ticketMessageData
        );
      } else {
        // Fallback if ticket not found
        io.emit("ticket-message", ticketMessageData);
      }
    }
    return newMessage;
  } catch (error) {
    throw error;
  }
};

const updateSeen = async (conversationId, userId) => {
  try {
    // This function is deprecated - use markMessagesAsSeen instead
    console.warn("updateSeen is deprecated, use markMessagesAsSeen instead");
    return { success: false, message: "Function deprecated" };
  } catch (error) {
    throw error;
  }
};

// Mark specific message as seen by user
const markMessageAsSeen = async (messageId, userId) => {
  try {
    // Use upsert to avoid duplicate entries due to unique constraint
    const messageSeen = await prisma.messageSeen.upsert({
      where: {
        messageId_userId: {
          messageId: messageId,
          userId: userId,
        },
      },
      update: {
        seenAt: new Date(),
      },
      create: {
        messageId: messageId,
        userId: userId,
        seenAt: new Date(),
      },
    });
    return messageSeen;
  } catch (error) {
    throw error;
  }
};

// Mark multiple messages as seen for a ticket
const markMessagesAsSeen = async (
  ticketId,
  userId,
  messageIds = null,
  retryCount = 0
) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 100; // Base delay in milliseconds

  try {
    // Get messages to mark as seen
    const whereClause = { ticketId: ticketId };
    if (messageIds && messageIds.length > 0) {
      whereClause.id = { in: messageIds };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (messages.length === 0) {
      return {
        success: true,
        markedCount: 0,
        totalMessages: 0,
      };
    }

    // Filter out messages that are already seen by this user
    const existingSeenRecords = await prisma.messageSeen.findMany({
      where: {
        messageId: { in: messages.map((m) => m.id) },
        userId: userId,
      },
      select: { messageId: true },
    });

    const seenMessageIds = new Set(existingSeenRecords.map((r) => r.messageId));
    const unseenMessages = messages.filter((m) => !seenMessageIds.has(m.id));

    if (unseenMessages.length === 0) {
      return {
        success: true,
        markedCount: 0,
        totalMessages: messages.length,
      };
    }

    // Create MessageSeen records for unseen messages
    const messageSeenData = unseenMessages.map((message) => ({
      messageId: message.id,
      userId: userId,
      seenAt: new Date(),
    }));

    // Use createMany with skipDuplicates to avoid constraint violations
    const result = await prisma.messageSeen.createMany({
      data: messageSeenData,
      skipDuplicates: true,
    });

    return {
      success: true,
      markedCount: result.count,
      totalMessages: messages.length,
    };
  } catch (error) {
    // Handle write conflict/deadlock errors (P2034) with retry logic
    if (error.code === "P2034" && retryCount < MAX_RETRIES) {
      // Exponential backoff: wait longer with each retry
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return markMessagesAsSeen(ticketId, userId, messageIds, retryCount + 1);
    }

    throw error;
  }
};

// Get unread message count for a user in a ticket
const getUnreadMessageCount = async (ticketId, userId) => {
  try {
    const unreadCount = await prisma.message.count({
      where: {
        ticketId: ticketId,
        senderId: { not: userId }, // Exclude own messages
        seenBy: {
          none: {
            userId: userId,
          },
        },
      },
    });
    return unreadCount;
  } catch (error) {
    throw error;
  }
};

// Constants for role management
const MACSOFT_ROLES = ["MACSOFT_ADMIN", "MACSOFT_HEAD", "MACSOFT_SUPPORT"];

/**
 * Get unreplied messages for a user based on their role and audience perspective
 * @param {number} currentUserId - The ID of the current user
 * @param {string} currentUserRole - The role of the current user
 * @param {string} audience - Either "MACSOFT" or "CUSTOMER" - determines which team's unreplied messages to fetch
 * @returns {Promise<Array>} Array of unreplied message objects with ticket and sender details
 */
const getUnrepliedMessagesForUser = async (
  currentUserId,
  currentUserRole,
  audience
) => {
  try {
    // Validate audience parameter
    if (!["MACSOFT", "CUSTOMER"].includes(audience)) {
      throw new Error('audience must be either "MACSOFT" or "CUSTOMER"');
    }

    // Step 1: Fetch current user for RBAC filtering
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        centerCode: true,
        State: { select: { id: true } },
        states: { select: { id: true } },
        role: true,
      },
    });

    // Build allowed state IDs for CUSTOMER_SERVICE_HEAD
    const allowedStateIds = new Set();
    if (user?.State?.id) allowedStateIds.add(user.State.id);
    (user?.states || []).forEach((s) => s?.id && allowedStateIds.add(s.id));
    const allowedStateIdsArr = [...allowedStateIds];

    // Step 2: Build base ticket filter - exclude closed tickets and specific milestone stages
    const baseTicketWhere = {
      status: { not: "CLOSED" },
      ticketMilestones: {
        none: {
          stage: {
            in: [
              "REQUEST_CLEARED_AT_FIELD",
              "DELIVERED_TO_FIELD",
              "TICKET_CLOSED",
            ],
          },
        },
      },
    };

    // Step 3: Apply RBAC filtering based on user role
    if (currentUserRole === "CUSTOMER_FIELD_ENGINEER") {
      // Field engineers only see tickets they created
      baseTicketWhere.createdBy = currentUserId;
    } else if (currentUserRole === "SERVICE_CENTER_TECHNICIAN") {
      // Technicians only see tickets assigned to their service center
      if (user?.centerCode) {
        baseTicketWhere.assignedServiceCenter = user.centerCode;
      } else {
        // No center code = no tickets
        baseTicketWhere.id = -1;
      }
    } else if (currentUserRole === "CUSTOMER_SERVICE_HEAD") {
      // Service heads see tickets where creator's state is in their allowed states
      if (allowedStateIdsArr.length > 0) {
        baseTicketWhere.AND = [
          { createdByUser: { stateId: { in: allowedStateIdsArr } } },
        ];
      } else {
        // No allowed states = no tickets
        baseTicketWhere.id = -1;
      }
    }
    // MACSOFT_* roles have global access - no additional filtering needed

    // Step 4: Determine which sender roles to look for based on audience
    let targetSenderRoles;
    let replierRoles;

    if (audience === "MACSOFT") {
      // MACSOFT audience: Find non-MACSOFT messages that MACSOFT hasn't replied to
      targetSenderRoles = { notIn: MACSOFT_ROLES };
      replierRoles = MACSOFT_ROLES;
    } else {
      // CUSTOMER audience: Find MACSOFT messages that CUSTOMER hasn't replied to
      targetSenderRoles = { in: MACSOFT_ROLES };
      replierRoles = [
        "CUSTOMER_FIELD_ENGINEER",
        "SERVICE_CENTER_TECHNICIAN",
        "CUSTOMER_SERVICE_HEAD",
      ];
    }

    // Step 5: Get latest message per ticket from the target sender group
    // Use groupBy to efficiently find the most recent message timestamp per ticket
    const latestTargetMessages = await prisma.message.groupBy({
      by: ["ticketId"],
      where: {
        sender: { role: targetSenderRoles },
        ticket: baseTicketWhere,
      },
      _max: { createdAt: true },
    });

    // Create a map of ticketId -> latest target message timestamp
    const latestTargetTimestamps = new Map(
      latestTargetMessages.map((m) => [
        m.ticketId,
        m._max.createdAt?.getTime() || 0,
      ])
    );

    // If no messages found, return empty array
    if (latestTargetTimestamps.size === 0) {
      return [];
    }

    // Step 6: Get latest reply message per ticket from the replier group (if any)
    const latestReplies = await prisma.message.groupBy({
      by: ["ticketId"],
      where: {
        sender: { role: { in: replierRoles } },
        ticketId: { in: [...latestTargetTimestamps.keys()] },
      },
      _max: { createdAt: true },
    });

    // Create a map of ticketId -> latest reply timestamp
    const latestReplyTimestamps = new Map(
      latestReplies.map((m) => [m.ticketId, m._max.createdAt?.getTime() || 0])
    );

    // Step 7: Filter tickets where target message is after latest reply (or no reply exists)
    const unrepliedTicketIds = [...latestTargetTimestamps.keys()].filter(
      (ticketId) => {
        const targetTime = latestTargetTimestamps.get(ticketId) || 0;
        const replyTime = latestReplyTimestamps.get(ticketId) || 0;
        // Include ticket if no reply exists OR target message is newer than reply
        return targetTime > replyTime;
      }
    );

    if (unrepliedTicketIds.length === 0) {
      return [];
    }

    // Step 8: Fetch the actual message records for these unreplied tickets
    const unrepliedMessages = await prisma.message.findMany({
      where: {
        ticketId: { in: unrepliedTicketIds },
        sender: { role: targetSenderRoles },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketCode: true,
            description: true,
            status: true,
            createdBy: true,
            assignedServiceCenter: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Step 9: Filter to keep only the latest message per ticket and check if unseen by current user
    const ticketMessageMap = new Map();

    for (const message of unrepliedMessages) {
      const ticketId = message.ticketId;
      const messageTime = new Date(message.createdAt).getTime();
      const latestTargetTime = latestTargetTimestamps.get(ticketId) || 0;

      // Only keep if this is the latest target message for this ticket
      if (messageTime === latestTargetTime) {
        if (
          !ticketMessageMap.has(ticketId) ||
          messageTime >
            new Date(ticketMessageMap.get(ticketId).createdAt).getTime()
        ) {
          ticketMessageMap.set(ticketId, message);
        }
      }
    }

    const messageIdsToCheck = [...ticketMessageMap.values()].map((m) => m.id);

    // Step 10: Check which messages are unseen by current user
    const seenMessages = await prisma.messageSeen.findMany({
      where: {
        messageId: { in: messageIdsToCheck },
        userId: currentUserId,
      },
      select: { messageId: true },
    });

    const seenMessageIds = new Set(seenMessages.map((s) => s.messageId));

    // Step 11: Filter to only include messages unseen by current user
    const finalUnrepliedMessages = [...ticketMessageMap.values()]
      .map((message) => ({
        messageId: message.id,
        ticketId: message.ticket.id,
        ticketCode: message.ticket.ticketCode,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        senderId: message.sender.id,
        senderName: message.sender.name,
        senderRole: message.sender.role,
        hasAttachments: message.attachments.length > 0,
        unreadByUser: true, // By definition, these are all unread
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return finalUnrepliedMessages;
  } catch (error) {
    console.error("Error in getUnrepliedMessagesForUser:", error);
    throw error;
  }
};

// getTicketsNotRepliedByMacsoft.js - Legacy function for backward compatibility
const getTicketsNotRepliedByMacsoft = async (userId, userRole) => {
  try {
    // Fetch user for RBAC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        centerCode: true,
        State: { select: { id: true } },
        states: { select: { id: true } },
        role: true,
      },
    });

    // Allowed states for CUSTOMER_SERVICE_HEAD
    const allowedStateIds = new Set();
    if (user?.State?.id) allowedStateIds.add(user.State.id);
    (user?.states || []).forEach((s) => s?.id && allowedStateIds.add(s.id));

    const where = {
      status: { not: "CLOSED" },

      messages: {
        some: {}, // must have messages
      },

      ticketMilestones: {
        none: {
          stage: {
            in: [
              "REQUEST_CLEARED_AT_FIELD",
              "DELIVERED_TO_FIELD",
              "TICKET_CLOSED",
            ],
          },
        },
      },
    };

    // RBAC
    if (userRole === "CUSTOMER_FIELD_ENGINEER") {
      where.createdBy = userId;
    } else if (userRole === "SERVICE_CENTER_TECHNICIAN") {
      where.assignedServiceCenter = user?.centerCode ?? "__NO_CENTER__";
    } else if (userRole === "CUSTOMER_SERVICE_HEAD") {
      const ids = [...allowedStateIds];
      if (!ids.length) where.id = -1;
      else where.AND = [{ createdByUser: { stateId: { in: ids } } }];
    }

    // STEP 1: Get last NON-macsoft message for each ticket
    const lastNonMacsoftMessages = await prisma.message.groupBy({
      by: ["ticketId"],
      where: {
        sender: { role: { notIn: MACSOFT_ROLES } },
      },
      _max: { createdAt: true },
    });

    // Map ticketId -> timestamp
    const lastNonMap = new Map(
      lastNonMacsoftMessages.map((m) => [
        m.ticketId,
        m._max.createdAt ? m._max.createdAt.getTime() : null,
      ])
    );

    // Restrict tickets only to ones that actually have non-Macsoft messages
    where.id = { in: [...lastNonMap.keys()] };

    // STEP 2: Fetch full ticket info for those
    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        id: true,
        ticketCode: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            sender: { select: { name: true, role: true } },
            attachments: { select: { id: true } },
          },
        },
      },
    });

    // STEP 3: Extract messageIds for the latest NON-macsoft messages
    const lastMessageIds = await prisma.message.findMany({
      where: {
        ticketId: { in: tickets.map((t) => t.id) },
        sender: { role: { notIn: MACSOFT_ROLES } },
      },
      orderBy: { createdAt: "desc" },
      take: 1,
      select: { id: true, ticketId: true },
    });

    const lastMsgMap = new Map(lastMessageIds.map((m) => [m.ticketId, m.id]));

    // STEP 4: Fetch MessageSeen for Macsoft team members
    const seen = await prisma.messageSeen.findMany({
      where: {
        messageId: { in: [...lastMsgMap.values()] },
        user: { role: { in: MACSOFT_ROLES } },
      },
      select: { messageId: true },
    });

    const seenSet = new Set(seen.map((s) => s.messageId));

    // STEP 5: FILTER — only include tickets where last non-macsoft message is UNSEEN
    const final = tickets.filter((t) => {
      const lastMsgId = lastMsgMap.get(t.id);
      return !seenSet.has(lastMsgId);
    });

    // Sort by last message time
    return final.sort((a, b) => {
      const ta = new Date(a.messages[0]?.createdAt).getTime();
      const tb = new Date(b.messages[0]?.createdAt).getTime();
      return tb - ta;
    });
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getConversations,
  createConversation,
  updateSeen, // Deprecated
  markMessageAsSeen,
  markMessagesAsSeen,
  getUnreadMessageCount,
  getUnrepliedTickets: getTicketsNotRepliedByMacsoft,
  getUnrepliedMessagesForUser, // New function for flexible unreplied messages
};
