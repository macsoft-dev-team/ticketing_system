const authorizeNotification = (action) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      // Define permissions based on user roles
      const rolePermissions = {
        MACSOFT_ADMIN: {
          view: true,
          update: true,
          delete: true,
          bulkAction: true,
          viewAll: true // Can view notifications for all users
        },
        MACSOFT_HEAD: {
          view: true,
          update: true,
          delete: true,
          bulkAction: true,
          viewAll: false // Can only view own notifications
        },
        MACSOFT_SUPPORT: {
          view: true,
          update: true,
          delete: true,
          bulkAction: true,
          viewAll: false
        },
        CUSTOMER_SERVICE_HEAD: {
          view: true,
          update: true,
          delete: true,
          bulkAction: true,
          viewAll: false
        },
        SERVICE_CENTER_TECHNICIAN: {
          view: true,
          update: true,
          delete: false, // Cannot delete notifications
          bulkAction: false,
          viewAll: false
        },
        CUSTOMER_FIELD_ENGINEER: {
          view: true,
          update: true,
          delete: false,
          bulkAction: false,
          viewAll: false
        }
      };

      const userPermissions = rolePermissions[user.role];
      
      if (!userPermissions) {
        return res.status(403).json({
          success: false,
          message: "Invalid user role"
        });
      }

      // Check specific action permission
      const hasPermission = userPermissions[action];
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied: You don't have permission to ${action} notifications`
        });
      }

      // Add permissions to request for use in controllers
      req.userPermissions = userPermissions;
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: "Authorization check failed"
      });
    }
  };
};

const canViewAllNotifications = (req, res, next) => {
  const userPermissions = req.userPermissions;
  
  if (!userPermissions || !userPermissions.viewAll) {
    // User can only view their own notifications
    req.restrictToOwnNotifications = true;
  }
  
  next();
};

const validateNotificationOwnership = async (req, res, next) => {
  try {
    const { prisma } = require("../lib/clients");
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    // Skip ownership check for admins who can view all notifications
    if (req.userPermissions && req.userPermissions.viewAll) {
      return next();
    }

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required"
      });
    }

    // Check if notification belongs to user
    const notificationRecipient = await prisma.notificationRecipient.findFirst({
      where: {
        id: parseInt(notificationId),
        userId: userId
      }
    });

    if (!notificationRecipient) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or access denied"
      });
    }

    next();
  } catch (error) {
    console.error('Ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to validate notification ownership"
    });
  }
};

const validateBulkNotificationOwnership = async (req, res, next) => {
  try {
    const { prisma } = require("../lib/clients");
    const userId = req.user.id;
    const { notificationIds } = req.body;
    
    // Skip ownership check for admins who can view all notifications
    if (req.userPermissions && req.userPermissions.viewAll) {
      return next();
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: "Valid notification IDs array is required"
      });
    }

    // Check if all notifications belong to user
    const notificationRecipients = await prisma.notificationRecipient.findMany({
      where: {
        id: { in: notificationIds.map(id => parseInt(id)) },
        userId: userId
      }
    });

    if (notificationRecipients.length !== notificationIds.length) {
      return res.status(403).json({
        success: false,
        message: "Some notifications don't belong to you or don't exist"
      });
    }

    next();
  } catch (error) {
    console.error('Bulk ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to validate notification ownership"
    });
  }
};

// Rate limiting for notification actions
const notificationRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }
    
    const userRequests = requests.get(userId);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many notification requests. Please try again later."
      });
    }
    
    userRequests.push(now);
    next();
  };
};

module.exports = {
  authorizeNotification,
  canViewAllNotifications,
  validateNotificationOwnership,
  validateBulkNotificationOwnership,
  notificationRateLimit
};