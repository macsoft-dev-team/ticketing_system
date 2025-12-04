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

const createConversationUpload = (ticketCode) => {
  const isMediaUploadEnabled = process.env.ENABLE_MEDIA_UPLOAD === 'true';
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;

  return multer({ 
    storage: createConversationStorage(ticketCode),
    limits: {
      fileSize: maxFileSize,
    },
    fileFilter: function (req, file, cb) {
      // Base file types (always allowed)
      const baseTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xlsx|xls/;
      const baseExtname = baseTypes.test(file.originalname.toLowerCase());
      
      // Media file types (only allowed if media upload is enabled)
      const mediaTypes = /mp4|mov|avi|webm|ogg|mp3|wav|m4a/;
      const mediaExtname = mediaTypes.test(file.originalname.toLowerCase());
      
      // Check mimetype for broader support
      const baseMimeTypes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        // Documents
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      const mediaMimeTypes = [
        // Videos
        'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime',
        // Audio
        'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/aac'
      ];
      
      const baseMimetypeAllowed = baseMimeTypes.includes(file.mimetype);
      const mediaMimetypeAllowed = mediaMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/');
      
      // Allow base files always, media files only if enabled
      const isAllowedFileType = (baseMimetypeAllowed && baseExtname) || 
                                (isMediaUploadEnabled && mediaMimetypeAllowed && mediaExtname);
      
      if (isAllowedFileType) {
        return cb(null, true);
      } else {
        const errorMsg = isMediaUploadEnabled 
          ? 'Invalid file type. Only images, documents, videos, and audio files are allowed!'
          : 'Invalid file type. Only images and documents are allowed! Video/audio upload is disabled.';
        cb(new Error(errorMsg));
      }
    }
  });
};

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
     res.status(500).json({ message: "Internal server error" });
  }
};

// Route to check media upload configuration
router.get("/config/media-upload", (req, res) => {
  res.json({
    enabled: process.env.ENABLE_MEDIA_UPLOAD === 'true',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '50'),
    maxVideoDuration: parseInt(process.env.MAX_VIDEO_DURATION_SECONDS || '300'),
    maxAudioDuration: parseInt(process.env.MAX_AUDIO_DURATION_SECONDS || '600')
  });
});

router.get("/:ticketId", conversationController.getConversations);
router.post(
  "/:ticketId",
  handleConversationFileUpload, // Use ticket-specific upload handler
  conversationController.createConversation
);
router.put("/:ticketId", conversationController.updateSeen); // Deprecated

// New MessageSeen routes
router.post("/:ticketId/mark-seen", conversationController.markMessagesAsSeen);
router.post("/message/:messageId/seen", conversationController.markMessageAsSeen);
router.get("/:ticketId/unread-count", conversationController.getUnreadCount);

module.exports = router;
