const { prisma } = require("../lib/clients");

const getNotifications = async (userId) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        recipients: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        ticket: true,
        recipients: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return notifications;
  } catch (error) {
    throw error;
  }
}

const updateNotification = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        seen: true,
        seenBy: {
          connect: {
            userId: userId,
          },
        },
      },
    });
    return notification;
  } catch (error) {
    throw error;
  }
}

module.exports = {
    getNotifications,
    updateNotification,
    };

