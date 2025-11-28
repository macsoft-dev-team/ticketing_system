const express = require("express");
const router = express.Router(); 
const tickets = require("../controller/tickets");
const authenticate = require("../middleware/authenticate");
const { 
  handleTicketFileUpload, 
  handleTicketUpdateFileUpload 
} = require("../middleware/ticketFileUpload");

// Ticket routes
router.get("/check-controller/:controllerNo", authenticate, tickets.checkActiveTicketForController);
router.get("/search/controller/:controllerNo", authenticate, tickets.searchByControllerNumber);
router.get("/", authenticate, tickets.getTickets);
router.get("/:id", authenticate, tickets.getTicketById);
router.post("/", authenticate, handleTicketFileUpload, tickets.createTicket);
router.put("/:id", authenticate, handleTicketUpdateFileUpload, tickets.updateTicket);
router.put("/status/:id", authenticate, tickets.updateStatus);
router.delete("/:id", authenticate, tickets.deleteTicket);

module.exports = router;