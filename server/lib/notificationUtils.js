// Enhanced notification broadcasting utility with role-based and permission-based targeting
const broadcastNotification = (io, notificationData, targetOptions = {}) => {
  const {
    targetUserId,
    targetRole,
    targetStateCode,
    targetCenterCode,
    excludeUserId,
    broadcastType = 'specific' // 'specific', 'role', 'state', 'center', 'global'
  } = targetOptions;

  // If specific user is targeted
  if (targetUserId) {
    const userRoom = `notifications-${targetUserId}`;
    io.to(userRoom).emit("notification", notificationData);
   // console.log(`📢 Notification sent to user ${targetUserId}`);
    return;
  }

  // Role-based broadcasting
  if (targetRole) {
    const roleRoom = `role-${targetRole}`;
    io.to(roleRoom).emit("notification", notificationData);
    //console.log(`📢 Notification sent to role ${targetRole}`);
    return;
  }

  // State-based broadcasting (for Customer Service Heads)
  if (targetStateCode) {
    const stateRoom = `state-${targetStateCode}`;
    io.to(stateRoom).emit("notification", notificationData);
   // console.log(`📢 Notification sent to state ${targetStateCode}`);
    return;
  }

  // Service center-based broadcasting
  if (targetCenterCode) {
    const centerRoom = `center-${targetCenterCode}`;
    io.to(centerRoom).emit("notification", notificationData);
    //console.log(`📢 Notification sent to center ${targetCenterCode}`);
    return;
  }

  // Global broadcast (with optional exclusion)
  if (excludeUserId) {
    // Send to all rooms except the excluded user
    const excludeRoom = `notifications-${excludeUserId}`;
    io.except(excludeRoom).emit("notification", notificationData);
   // console.log(`📢 Global notification sent (excluding user ${excludeUserId})`);
  } else {
    // Broadcast to all connected clients
    io.emit("notification", notificationData);
    //console.log(`📢 Global notification sent to all users`);
  }
};

// Create notification object
const createNotification = (type, title, message, options = {}) => {
  return {
    id: Date.now() + Math.random(), // Simple ID generation
    type: type,
    title: title,
    message: message,
    ticketId: options.ticketId,
    ticketCode: options.ticketCode,
    userId: options.userId,
    targetUserId: options.targetUserId,
    timestamp: new Date().toISOString(),
    seen: false,
    data: options.data || {},
  };
};

// Comprehensive notification types for all CRUD operations
const NOTIFICATION_TYPES = {
  // Ticket operations
  TICKET_CREATED: "ticket_created",
  TICKET_UPDATED: "ticket_updated",
  TICKET_CLOSED: "ticket_closed",
  TICKET_REOPENED: "ticket_reopened",
  TICKET_ASSIGNED: "ticket_assigned",

  // Message/Conversation operations
  MESSAGE_RECEIVED: "message_received",
  MESSAGE_REPLY: "message_reply",
  CONVERSATION_UPDATE: "conversation_update",

  // User operations
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  USER_ROLE_CHANGED: "user_role_changed",
  USER_STATUS_CHANGED: "user_status_changed",

  // Service Center operations
  SERVICE_CENTER_CREATED: "service_center_created",
  SERVICE_CENTER_UPDATED: "service_center_updated",
  SERVICE_CENTER_DELETED: "service_center_deleted",

  // Product operations
  PRODUCT_CREATED: "product_created",
  PRODUCT_UPDATED: "product_updated",
  PRODUCT_DELETED: "product_deleted",
  PRODUCT_STOCK_LOW: "product_stock_low",

  // Spare Request operations
  SPARE_REQUEST_CREATED: "spare_request_created",
  SPARE_REQUEST_UPDATED: "spare_request_updated",
  SPARE_REQUEST_APPROVED: "spare_request_approved",
  SPARE_REQUEST_REJECTED: "spare_request_rejected",
  SPARE_REQUEST_FULFILLED: "spare_request_fulfilled",

  // Inventory operations
  INVENTORY_UPDATED: "inventory_updated",
  INVENTORY_LOW_STOCK: "inventory_low_stock",
  INVENTORY_RESTOCK: "inventory_restock",

  // Milestone operations
  MILESTONE_CREATED: "milestone_created",
  MILESTONE_UPDATED: "milestone_updated",
  MILESTONE_STAGE_CHANGED: "milestone_stage_changed",
  MILESTONE_COMPLETED: "milestone_completed",

  // System operations
  SYSTEM_ALERT: "system_alert",
  SYSTEM_MAINTENANCE: "system_maintenance",
  REMINDER: "reminder",
  USER_MENTIONED: "user_mentioned",
  FILE_UPLOADED: "file_uploaded",
};

