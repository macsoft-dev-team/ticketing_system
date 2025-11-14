// Notification broadcasting utility
const broadcastNotification = (io, notificationData) => {
  console.log('📢 Broadcasting notification:', notificationData);
  
  // If targetUserId is specified, send to specific user's notification room
  if (notificationData.targetUserId) {
    const userRoom = `notifications-${notificationData.targetUserId}`;
    io.to(userRoom).emit('notification', notificationData);
    console.log(`📤 Notification sent to user room: ${userRoom}`);
  } else {
    // Broadcast to all connected clients
    io.emit('notification', notificationData);
    console.log('📤 Notification broadcasted to all clients');
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
  TICKET_CREATED: 'ticket_created',
  TICKET_UPDATED: 'ticket_updated', 
  TICKET_CLOSED: 'ticket_closed',
  TICKET_REOPENED: 'ticket_reopened',
  TICKET_ASSIGNED: 'ticket_assigned',
  
  // Message/Conversation operations
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_REPLY: 'message_reply',
  CONVERSATION_UPDATE: 'conversation_update',
  
  // User operations
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_STATUS_CHANGED: 'user_status_changed',
  
  // Service Center operations
  SERVICE_CENTER_CREATED: 'service_center_created',
  SERVICE_CENTER_UPDATED: 'service_center_updated',
  SERVICE_CENTER_DELETED: 'service_center_deleted',
  
  // Product operations
  PRODUCT_CREATED: 'product_created',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  PRODUCT_STOCK_LOW: 'product_stock_low',
  
  // Spare Request operations
  SPARE_REQUEST_CREATED: 'spare_request_created',
  SPARE_REQUEST_UPDATED: 'spare_request_updated',
  SPARE_REQUEST_APPROVED: 'spare_request_approved',
  SPARE_REQUEST_REJECTED: 'spare_request_rejected',
  SPARE_REQUEST_FULFILLED: 'spare_request_fulfilled',
  
  // Inventory operations
  INVENTORY_UPDATED: 'inventory_updated',
  INVENTORY_LOW_STOCK: 'inventory_low_stock',
  INVENTORY_RESTOCK: 'inventory_restock',
  
  // System operations
  SYSTEM_ALERT: 'system_alert',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  REMINDER: 'reminder',
  USER_MENTIONED: 'user_mentioned',
  FILE_UPLOADED: 'file_uploaded',
};

// Helper functions for creating specific notification types
const createTicketNotification = (action, ticket, userId, additionalData = {}) => {
  const actions = {
    'created': `New ticket ${ticket.ticketCode} has been created for ${ticket.customerName || 'customer'}. Priority: ${ticket.priority || 'Normal'}`,
    'updated': `Ticket ${ticket.ticketCode} has been updated`,
    'closed': `Ticket ${ticket.ticketCode} has been closed`,
    'reopened': `Ticket ${ticket.ticketCode} has been reopened`,
    'assigned': `Ticket ${ticket.ticketCode} has been assigned to you`,
  };

  const titles = {
    'created': '🎫 New Ticket Created',
    'updated': '📝 Ticket Updated',
    'closed': '✅ Ticket Closed',
    'reopened': '🔄 Ticket Reopened',
    'assigned': '📋 Ticket Assigned',
  };

  return createNotification(
    NOTIFICATION_TYPES[`TICKET_${action.toUpperCase()}`] || NOTIFICATION_TYPES.TICKET_UPDATED,
    titles[action] || `Ticket ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] || `Ticket ${ticket.ticketCode} has been ${action}`,
    {
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      userId: userId,
      entityId: ticket.id,
      entityType: 'ticket',
      action: action,
      priority: ticket.priority,
      customerName: ticket.customerName,
      ...additionalData
    }
  );
};

const createUserNotification = (action, user, userId, additionalData = {}) => {
  const actions = {
    'created': `New user ${user.name} has been added to the system`,
    'updated': `User ${user.name} profile has been updated`,
    'deleted': `User ${user.name} has been removed from the system`,
    'role_changed': `User ${user.name} role has been changed`,
    'status_changed': `User ${user.name} status has been updated`,
  };

  return createNotification(
    NOTIFICATION_TYPES[`USER_${action.toUpperCase()}`] || NOTIFICATION_TYPES.USER_UPDATED,
    `User ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] || `User ${user.name} has been ${action}`,
    {
      userId: userId,
      entityId: user.id,
      entityType: 'user',
      action: action,
      targetUser: user,
      ...additionalData
    }
  );
};

