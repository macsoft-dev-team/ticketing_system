const multer = require("multer");
const fs = require("fs");
const path = require("path");

/**
 * Create ticket-specific multer storage for file uploads
 * @param {string} ticketCode - The ticket code to create folder for
 * @param {string} subfolder - Optional subfolder (e.g., 'conversations')
 * @returns {multer.StorageEngine} - Configured multer storage
 */
function createTicketStorage(ticketCode, subfolder = '') {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const baseDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
      let uploadPath = path.join(baseDir, ticketCode);
      
      if (subfolder) {
        uploadPath = path.join(uploadPath, subfolder);
      }
      
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
}

/**
 * Create multer upload middleware for ticket-specific uploads
 * @param {string} ticketCode - The ticket code
 * @param {string} subfolder - Optional subfolder
 * @param {number} maxFiles - Maximum number of files allowed
 * @returns {multer.Multer} - Configured multer middleware
 */
function createTicketUpload(ticketCode, subfolder = '', maxFiles = 12) {
  const storage = createTicketStorage(ticketCode, subfolder);
  
  return multer({
    storage: storage,
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
}

/**
 * Generate file URL path for ticket-specific files
 * @param {string} ticketCode - The ticket code
 * @param {string} filename - The filename
 * @param {string} subfolder - Optional subfolder
 * @returns {string} - URL path for the file
 */
function generateTicketFileUrl(ticketCode, filename, subfolder = '') {
  let urlPath = `/uploads/${ticketCode}`;
  if (subfolder) {
    urlPath += `/${subfolder}`;
  }
  return `${urlPath}/${filename}`;
}

/**
 * Ensure ticket directory exists
 * @param {string} ticketCode - The ticket code
 * @param {string} subfolder - Optional subfolder
 */
function ensureTicketDirectory(ticketCode, subfolder = '') {
  const baseDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  let uploadPath = path.join(baseDir, ticketCode);
  
  if (subfolder) {
    uploadPath = path.join(uploadPath, subfolder);
  }
  
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  return uploadPath;
}

/**
 * Move files from temporary folder to actual ticket folder
 * @param {string} tempTicketCode - The temporary ticket code
 * @param {string} actualTicketCode - The actual ticket code
 * @param {Array} files - Array of file objects from multer
 * @returns {Array} - Updated file objects with new paths
 */
function moveFilesToTicketFolder(tempTicketCode, actualTicketCode, files = []) {
  if (!files || files.length === 0) {
    return [];
  }

  const baseDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  const tempDir = path.join(baseDir, tempTicketCode);
  const actualDir = path.join(baseDir, actualTicketCode);

  // Ensure actual ticket directory exists
  ensureTicketDirectory(actualTicketCode);

  const updatedFiles = [];

  for (const file of files) {
    try {
      const oldPath = file.path;
      const newPath = path.join(actualDir, file.filename);
      
      // Move file from temp to actual directory
      fs.renameSync(oldPath, newPath);
      
      // Update file object with new path
      const updatedFile = {
        ...file,
        path: newPath,
        destination: actualDir
      };
      
      updatedFiles.push(updatedFile);
    } catch (error) {
      // Keep original file info if move fails
      updatedFiles.push(file);
    }
  }

  // Clean up temporary directory if empty
  try {
    if (fs.existsSync(tempDir)) {
      const remainingFiles = fs.readdirSync(tempDir);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(tempDir);
      }
    }
  } catch (error) {
    console.error('Error cleaning up temp directory:', error);
  }

  return updatedFiles;
}

module.exports = {
  createTicketStorage,
  createTicketUpload,
  generateTicketFileUrl,
  ensureTicketDirectory
};