const milestoneService = require("../service/milestones");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { prisma } = require("../lib/clients");

// Configure multer for milestone photo uploads
const createMilestoneStorage = (ticketCode) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      const baseDir =
        process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads");
      const uploadPath = path.join(baseDir, ticketCode, "milestones");

      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
      );
    },
  });

const createMilestoneUpload = (ticketCode) =>
  multer({
    storage: createMilestoneStorage(ticketCode),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
    },
    fileFilter: function (req, file, cb) {
      // Accept only images for milestone photos
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(
          new Error(
            "Invalid file type. Only images (JPEG, PNG, GIF) are allowed."
          )
        );
      }
    },
  });

/**
 * Middleware to handle milestone file uploads
 */
const handleMilestoneFileUpload = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.ticketId);

    // Get existing ticket to retrieve ticketCode
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { ticketCode: true },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Create dynamic upload middleware for this ticket
    const upload = createMilestoneUpload(ticket.ticketCode);
    upload.array("photos", 5)(req, res, next); // Max 5 photos per milestone
  } catch (error) {
    console.error("Error in milestone file upload middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all milestones for a ticket
 */
const getTicketMilestones = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const milestones = await milestoneService.getTicketMilestones(
      parseInt(ticketId)
    );
    res.status(200).json(milestones);
  } catch (error) {
    console.error("Error fetching milestones:", error);
    res.status(500).json({
      message: "Failed to fetch milestones",
      error: error.message,
    });
  }
};

const getCurrentMilestone = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const milestone = await milestoneService.getCurrentMilestone(
      parseInt(ticketId)
    );

    if (!milestone) {
      return res.status(404).json({ message: "No active milestone found" });
    }

    res.status(200).json(milestone);
  } catch (error) {
    console.error("Error fetching current milestone:", error);
    res.status(500).json({
      message: "Failed to fetch current milestone",
      error: error.message,
    });
  }
};

const getAvailableTransitions = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { role } = req.user;

    const availableStages = await milestoneService.getAvailableTransitions(
      parseInt(ticketId),
      role
    );

    res.status(200).json(availableStages);
  } catch (error) {
    console.error("Error fetching available transitions:", error);
    res.status(500).json({
      message: "Failed to fetch available transitions",
      error: error.message,
    });
  }
};

const transitionMilestone = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { targetStage, notes, spareRequestId } = req.body;
    const { id: userId, role: userRole } = req.user;
    const io = req.io;
    const files = req.files; // Uploaded photos

    // Process uploaded files if any
    let attachments = [];
    if (files && files.length > 0) {
      attachments = files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      }));
    }

    const data = {
      notes,
      attachments,
      spareRequestId,
    };

    const updatedMilestone = await milestoneService.transitionMilestone(
      parseInt(ticketId),
      targetStage,
      userId,
      userRole,
      data,
      io
    );

    const isTicketClosed = updatedMilestone.config?.isFinal;
    const responseMessage =
      isTicketClosed && targetStage === "REQUEST_CLEARED_AT_FIELD"
        ? "Ticket closed with field clearance"
        : isTicketClosed
        ? "Milestone completed and ticket closed"
        : "Milestone transitioned successfully";

    res.status(200).json({
      message: responseMessage,
      milestone: updatedMilestone,
      isTicketClosed,
    });
  } catch (error) {
    console.error("Error transitioning milestone:", error);
    res.status(400).json({
      message: error.message,
      error: error.message,
    });
  }
};

const updateMilestoneNotes = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { notes } = req.body;
    const { id: userId } = req.user;

    const updatedMilestone = await milestoneService.updateMilestoneNotes(
      parseInt(milestoneId),
      notes,
      userId
    );

    res.status(200).json({
      message: "Milestone notes updated successfully",
      milestone: updatedMilestone,
    });
  } catch (error) {
    console.error("Error updating milestone notes:", error);
    res.status(400).json({
      message: "Failed to update milestone notes",
      error: error.message,
    });
  }
};

const addPhotosToCurrentMilestone = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { id: userId } = req.user;
    const files = req.files; // Uploaded photos

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No photos provided" });
    }

    // Process uploaded files
    const attachments = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    }));

    const updatedMilestone = await milestoneService.addPhotosToCurrentMilestone(
      parseInt(ticketId),
      userId,
      attachments
    );

    res.status(200).json({
      message: "Photos added to milestone successfully",
      milestone: updatedMilestone,
    });
  } catch (error) {
    console.error("Error adding photos to milestone:", error);
    res.status(400).json({
      message: "Failed to add photos to milestone",
      error: error.message,
    });
  }
};

const updateMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const milestoneData = req.body;
    const { id: userId } = req.user;

    const updatedMilestone = await milestoneService.updateMilestone(
      parseInt(milestoneId),
      milestoneData,
      userId
    );
    const newMilestoneData = await milestoneService.createMilestone(
      updatedMilestone.ticketId,
      userId,
      milestoneData
    );
    res.status(200).json({
      message: "Milestone updated successfully",
      milestone: newMilestoneData,
    });
  } catch (error) {
    console.error("Error updating milestone:", error);
    res.status(400).json({
      message: "Failed to update milestone",
      error: error.message,
    });
  }
};

const createMilestone = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const milestoneData = req.body;
    const { id: userId } = req.user;
    const io = req.io;

    const _milestoneData = {
      ticketId,
      stage: milestoneData.stage,
      order: milestoneData.order,
      status: milestoneData.status,
      photoRequired: milestoneData.photoRequired,
      startedAt: new Date(),
      changedBy: milestoneData.status === "IN_PROGRESS" ? userId : null,
    };

    const newMilestone = await milestoneService.createMilestone(_milestoneData, io);

    res.status(201).json({
      message: "Milestone created successfully",
      milestone: newMilestone,
    });
  } catch (error) {
    console.error("Error creating milestone:", error);
    res.status(400).json({
      message: "Failed to create milestone",
      error: error.message,
    });
  }
};

