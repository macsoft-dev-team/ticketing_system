const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notification");
const authenticate = require("../middleware/authenticate");

router.get("/", authenticate, notificationController.getNotifications);
router.get("/counts", authenticate, notificationController.getNotificationCounts);
router.put("/:id", authenticate, notificationController.updateNotification);
router.patch("/:id/read", authenticate, notificationController.markNotificationAsRead);

module.exports = router;