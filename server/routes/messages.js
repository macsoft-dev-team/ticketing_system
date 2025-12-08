const express = require("express");
const router = express.Router();
const messagesController = require("../controller/messages");

// Get tickets with unreplied messages (legacy endpoint)
router.get("/unreplied-tickets", messagesController.getUnrepliedTickets);

// Get unreplied messages with audience filter (new endpoint)
router.get("/unreplied", messagesController.getUnrepliedMessages);

// Get unread message count for a specific ticket
router.get("/unread/:ticketId", messagesController.getUnreadCount);

// Get bulk unread counts for multiple tickets
router.post("/bulk-unread", messagesController.getBulkUnreadCounts);

module.exports = router;