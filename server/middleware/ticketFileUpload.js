const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for ticket-specific file uploads
const createTicketStorage = (ticketCode) => multer.diskStorage({
  destination: function (req, file, cb) {
    const baseDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    const uploadPath = path.join(baseDir, ticketCode);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const createTicketUpload = (ticketCode) => multer({ 
  storage: createTicketStorage(ticketCode),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
  fileFilter: function (req, file, cb) {
    // Accept images, PDFs, and document files
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, DOC, DOCX, TXT, and Excel files are allowed.'));
    }
  }
});

// Custom middleware to handle ticket-specific file uploads for new tickets
const handleTicketFileUpload = (req, res, next) => {
  // For new tickets, we'll use a temporary approach since we don't have the ticket code yet
  // We'll create a temp folder and move files later, or handle files after ticket creation
  
  // Check if there are files to upload
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
    // No files, just proceed
    return next();
  }
  
  try {
    // Create a basic multer upload without ticket-specific folder
    const upload = multer({
      storage: multer.diskStorage({
        destination: function (req, file, cb) {
          const baseDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
          const tempDir = path.join(baseDir, 'temp');
          
          // Create temp directory if it doesn't exist
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          
          cb(null, tempDir);
        },
        filename: function (req, file, cb) {
          // Generate unique filename with timestamp
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
      fileFilter: function (req, file, cb) {
        // Accept images, PDFs, and document files
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xlsx|xls/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only images, PDF, DOC, DOCX, TXT, and Excel files are allowed.'));
        }
      }
    });
    
    upload.array('attachments', 12)(req, res, next);
  } catch (error) {
    console.error("Error in ticket file upload middleware:", error);
    res.status(500).json({ message: "Failed to handle file upload" });
  }
};

// Custom middleware to handle ticket update file uploads
const handleTicketUpdateFileUpload = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id);
    
    // Get existing ticket to retrieve ticketCode
    const { prisma } = require("../lib/clients");
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { ticketCode: true }
    });
    
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    
    // Create dynamic upload middleware for this ticket
    const upload = createTicketUpload(ticket.ticketCode);
    upload.single('picture')(req, res, next);
  } catch (error) {
    console.error("Error in ticket update file upload middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  handleTicketFileUpload,
  handleTicketUpdateFileUpload,
  createTicketUpload,
  createTicketStorage
};