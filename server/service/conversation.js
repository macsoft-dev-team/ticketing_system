const { prisma } = require("../lib/clients");
const { generateTicketFileUrl } = require("../lib/ticket_file_handler");
const {
  createNotification,
  saveAndBroadcastNotification,
  NOTIFICATION_TYPES,
} = require("../lib/notificationUtils");

// RBAC Socket emission helper for conversation events
const emitConversationEventWithRBAC = (io, eventName, ticketData, eventData) => {
  if (!io || !ticketData) return;
  
  const dataToEmit = eventData;
  
  // Always emit to MACSOFT roles (global access)
  io.to('role-MACSOFT_ADMIN').emit(eventName, dataToEmit);
  io.to('role-MACSOFT_HEAD').emit(eventName, dataToEmit);
  io.to('role-MACSOFT_SUPPORT').emit(eventName, dataToEmit);
  
  // Emit to ticket creator (if they are a field engineer)
  if (ticketData.createdBy) {
    io.to(`notifications-${ticketData.createdBy}`).emit(eventName, dataToEmit);
  }
  
  // Emit to assigned service center
  if (ticketData.assignedServiceCenter) {
    io.to(`center-${ticketData.assignedServiceCenter}`).emit(eventName, dataToEmit);
  }
  
  // Emit to Customer Service Heads
  io.to('role-CUSTOMER_SERVICE_HEAD').emit(eventName, dataToEmit);
  
  // Also emit to conversation room for real-time chat
  const conversationRoom = `conversation-${ticketData.id}`;
  io.to(conversationRoom).emit(eventName, dataToEmit);
  
  console.log(`💬 [RBAC SOCKET] Emitted ${eventName} for ticket ${ticketData.ticketCode || ticketData.id} to authorized roles`);
};

const getConversations = async (ticketId) => {
  try {
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
    if (io) {
      // Get ticket data for RBAC emission
      const ticketData = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { 
          id: true, 
          ticketCode: true, 
          createdBy: true, 
          assignedServiceCenter: true 
        }
      });
      
      // Use RBAC-aware emission
      if (ticketData) {
        emitConversationEventWithRBAC(io, "conversation", ticketData, newMessage);
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
          lastMessageBy: newMessage.sender?.name || 'Unknown',
          hasNewMessage: true,
          lastActivity: newMessage.createdAt
        }
      };
      
      // Broadcast to authorized users to update ticket cards using RBAC
      if (ticketData) {
        emitConversationEventWithRBAC(io, "ticket-message", ticketData, ticketMessageData);
      } else {
        // Fallback if ticket not found
        io.emit("ticket-message", ticketMessageData);
      }
      console.log(`🎫 Emitted RBAC ticket-message update for ticket ${ticketId}`);
    }
    return newMessage;
  } catch (error) {
    throw error;
  }
};

const updateSeen = async (conversationId, userId) => {
  try {
    // This function is deprecated - use markMessagesAsSeen instead
    console.warn('updateSeen is deprecated, use markMessagesAsSeen instead');
    return { success: false, message: 'Function deprecated' };
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
const markMessagesAsSeen = async (ticketId, userId, messageIds = null) => {
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

    // Create MessageSeen records for messages not already seen by this user
    const messageSeenData = messages.map(message => ({
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

module.exports = {
  getConversations,
  createConversation,
  updateSeen, // Deprecated
  markMessageAsSeen,
  markMessagesAsSeen,
  getUnreadMessageCount,
};
