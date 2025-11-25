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
    console.error('❌ Error fetching notifications:', error);
    console.error('❌ Error stack:', error.stack);
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
    console.error('❌ Error updating notification:', error);
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
    console.error('❌ Error getting notification counts:', error);
    throw error;
  }
};

module.exports = {
  getNotifications,
  updateNotification,
  getNotificationCounts,
};
