const { prisma } = require("../lib/clients");
const { generateTicketFileUrl } = require("../lib/ticket_file_handler");
const {
  createNotification,
  saveAndBroadcastNotification,
  NOTIFICATION_TYPES,
} = require("../lib/notificationUtils");

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

    console.log(`💬 Message notification targeting:`);
    console.log(`   Sender: ${newMessage.sender?.name} (ID: ${userId})`);
    console.log(`   Target users (${targetUsers.length}):`);
    targetUsers.forEach((user) => {
      console.log(`     - ${user.name} (${user.role}) - ID: ${user.id}`);
    });

    // Verify sender is not in target list
    const senderInTargets = targetUserIds.includes(userId);
    console.log(
      `   ✅ Sender excluded from notifications: ${
        !senderInTargets ? "YES" : "NO (ERROR!)"
      }`
    );

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
      // Emit to conversation room for this specific ticket
      const conversationRoom = `conversation-${ticketId}`;
      io.to(conversationRoom).emit("conversation", newMessage);

      // Also emit to all clients as fallback
      io.emit("conversation", newMessage);

      console.log(
        `💬 Emitted conversation message to room: ${conversationRoom} and all clients`
      );
      console.log("Message content:", {
        id: newMessage.id,
        content: newMessage.content,
        senderId: newMessage.senderId,
      });
    }
    return newMessage;
  } catch (error) {
    throw error;
  }
};

const updateSeen = async (conversationId, userId) => {
  try {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        seen: true,
        seenBy: {
          connect: {
            id: userId,
          },
        },
      },
    });
    return conversation;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getConversations,
  createConversation,
  updateSeen,
};
