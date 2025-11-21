const express = require('express');
const router = express.Router();
const milestones = require('../controller/milestones');
const authenticate = require('../middleware/authenticate');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Simple multer storage for receive controller endpoint (temp directory)
const receiveControllerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const baseDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    const uploadPath = path.join(baseDir, 'temp');
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const receiveControllerUpload = multer({
  storage: receiveControllerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
  fileFilter: function (req, file, cb) {
    // Accept images, videos, and audio
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm|mp3|wav|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/') || 
                     file.mimetype.startsWith('video/') || 
                     file.mimetype.startsWith('audio/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and audio files are allowed.'));
    }
  }
});

// Receive controller at service center route - MUST be before parameterized routes
router.post('/receive-controller', 
  authenticate, 
  receiveControllerUpload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'videos', maxCount: 5 },
    { name: 'audio', maxCount: 1 }
  ]), 
  milestones.receiveControllerAtServiceCenter
);

// Routes
router.get('/:ticketId', authenticate, milestones.getTicketMilestones);
router.post("/:ticketId", authenticate, milestones.createMilestone);
router.get('/ticket/:ticketId', authenticate, milestones.getTicketMilestones);
router.get('/ticket/:ticketId', authenticate, milestones.getTicketMilestones);
router.get('/ticket/:ticketId/current', authenticate, milestones.getCurrentMilestone);
router.get('/ticket/:ticketId/available-transitions', authenticate, milestones.getAvailableTransitions);
router.post('/ticket/:ticketId/transition', authenticate, milestones.handleMilestoneFileUpload, milestones.transitionMilestone);
router.post('/ticket/:ticketId/add-photos', authenticate, milestones.handleMilestoneFileUpload, milestones.addPhotosToCurrentMilestone);

router.put('/:milestoneId/notes', authenticate, milestones.updateMilestoneNotes);
router.put('/:milestoneId', authenticate, milestones.updateMilestone);

module.exports = router;
