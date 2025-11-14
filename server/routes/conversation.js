const express = require("express");
const router = express.Router();
const multer = require("multer");
const conversationController = require("../controller/conversation");
const { prisma } = require("../lib/clients");
const fs = require("fs");
const path = require("path");
const { generateTicketFileUrl } = require("../lib/ticket_file_handler");

// Create ticket-specific conversation upload storage
const createConversationStorage = (ticketCode) => multer.diskStorage({
  destination: function (req, file, cb) {
    const baseDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    const uploadPath = path.join(baseDir, ticketCode, 'conversations');
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const createConversationUpload = (ticketCode) => multer({ 
  storage: createConversationStorage(ticketCode),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: function (req, file, cb) {
    // Allow images, PDFs, and common document types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xlsx|xls/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed!'));
    }
  }
});

// Middleware to handle conversation file uploads with ticket context
const handleConversationFileUpload = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    
    // Get ticket to retrieve ticketCode
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { ticketCode: true }
    });
    
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    
    // Create dynamic upload middleware for this ticket's conversations
    const upload = createConversationUpload(ticket.ticketCode);
    upload.array('attachments', 5)(req, res, next);
  } catch (error) {
    console.error("Error in conversation file upload middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

router.get("/:ticketId", conversationController.getConversations);
router.post(
  "/:ticketId",
  handleConversationFileUpload, // Use ticket-specific upload handler
  conversationController.createConversation
);
router.put("/:ticketId", conversationController.updateSeen);

module.exports = router;
