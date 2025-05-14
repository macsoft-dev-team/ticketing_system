const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notification");
const authenticate = require("../middleware/authenticate");

router.get("/", authenticate, notificationController.getNotifications);
router.put("/:id", authenticate, notificationController.updateNotification);

module.exports = router;