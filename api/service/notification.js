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
            createdBy: true,
            ticket: true,
            message: true,
          },
        },
      },
    });
    if (io) {
      const notificationData = await prisma.notificationRecipient.findUnique({
        where: {
          id: notificationId,
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
      });
      io.emit("notification", notificationData);
    }

    return notification;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getNotifications,
  updateNotification,
};
