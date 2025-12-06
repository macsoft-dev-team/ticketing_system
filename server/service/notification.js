const { prisma } = require("../lib/clients");

const getNotifications = async (userId) => {
  try {
    // Ensure userId is a number
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      throw new Error(`Invalid userId: ${userId}`);
    }
        
    const notifications = await prisma.notificationRecipient.findMany({
      where: {
        userId: userIdNum,
      },
      include: {
        notification: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
            ticket: {
              select: {
                id: true,
                ticketCode: true,
                customerName: true,
                status: true,
              },
            },
            message: {
              select: {
                id: true,
                content: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          seen: "asc",
        },
        {
          notification: {
            createdAt: "desc",
          },
        },
      ],
    });
        return notifications;
  } catch (error) {
    throw error;
  }
};

const updateNotification = async (notificationId, userId, io) => {
  try {    
    // First check if the notification recipient exists and belongs to the user
    const existingRecipient = await prisma.notificationRecipient.findFirst({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!existingRecipient) {
      throw new Error("Notification not found or unauthorized");
    }

    const notification = await prisma.notificationRecipient.update({
      where: {
        id: notificationId,
      },
      data: {
        seen: true,
        seenAt: new Date(),
      },
      include: {
        notification: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
            ticket: {
              select: {
                id: true,
                ticketCode: true,
                customerName: true,
                status: true,
              },
            },
            message: {
              select: {
                id: true,
                content: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (io) {
      // Emit updated notification to the specific user
      io.to(`notifications-${userId}`).emit("notificationUpdate", notification);
    }

    return notification;
  } catch (error) {
    throw error;
  }
};

const getNotificationCounts = async (userId) => {
  try {    
    const total = await prisma.notificationRecipient.count({
      where: {
        userId: userId,
      },
    });

    const unread = await prisma.notificationRecipient.count({
      where: {
        userId: userId,
        seen: false,
      },
    });

    const counts = { total, unread, read: total - unread };
    return counts;
  } catch (error) {
    throw error;
  }
};

const markNotificationAsRead = async (notificationId, userId) => {
  try {
    // Find the notification recipient record
    const recipient = await prisma.notificationRecipient.findFirst({
      where: {
        notificationId: notificationId,
        userId: userId,
      },
      include: {
        notification: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
            ticket: {
              select: {
                id: true,
                ticketCode: true,
                customerName: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!recipient) {
      throw new Error('Notification not found or unauthorized');
    }

    // Update the seen status
    const updatedRecipient = await prisma.notificationRecipient.update({
      where: {
        id: recipient.id,
      },
      data: {
        seen: true,
        seenAt: new Date(),
      },
      include: {
        notification: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
            ticket: {
              select: {
                id: true,
                ticketCode: true,
                customerName: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return updatedRecipient;
  } catch (error) {
    throw error;
  }
};

const markTicketNotificationsAsSeen = async (ticketId, userId) => {
  try {
    // Find all unseen notifications for this ticket and user
    const recipients = await prisma.notificationRecipient.findMany({
      where: {
        userId: userId,
        seen: false,
        notification: {
          ticketId: ticketId,
        },
      },
    });

    if (recipients.length === 0) {
      return { count: 0, message: 'No unseen notifications found for this ticket' };
    }

    // Mark all as seen
    const recipientIds = recipients.map(r => r.id);
    const result = await prisma.notificationRecipient.updateMany({
      where: {
        id: {
          in: recipientIds,
        },
      },
      data: {
        seen: true,
        seenAt: new Date(),
      },
    });

    return { 
      count: result.count, 
      message: `Marked ${result.count} notifications as seen for ticket ${ticketId}` 
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getNotifications,
  updateNotification,
  getNotificationCounts,
  markNotificationAsRead,
  markTicketNotificationsAsSeen,
};
