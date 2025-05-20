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
            role: true,
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
    const conversation = await prisma.message.create({
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
      },
    });
   /*  if (attachments) {
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
    } */
    const notification = await prisma.notification.create({
      data: {
        type: `#${conversation.ticket?.ticketCode} - conversation`,
        ticketId: ticketId,
        messageId: conversation.id,
        description: `New message from ${conversation.sender?.name} in ticket #${conversation.ticket?.ticketCode}`,
        title: `New message in ticket #${conversation.ticket?.ticketCode}`,
        createdById: userId,
      },
    });
    const notificationRecipients = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
      },
    });
    await Promise.all(
      notificationRecipients.map(async (recipient) => {
        await prisma.notificationRecipient.create({
          data: {
            userId: recipient.id,
            notificationId: notification.id,
          },
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
        });
      })
    );
    conversation.ticketId = ticketId;
    const _notificationRecipients = await prisma.notificationRecipient.findMany({
      where: {
        notificationId: notification.id,
      },
      include: {
        notification: {
          include: {
            createdBy: true,
            ticket: true,
            message: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });
    if (io && notificationRecipients.length > 0) {
      io.emit("notification", _notificationRecipients);
    }
    if (io) {
      io.emit(`conversation`, conversation);
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
