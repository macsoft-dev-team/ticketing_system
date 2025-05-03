const express = require("express");
const router = express.Router(); 
const tickets = require("../controller/tickets");
const multer = require("multer");
const getMulterStorage = require("../lib/file_handler");
const upload = multer({ storage: getMulterStorage("./uploads") });


router.get("/",  tickets.getTickets);
router.post("/", upload.single("picture"), tickets.createTicket);
module.exports = router;