// Helper functions for creating specific notification types
const createTicketNotification = (
  action,
  ticket,
  userId,
  additionalData = {}
) => {
  const actions = {
    created: `New ticket ${ticket.ticketCode} has been created for ${
      ticket.customerName || "customer"
    }. Priority: ${ticket.priority || "Normal"}`,
    updated: `Ticket ${ticket.ticketCode} has been updated`,
    closed: `Ticket ${ticket.ticketCode} has been closed`,
    reopened: `Ticket ${ticket.ticketCode} has been reopened`,
    assigned: `Ticket ${ticket.ticketCode} has been assigned to you`,
  };

  const titles = {
    created: "🎫 New Ticket Created",
    updated: "📝 Ticket Updated",
    closed: "✅ Ticket Closed",
    reopened: "🔄 Ticket Reopened",
    assigned: "📋 Ticket Assigned",
  };

  return createNotification(
    NOTIFICATION_TYPES[`TICKET_${action.toUpperCase()}`] ||
      NOTIFICATION_TYPES.TICKET_UPDATED,
    titles[action] ||
      `Ticket ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] || `Ticket ${ticket.ticketCode} has been ${action}`,
    {
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      userId: userId,
      entityId: ticket.id,
      entityType: "ticket",
      action: action,
      priority: ticket.priority,
      customerName: ticket.customerName,
      ...additionalData,
    }
  );
};

const createUserNotification = (action, user, userId, additionalData = {}) => {
  const actions = {
    registered: `New user ${user.name} has registered with phone ${user.phone}`,
    created: `New user ${user.name} has been added to the system`,
    updated: `User ${user.name} profile has been updated`,
    deleted: `User ${user.name} has been removed from the system`,
    role_changed: `User ${user.name} role has been changed`,
    status_changed: `User ${user.name} status has been updated`,
  };

  return createNotification(
    NOTIFICATION_TYPES[`USER_${action.toUpperCase()}`] ||
      NOTIFICATION_TYPES.USER_UPDATED,
    `User ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] || `User ${user.name} has been ${action}`,
    {
      userId: userId,
      entityId: user.id,
      entityType: "user",
      action: action,
      targetUser: user,
      ...additionalData,
    }
  );
};

const createServiceCenterNotification = (
  action,
  serviceCenter,
  userId,
  additionalData = {}
) => {
  const actions = {
    created: `New service center ${serviceCenter.name} has been added`,
    updated: `Service center ${serviceCenter.name} has been updated`,
    deleted: `Service center ${serviceCenter.name} has been removed`,
  };

  return createNotification(
    NOTIFICATION_TYPES[`SERVICE_CENTER_${action.toUpperCase()}`] ||
      NOTIFICATION_TYPES.SERVICE_CENTER_UPDATED,
    `Service Center ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] ||
      `Service center ${serviceCenter.name} has been ${action}`,
    {
      userId: userId,
      entityId: serviceCenter.id,
      entityType: "service_center",
      action: action,
      ...additionalData,
    }
  );
};

const createProductNotification = (
  action,
  product,
  userId,
  additionalData = {}
) => {
  const actions = {
    created: `New product ${product.name} has been added`,
    updated: `Product ${product.name} has been updated`,
    deleted: `Product ${product.name} has been removed`,
    stock_low: `Product ${product.name} is running low on stock`,
  };

  return createNotification(
    NOTIFICATION_TYPES[`PRODUCT_${action.toUpperCase()}`] ||
      NOTIFICATION_TYPES.PRODUCT_UPDATED,
    `Product ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] || `Product ${product.name} has been ${action}`,
    {
      userId: userId,
      entityId: product.id,
      entityType: "product",
      action: action,
      ...additionalData,
    }
  );
};

