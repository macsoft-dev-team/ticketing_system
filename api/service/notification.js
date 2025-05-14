const { prisma } = require("../lib/clients");

const getNotifications = async (userId) => {
  try {
    const notifications = await prisma.notificationRecipient.findMany({
      where: {
        userId: userId,
      },
      include: {
        notification: {
          include: {
            createdBy: true,
            ticket: true,
            message: true,            
          },
        },
      },
      orderBy: {
         notification: {
          createdAt: "desc",
         }
      },
    });
    return notifications;
  } catch (error) {
    throw error;
  }
}

const updateNotification = async (notificationId, userId) => {
  try {
    const notification = await prisma.notificationRecipient.update({
      where: {
        notificationId_userId: {
          notificationId: notificationId,
          userId: userId,
        },
      }, 
      data: {
        seen: true,
        user: {
          connect: {
            id: userId,
          },
        },
        notification: {
          connect: {
            id: notificationId,
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

