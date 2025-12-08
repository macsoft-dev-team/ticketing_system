const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notification");
const authenticate = require("../middleware/authenticate");
const {
  authorizeNotification,
  canViewAllNotifications,
  validateNotificationOwnership,
  validateBulkNotificationOwnership,
  notificationRateLimit
} = require("../middleware/notificationAuth");

// Apply rate limiting to all notification routes
router.use(notificationRateLimit(200, 15 * 60 * 1000)); // 200 requests per 15 minutes

// Get notifications (with optional filtering and pagination)
router.get("/", 
  authenticate, 
  authorizeNotification('view'),
  canViewAllNotifications,
  notificationController.getNotifications
);

// Get notification counts
router.get("/counts", 
  authenticate, 
  authorizeNotification('view'),
  notificationController.getNotificationCounts
);

// Update single notification (mark as read)
router.put("/:id", 
  authenticate, 
  authorizeNotification('update'),
  validateNotificationOwnership,
  notificationController.updateNotification
);

// Delete single notification
router.delete("/:id", 
  authenticate, 
  authorizeNotification('delete'),
  validateNotificationOwnership,
  notificationController.deleteNotification
);

// Bulk update notifications
router.patch("/bulk/update", 
  authenticate, 
  authorizeNotification('bulkAction'),
  validateBulkNotificationOwnership,
  notificationController.bulkUpdateNotifications
);

// Bulk delete notifications  
router.delete("/bulk/delete", 
  authenticate, 
  authorizeNotification('bulkAction'),
  authorizeNotification('delete'),
  validateBulkNotificationOwnership,
  notificationController.bulkDeleteNotifications
);

// Mark notification as read (alternative endpoint)
router.patch("/:id/read", 
  authenticate, 
  authorizeNotification('update'),
  validateNotificationOwnership,
  notificationController.markNotificationAsRead
);

// Mark ticket notifications as seen
router.patch("/ticket/:ticketId/mark-seen", 
  authenticate, 
  authorizeNotification('update'),
  notificationController.markTicketNotificationsAsSeen
);

module.exports = router;