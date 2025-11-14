const { prisma } = require("../lib/clients");

const getNotifications = async (userId) => {
  try {
    console.log(`📋 Fetching notifications for user: ${userId}`);
    console.log(`📋 UserId type: ${typeof userId}, Value: ${userId}`);
    
    // Ensure userId is a number
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      throw new Error(`Invalid userId: ${userId}`);
    }
    
    console.log(`📋 Converted userId to: ${userIdNum}`);
    
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
    
    console.log(`📋 Found ${notifications.length} notifications for user ${userIdNum}`);
    return notifications;
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

const updateNotification = async (notificationId, userId, io) => {
  try {
    console.log(`✅ Marking notification ${notificationId} as seen for user ${userId}`);
    
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
      console.log(`📤 Emitted notification update to user ${userId}`);
    }

    return notification;
  } catch (error) {
    console.error('❌ Error updating notification:', error);
    throw error;
  }
};

const getNotificationCounts = async (userId) => {
  try {
    console.log(`📊 Getting notification counts for user: ${userId}`);
    
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
    console.log(`📊 Notification counts for user ${userId}:`, counts);
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