const createServiceCenterNotification = (action, serviceCenter, userId, additionalData = {}) => {
  const actions = {
    'created': `New service center ${serviceCenter.name} has been added`,
    'updated': `Service center ${serviceCenter.name} has been updated`,
    'deleted': `Service center ${serviceCenter.name} has been removed`,
  };

  return createNotification(
    NOTIFICATION_TYPES[`SERVICE_CENTER_${action.toUpperCase()}`] || NOTIFICATION_TYPES.SERVICE_CENTER_UPDATED,
    `Service Center ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] || `Service center ${serviceCenter.name} has been ${action}`,
    {
      userId: userId,
      entityId: serviceCenter.id,
      entityType: 'service_center',
      action: action,
      ...additionalData
    }
  );
};

const createProductNotification = (action, product, userId, additionalData = {}) => {
  const actions = {
    'created': `New product ${product.name} has been added`,
    'updated': `Product ${product.name} has been updated`,
    'deleted': `Product ${product.name} has been removed`,
    'stock_low': `Product ${product.name} is running low on stock`,
  };

  return createNotification(
    NOTIFICATION_TYPES[`PRODUCT_${action.toUpperCase()}`] || NOTIFICATION_TYPES.PRODUCT_UPDATED,
    `Product ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] || `Product ${product.name} has been ${action}`,
    {
      userId: userId,
      entityId: product.id,
      entityType: 'product',
      action: action,
      ...additionalData
    }
  );
};

const createSpareRequestNotification = (action, spareRequest, userId, additionalData = {}) => {
  const actions = {
    'created': `New spare request #${spareRequest.id} has been submitted`,
    'updated': `Spare request #${spareRequest.id} has been updated`,
    'approved': `Spare request #${spareRequest.id} has been approved`,
    'rejected': `Spare request #${spareRequest.id} has been rejected`,
    'fulfilled': `Spare request #${spareRequest.id} has been fulfilled`,
  };

  return createNotification(
    NOTIFICATION_TYPES[`SPARE_REQUEST_${action.toUpperCase()}`] || NOTIFICATION_TYPES.SPARE_REQUEST_UPDATED,
    `Spare Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] || `Spare request #${spareRequest.id} has been ${action}`,
    {
      userId: userId,
      entityId: spareRequest.id,
      entityType: 'spare_request',
      action: action,
      ...additionalData
    }
  );
};

const createInventoryNotification = (action, inventory, userId, additionalData = {}) => {
  const actions = {
    'updated': `Inventory for ${inventory.productName || inventory.name} has been updated`,
    'low_stock': `Low stock alert: ${inventory.productName || inventory.name} is running low`,
    'restock': `${inventory.productName || inventory.name} has been restocked`,
  };

  return createNotification(
    NOTIFICATION_TYPES[`INVENTORY_${action.toUpperCase()}`] || NOTIFICATION_TYPES.INVENTORY_UPDATED,
    `Inventory ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    actions[action] || `Inventory has been ${action}`,
    {
      userId: userId,
      entityId: inventory.id,
      entityType: 'inventory',
      action: action,
      ...additionalData
    }
  );
};

// Enhanced broadcast function that saves to database and emits via socket
const saveAndBroadcastNotification = async (prisma, io, notificationData, targetUserIds = null) => {
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
    let recipients;
    
    if (targetUserIds && Array.isArray(targetUserIds)) {
      recipients = await Promise.all(
        targetUserIds.map(async (userId) => {
          return await prisma.notificationRecipient.create({
            data: {
              userId: userId,
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

    // Broadcast via socket
    if (io && recipients.length > 0) {
      io.emit('notification', recipients);
      console.log(`📢 Broadcasted ${notificationData.type} notification to ${recipients.length} users`);
    }

    return { notification, recipients };
  } catch (error) {
    console.error('Error saving and broadcasting notification:', error);
    throw error;
  }
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
  saveAndBroadcastNotification,
  NOTIFICATION_TYPES,
};