const createSpareRequestNotification = (
  action,
  spareRequest,
  userId,
  additionalData = {}
) => {
  const actions = {
    created: `New spare request #${spareRequest.id} has been submitted`,
    updated: `Spare request #${spareRequest.id} has been updated`,
    approved: `Spare request #${spareRequest.id} has been approved`,
    rejected: `Spare request #${spareRequest.id} has been rejected`,
    fulfilled: `Spare request #${spareRequest.id} has been fulfilled`,
  };

  return createNotification(
    NOTIFICATION_TYPES[`SPARE_REQUEST_${action.toUpperCase()}`] ||
      NOTIFICATION_TYPES.SPARE_REQUEST_UPDATED,
    `Spare Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] || `Spare request #${spareRequest.id} has been ${action}`,
    {
      userId: userId,
      entityId: spareRequest.id,
      entityType: "spare_request",
      action: action,
      ...additionalData,
    }
  );
};

const createInventoryNotification = (
  action,
  inventory,
  userId,
  additionalData = {}
) => {
  const actions = {
    updated: `Inventory for ${
      inventory.productName || inventory.name
    } has been updated`,
    low_stock: `Low stock alert: ${
      inventory.productName || inventory.name
    } is running low`,
    restock: `${inventory.productName || inventory.name} has been restocked`,
  };

  return createNotification(
    NOTIFICATION_TYPES[`INVENTORY_${action.toUpperCase()}`] ||
      NOTIFICATION_TYPES.INVENTORY_UPDATED,
    `Inventory ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] || `Inventory has been ${action}`,
    {
      userId: userId,
      entityId: inventory.id,
      entityType: "inventory",
      action: action,
      ...additionalData,
    }
  );
};

const createMilestoneNotification = (
  action,
  milestone,
  ticket,
  userId,
  additionalData = {}
) => {
  const actions = {
    stage_changed: `Ticket ${ticket.ticketCode} milestone updated to "${
      milestone.config?.label || milestone.stage
    }". ${
      additionalData.previousStage
        ? `Previous: "${
            additionalData.previousStageLabel || additionalData.previousStage
          }"`
        : ""
    }`,
    created: `New milestone "${
      milestone.config?.label || milestone.stage
    }" created for ticket ${ticket.ticketCode}`,
    updated: `Milestone "${
      milestone.config?.label || milestone.stage
    }" updated for ticket ${ticket.ticketCode}`,
    completed: `Milestone "${
      milestone.config?.label || milestone.stage
    }" completed for ticket ${ticket.ticketCode}${
      milestone.config?.isFinal ? " - Ticket Closed" : ""
    }`,
  };

  const titles = {
    stage_changed: " Milestone Stage Updated",
    created: "New Milestone Created",
    updated: "Milestone Updated",
    completed: milestone.config?.isFinal
      ? "✅ Ticket Completed"
      : "✅ Milestone Completed",
  };

  return createNotification(
    NOTIFICATION_TYPES[`MILESTONE_${action.toUpperCase()}`] ||
      NOTIFICATION_TYPES.MILESTONE_UPDATED,
    titles[action] ||
      `Milestone ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] ||
      `Milestone ${
        milestone.config?.label || milestone.stage
      } has been ${action}`,
    {
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      userId: userId,
      entityId: milestone.id,
      entityType: "milestone",
      action: action,
      milestoneStage: milestone.stage,
      milestoneLabel: milestone.config?.label,
      isTicketClosed: milestone.config?.isFinal,
      priority: ticket.priority,
      customerName: ticket.customerName,
      ...additionalData,
    }
  );
};

// Enhanced broadcast function that saves to database and emits via socket
const saveAndBroadcastNotification = async (
  prisma,
  io,
  notificationData,
  targetUserIds = null
) => {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        type: notificationData.type,
        title: notificationData.title,
        description: notificationData.message, // Use description field as per schema
        ticketId: notificationData.ticketId || null,
        messageId: notificationData.messageId || null,
        createdById: notificationData.userId,
      },
    });

    // If specific target users are provided, create recipients for them
    // Otherwise, create recipients for all users except the creator
    let recipients = [];

    if (targetUserIds && Array.isArray(targetUserIds)) {
      for (const userId of targetUserIds) {
        try {
          const recipient = await prisma.notificationRecipient.create({
            data: {
              notificationId: notification.id,
              userId: userId,
              seen: false,
            },
          });
          recipients.push(recipient);
        } catch (error) {
          // If it's a unique constraint error, find the existing recipient
          if (error.code === 'P2002') {
            const existingRecipient = await prisma.notificationRecipient.findUnique({
              where: {
                notificationId_userId: {
                  notificationId: notification.id,
                  userId: userId,
                },
              },
            });
            if (existingRecipient) {
              recipients.push(existingRecipient);
            }
          } else {
            throw error;
          }
        }
      }
    } else {
      // Get all users except the creator
      const users = await prisma.user.findMany({
        where: {
          id: { not: notificationData.userId },
        },
        select: { id: true },
      });

      recipients = await Promise.all(
        users.map(async (user) => {
          return await prisma.notificationRecipient.create({
            data: {
              userId: user.id,
              notificationId: notification.id,
            },
            include: {
              user: { select: { id: true, name: true, role: true } },
              notification: {
                include: {
                  createdBy: true,
                  ticket: true,
                  message: true,
                },
              },
            },
          });
        })
      );
    }

    // Smart socket broadcasting based on notification context
    if (io && recipients.length > 0) {
      // Determine smart broadcasting strategy based on notification type and data
      const smartBroadcastOptions = getSmartBroadcastOptions(notificationData, targetUserIds);
      
      if (smartBroadcastOptions.individual) {
        // Send individual notifications to each recipient
        recipients.forEach(recipient => {
          const recipientNotification = {
            ...notification,
            recipientId: recipient.userId,
            seen: recipient.seen
          };
          broadcastNotification(io, recipientNotification, {
            targetUserId: recipient.userId
          });
        });
      } else if (smartBroadcastOptions.room) {
        // Send to specific room
        broadcastNotification(io, notification, smartBroadcastOptions.room);
      } else {
        // Fallback to broadcasting to all recipients
        const enrichedNotification = {
          ...notification,
          recipients: recipients.map(r => ({ userId: r.userId, seen: r.seen }))
        };
        io.emit("notification", enrichedNotification);
      }
      
      console.log(`📢 Notification "${notification.title}" sent to ${recipients.length} recipients`);
    }

    return { notification, recipients };
  } catch (error) {
    throw error;
  }
};

// Helper function to determine optimal broadcasting strategy
const getSmartBroadcastOptions = (notificationData, targetUserIds) => {
  // For ticket-related notifications
  if (notificationData.ticketId) {
    // If specific users are targeted, send individual notifications
    if (targetUserIds && targetUserIds.length > 0) {
      return { individual: true };
    }
    
    // For ticket creation, target relevant roles
    if (notificationData.type === 'ticket_created') {
      return {
        room: {
          broadcastType: 'role',
          targetRole: 'MACSOFT_SUPPORT' // or determine based on ticket priority
        }
      };
    }
    
    // For milestone updates, target ticket stakeholders
    if (notificationData.type?.includes('milestone')) {
      return { individual: true };
    }
  }
  
  // For user registration, target admin roles
  if (notificationData.type === 'user_registered') {
    return {
      room: {
        broadcastType: 'role',
        targetRole: 'MACSOFT_ADMIN'
      }
    };
  }
  
  // Default to individual notifications
  return { individual: true };
};

module.exports = {
  broadcastNotification,
  createNotification,
  createTicketNotification,
  createUserNotification,
  createServiceCenterNotification,
  createProductNotification,
  createSpareRequestNotification,
  createInventoryNotification,
  createMilestoneNotification,
  saveAndBroadcastNotification,
  NOTIFICATION_TYPES,
};
