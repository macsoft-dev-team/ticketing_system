const { prisma } = require("../lib/clients");

const getConversations = async (ticketId) => {
  try {
    const conversations = await prisma.message.findMany({
      where: { id: ticketId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        attachments: true,
        ticket: true,
        seenBy:true
      },
    });
    return conversations;
  } catch (error) {
    throw error;
  }
};

const createConversation = async (conversation, userId, io) => {
  const { ticketId, message, attachments } = conversation;
  try {
    const conversation = await prisma.conversation.create({
      data: {
        ticketId: ticketId,
        message: message,
        senderId: userId,
      },
    });
    if (attachments) {
      await Promise.all(
        attachments.map(async (attachment) => {
          await prisma.attachments.create({
            data: {
              conversationId: conversation.id,
              url: attachment.url,
              type: attachment.type,
            },
          });
        })
      );
    }
    const notification = await prisma.notification.create({
      data: {
        type: `#${conversation.ticket.tickedCode} - conversation`,
        userId: userId,
        ticketId: ticketId,
        conversationId: conversation.id,
      },
    });
    if (io) {
      io.emit("conversation", conversation);
      io.emit("notification", notification);
    }
    return conversation;
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
