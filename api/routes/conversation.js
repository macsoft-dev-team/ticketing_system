const express = require("express");
const router = express.Router();
const conversationController = require("../controller/conversation");
const authenticate = require("../middleware/authenticate");

router.get("/:ticketId", authenticate, conversationController.getConversations);
router.post(
  "/:ticketId",
  authenticate,
  conversationController.createConversation
);
router.put("/:ticketId", authenticate, conversationController.updateSeen);

module.exports = router;
