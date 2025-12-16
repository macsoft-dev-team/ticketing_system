const { prisma } = require("../lib/clients");

const getNotifications = async (userId) => {
  try {
    // Ensure userId is a number
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      throw new Error(`Invalid userId: ${userId}`);
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { role: true, centerCode: true },
    });

    // Build where clause based on user role
    const whereClause = {
      userId: userIdNum,
    };

    // For CUSTOMER_FIELD_ENGINEER, only show notifications for tickets they created
    if (user && user.role === 'CUSTOMER_FIELD_ENGINEER') {
      whereClause.notification = {
        ticket: {
          createdBy: userIdNum,
        },
      };
    }

    // For SERVICE_CENTER_TECHNICIAN, only show notifications for tickets assigned to their service center
    if (user && user.role === 'SERVICE_CENTER_TECHNICIAN' && user.centerCode) {
      whereClause.notification = {
        ticket: {
          assignedServiceCenter: user.centerCode,
        },
      };
    }
        
    const notifications = await prisma.notificationRecipient.findMany({
      where: whereClause,
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
    // Fetch user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, centerCode: true },
    });

    // Build where clause based on user role
    const whereClause = {
      userId: userId,
    };

    // For CUSTOMER_FIELD_ENGINEER, only count notifications for tickets they created
    if (user && user.role === 'CUSTOMER_FIELD_ENGINEER') {
      whereClause.notification = {
        ticket: {
          createdBy: userId,
        },
      };
    }

    // For SERVICE_CENTER_TECHNICIAN, only count notifications for tickets assigned to their service center
    if (user && user.role === 'SERVICE_CENTER_TECHNICIAN' && user.centerCode) {
      whereClause.notification = {
        ticket: {
          assignedServiceCenter: user.centerCode,
        },
      };
    }

    const total = await prisma.notificationRecipient.count({
      where: whereClause,
    });

    const unread = await prisma.notificationRecipient.count({
      where: {
        ...whereClause,
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

const getNotificationsWithFilters = async (userId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      type = 'all',
      status = 'all',
      dateRange = 'all',
      ticketId = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      throw new Error(`Invalid userId: ${userId}`);
    }

    // Fetch user role
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: { role: true, centerCode: true },
    });

    const skip = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {
      userId: userIdNum,
    };

    // Add notification filters
    const notificationWhere = {};

    // Search filter
    if (search) {
      notificationWhere.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Type filter
    if (type !== 'all') {
      if (type === 'message') {
        notificationWhere.type = { contains: 'message' };
      } else if (type === 'ticket') {
        notificationWhere.type = { contains: 'ticket' };
      } else if (type === 'spare_request') {
        notificationWhere.OR = [
          { type: { contains: 'spare' } },
          { type: { contains: 'request' } }
        ];
      } else if (type === 'user') {
        notificationWhere.type = { contains: 'user' };
      } else if (type === 'service_center') {
        notificationWhere.type = { contains: 'service' };
      } else if (type === 'system') {
        notificationWhere.OR = [
          { type: { contains: 'system' } },
          { type: { contains: 'alert' } }
        ];
      }
    }

    // Status filter
    if (status === 'read') {
      whereClause.seen = true;
    } else if (status === 'unread') {
      whereClause.seen = false;
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          break;
      }

      if (startDate) {
        notificationWhere.createdAt = {
          gte: startDate
        };
      }
    }

    // Ticket ID filter
    if (ticketId) {
      notificationWhere.ticketId = parseInt(ticketId);
    }

    // For CUSTOMER_FIELD_ENGINEER, only show notifications for tickets they created
    if (user && user.role === 'CUSTOMER_FIELD_ENGINEER') {
      notificationWhere.ticket = {
        createdBy: userIdNum,
      };
    }

    // For SERVICE_CENTER_TECHNICIAN, only show notifications for tickets assigned to their service center
    if (user && user.role === 'SERVICE_CENTER_TECHNICIAN' && user.centerCode) {
      notificationWhere.ticket = {
        assignedServiceCenter: user.centerCode,
      };
    }

    // Add notification filters to where clause
    if (Object.keys(notificationWhere).length > 0) {
      whereClause.notification = notificationWhere;
    }

    // Build sort clause
    const orderBy = [];
    if (sortBy === 'createdAt') {
      orderBy.push({
        notification: {
          createdAt: sortOrder
        }
      });
    } else if (sortBy === 'seen') {
      orderBy.push({ seen: sortOrder });
    }

    // Always sort unseen first, then by creation date
    orderBy.unshift({ seen: 'asc' });

    // Get total count
    const totalCount = await prisma.notificationRecipient.count({
      where: whereClause
    });

    // Get notifications with pagination
    const notifications = await prisma.notificationRecipient.findMany({
      where: whereClause,
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
      orderBy,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: notifications,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  } catch (error) {
    throw error;
  }
};

const deleteNotification = async (notificationId, userId) => {
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

    // Delete the notification recipient
    await prisma.notificationRecipient.delete({
      where: {
        id: notificationId,
      },
    });

    return { success: true, message: "Notification deleted successfully" };
  } catch (error) {
    throw error;
  }
};

const bulkUpdateNotifications = async (notificationIds, userId, updateData) => {
  try {
    // Verify all notifications belong to the user
    const existingRecipients = await prisma.notificationRecipient.findMany({
      where: {
        id: { in: notificationIds },
        userId: userId,
      },
    });

    if (existingRecipients.length !== notificationIds.length) {
      throw new Error("Some notifications not found or unauthorized");
    }

    // Update notifications
    const result = await prisma.notificationRecipient.updateMany({
      where: {
        id: { in: notificationIds },
        userId: userId,
      },
      data: {
        ...updateData,
        seenAt: updateData.seen ? new Date() : undefined,
      },
    });

    return {
      success: true,
      message: `${result.count} notification(s) updated successfully`,
      count: result.count
    };
  } catch (error) {
    throw error;
  }
};

const bulkDeleteNotifications = async (notificationIds, userId) => {
  try {
    // Verify all notifications belong to the user
    const existingRecipients = await prisma.notificationRecipient.findMany({
      where: {
        id: { in: notificationIds },
        userId: userId,
      },
    });

    if (existingRecipients.length !== notificationIds.length) {
      throw new Error("Some notifications not found or unauthorized");
    }

    // Delete notifications
    const result = await prisma.notificationRecipient.deleteMany({
      where: {
        id: { in: notificationIds },
        userId: userId,
      },
    });

    return {
      success: true,
      message: `${result.count} notification(s) deleted successfully`,
      count: result.count
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getNotifications,
  getNotificationsWithFilters,
  updateNotification,
  deleteNotification,
  bulkUpdateNotifications,
  bulkDeleteNotifications,
  getNotificationCounts,
  markNotificationAsRead,
  markTicketNotificationsAsSeen,
};