const receiveControllerAtServiceCenter = async (req, res) => {
  try {
    const { controllerNo } = req.body;
    const { id: userId, role: userRole } = req.user;
    const io = req.io;
    const files = req.files; // Uploaded photos, videos, and audio

    // Parse photoLabels array from form data (photoLabels[0], photoLabels[1], etc.)
    const photoLabels = [];
    Object.keys(req.body).forEach(key => {
      const match = key.match(/^photoLabels\[(\d+)\]$/);
      if (match) {
        const index = parseInt(match[1]);
        photoLabels[index] = req.body[key];
      }
    });
 
    if (!controllerNo) {
      return res.status(400).json({ 
        message: "Controller number is required",
        debug: { bodyKeys: Object.keys(req.body) }
      });
    }

    // Validate photo count
    if (!files || !files.photos || files.photos.length < 4) {
      return res.status(400).json({ 
        message: "At least 4 photos are required",
        received: files?.photos?.length || 0,
        required: 4
      });
    }

    // Process uploaded files if any (handle multiple file fields)
    let attachments = [];
    if (files) {
      // Handle photos with labels
      if (files.photos && files.photos.length > 0) {
        files.photos.forEach((file, index) => {
          // Get the corresponding label for this photo
          const label = photoLabels[index] || null;
          
          attachments.push({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            type: 'photo',
            label: label // Add the label to the attachment
          });
        });
      }
      
      // Handle videos
      if (files.videos && files.videos.length > 0) {
        files.videos.forEach((file) => {
          attachments.push({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            type: 'video'
          });
        });
      }
      
      // Handle audio
      if (files.audio && files.audio.length > 0) {
        attachments.push({
          filename: files.audio[0].filename,
          originalName: files.audio[0].originalname,
          mimetype: files.audio[0].mimetype,
          size: files.audio[0].size,
          path: files.audio[0].path,
          type: 'audio'
        });
      }
    }

    const result = await milestoneService.receiveControllerAtServiceCenter(
      controllerNo,
      userId,
      userRole,
      attachments,
      io
    );

    res.status(200).json({
      message: "Controller received at service center successfully",
      ticket: result.ticket,
      milestone: result.milestone,
    });
  } catch (error) {
    console.error("Error receiving controller at service center:", error);
    
    // Determine appropriate status code based on error type
    let statusCode = 400;
    if (error.message.includes('not found') || error.message.includes('No ticket found')) {
      statusCode = 404;
    } else if (error.message.includes('permission') || error.message.includes('not have permission')) {
      statusCode = 403;
    } else if (error.message.includes('not assigned to your service center')) {
      statusCode = 403;
    }
    
    res.status(statusCode).json({
      message: error.message || "Failed to receive controller",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const receiveControllerBatch = async (req, res) => {
  try {
    const { batchCount } = req.body;
    const { id: userId, role: userRole } = req.user;
    const io = req.io;
    const files = req.files;

    if (!batchCount || parseInt(batchCount) === 0) {
      return res.status(400).json({ 
        message: "Invalid batch count",
        received: batchCount
      });
    }

    const itemCount = parseInt(batchCount);
    const results = [];
    const errors = [];

    // Process each batch item
    for (let i = 0; i < itemCount; i++) {
      try {
        // Extract item data
        const itemControllerNo = req.body[`items[${i}][controllerNo]`];
        const itemTicketCode = req.body[`items[${i}][ticketCode]`];

        if (!itemControllerNo) {
          errors.push({
            index: i,
            error: "Controller number is required",
            controllerNo: itemControllerNo
          });
          continue;
        }

        // Process item files
        let itemAttachments = [];
        
        // Handle photos for this item
        if (files && files[`items[${i}][photos]`]) {
          const itemPhotos = Array.isArray(files[`items[${i}][photos]`]) 
            ? files[`items[${i}][photos]`] 
            : [files[`items[${i}][photos]`]];
            
          itemPhotos.forEach((file, photoIndex) => {
            // Get the corresponding label for this photo
            const labelKey = `items[${i}][photoLabels][${photoIndex}]`;
            const label = req.body[labelKey] || null;
            
            itemAttachments.push({
              filename: file.filename,
              originalName: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              path: file.path,
              type: 'photo',
              label: label
            });
          });
        }

        // Handle videos for this item
        if (files && files[`items[${i}][videos]`]) {
          const itemVideos = Array.isArray(files[`items[${i}][videos]`]) 
            ? files[`items[${i}][videos]`] 
            : [files[`items[${i}][videos]`]];
            
          itemVideos.forEach((file) => {
            itemAttachments.push({
              filename: file.filename,
              originalName: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              path: file.path,
              type: 'video'
            });
          });
        }

        // Handle audio for this item
        if (files && files[`items[${i}][audio]`]) {
          const audioFile = Array.isArray(files[`items[${i}][audio]`])
            ? files[`items[${i}][audio]`][0]
            : files[`items[${i}][audio]`];
            
          itemAttachments.push({
            filename: audioFile.filename,
            originalName: audioFile.originalname,
            mimetype: audioFile.mimetype,
            size: audioFile.size,
            path: audioFile.path,
            type: 'audio'
          });
        }

        // Validate photo count for this item
        const photoCount = itemAttachments.filter(att => att.type === 'photo').length;
        if (photoCount < 4) {
          errors.push({
            index: i,
            error: `At least 4 photos are required for controller ${itemControllerNo}`,
            controllerNo: itemControllerNo,
            photoCount
          });
          continue;
        }

        // Process this item
        const result = await milestoneService.receiveControllerAtServiceCenter(
          itemControllerNo,
          userId,
          userRole,
          itemAttachments,
          io
        );

        results.push({
          index: i,
          controllerNo: itemControllerNo,
          ticketCode: result.ticket?.ticketCode || itemTicketCode,
          success: true,
          milestone: result.milestone
        });

      } catch (itemError) {
        console.error(`Error processing batch item ${i}:`, itemError);
        errors.push({
          index: i,
          error: itemError.message,
          controllerNo: req.body[`items[${i}][controllerNo]`] || 'unknown'
        });
      }
    }

    // Return batch results
    const successCount = results.length;
    const errorCount = errors.length;

    res.status(200).json({
      message: `Batch processed: ${successCount} successful, ${errorCount} errors`,
      batchCount: itemCount,
      successCount,
      errorCount,
      results,
      errors,
      summary: {
        total: itemCount,
        processed: successCount,
        failed: errorCount
      }
    });

  } catch (error) {
    console.error("Error processing receive batch:", error);
    res.status(500).json({
      message: "Failed to process batch",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  getTicketMilestones,
  getCurrentMilestone,
  getAvailableTransitions,
  transitionMilestone,
  updateMilestoneNotes,
  updateMilestone,
  addPhotosToCurrentMilestone,
  handleMilestoneFileUpload,
  createMilestone,
  receiveControllerAtServiceCenter,
  receiveControllerBatch,
};
