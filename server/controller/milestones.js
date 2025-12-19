const milestoneService = require("../service/milestones");
const batchService = require("../service/batch");
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
    res.status(500).json({
      message: "Failed to fetch available transitions",
      error: error.message,
    });
  }
};

const transitionMilestone = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { targetStage, notes, spareRequestId, action } = req.body;
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
      action, // Pass action to service layer
    };

    const updatedMilestone = await milestoneService.transitionMilestone(
      parseInt(ticketId),
      targetStage,
      userId,
      userRole,
      data,
      io
    );

    // Emit socket event for milestone transition
    if (io && updatedMilestone.ticket) {
      const milestoneTransitionData = {
        type: 'milestone-transitioned',
        ticketId: parseInt(ticketId),
        ticketCode: updatedMilestone.ticket.ticketCode,
        milestone: updatedMilestone,
        fromStage: data.fromStage || 'previous',
        toStage: targetStage,
        isTicketClosed: updatedMilestone.config?.isFinal || false,
        updatedBy: {
          id: userId,
          name: updatedMilestone.changer?.name || 'Unknown User'
        },
        timestamp: new Date().toISOString()
      };

      // Emit to all rooms (admin, servicecenter, customer)
      io.to('admin').emit('milestone-transitioned', milestoneTransitionData);
      io.to('servicecenter').emit('milestone-transitioned', milestoneTransitionData);
      io.to('customer').emit('milestone-transitioned', milestoneTransitionData);
          }

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
    const io = req.io;

    const updatedMilestone = await milestoneService.updateMilestoneNotes(
      parseInt(milestoneId),
      notes,
      userId
    );

    // Emit socket event for milestone notes update
    if (io && updatedMilestone.ticket) {
      const milestoneUpdateData = {
        type: 'milestone-notes-updated',
        ticketId: updatedMilestone.ticketId,
        ticketCode: updatedMilestone.ticket.ticketCode,
        milestone: updatedMilestone,
        updatedBy: {
          id: userId,
          name: updatedMilestone.changer?.name || 'Unknown User'
        },
        timestamp: new Date().toISOString()
      };

      // Emit to all rooms (admin, servicecenter, customer)
      io.to('admin').emit('milestone-updated', milestoneUpdateData);
      io.to('servicecenter').emit('milestone-updated', milestoneUpdateData);
      io.to('customer').emit('milestone-updated', milestoneUpdateData);
      
     }

    res.status(200).json({
      message: "Milestone notes updated successfully",
      milestone: updatedMilestone,
    });
  } catch (error) {
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
    const io = req.io;
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

    // Emit socket event for milestone photos added
    if (io && updatedMilestone.ticket) {
      const milestoneUpdateData = {
        type: 'milestone-photos-added',
        ticketId: parseInt(ticketId),
        ticketCode: updatedMilestone.ticket.ticketCode,
        milestone: updatedMilestone,
        photosAdded: attachments.length,
        updatedBy: {
          id: userId,
          name: updatedMilestone.changer?.name || 'Unknown User'
        },
        timestamp: new Date().toISOString()
      };

      // Emit to all rooms (admin, servicecenter, customer)
      io.to('admin').emit('milestone-updated', milestoneUpdateData);
      io.to('servicecenter').emit('milestone-updated', milestoneUpdateData);
      io.to('customer').emit('milestone-updated', milestoneUpdateData);
      
     }

    res.status(200).json({
      message: "Photos added to milestone successfully",
      milestone: updatedMilestone,
    });
  } catch (error) {
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
    const io = req.io;

    const updatedMilestone = await milestoneService.updateMilestone(
      parseInt(milestoneId),
      milestoneData,
      userId
    );

    // Emit socket event for milestone update
    if (io && updatedMilestone.ticket) {
      const milestoneUpdateData = {
        type: 'milestone-updated',
        ticketId: updatedMilestone.ticketId,
        ticketCode: updatedMilestone.ticket.ticketCode,
        milestone: updatedMilestone,
        updatedBy: {
          id: userId,
          name: updatedMilestone.changer?.name || 'Unknown User'
        },
        timestamp: new Date().toISOString()
      };

      // Emit to all rooms (admin, servicecenter, customer)
      io.to('admin').emit('milestone-updated', milestoneUpdateData);
      io.to('servicecenter').emit('milestone-updated', milestoneUpdateData);
      io.to('customer').emit('milestone-updated', milestoneUpdateData);
     }

    res.status(200).json({
      message: "Milestone updated successfully",
      milestone: updatedMilestone,
    });
  } catch (error) {
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

    // Emit socket event for milestone creation
    if (io && newMilestone.ticket) {
      const milestoneCreateData = {
        type: 'milestone-created',
        ticketId: parseInt(ticketId),
        ticketCode: newMilestone.ticket.ticketCode,
        milestone: newMilestone,
        createdBy: {
          id: userId,
          name: newMilestone.changer?.name || 'Unknown User'
        },
        timestamp: new Date().toISOString()
      };

      // Emit to all rooms (admin, servicecenter, customer)
      io.to('admin').emit('milestone-created', milestoneCreateData);
      io.to('servicecenter').emit('milestone-created', milestoneCreateData);
      io.to('customer').emit('milestone-created', milestoneCreateData);
     }

    res.status(201).json({
      message: "Milestone created successfully",
      milestone: newMilestone,
    });
  } catch (error) {
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
    const { batchCount, batchId } = req.body;
     
const batch = await batchService.receiveControllerBatch(batchId);
 
    res.status(200).json({
      message: `Batch of ${batchCount} controllers received successfully`,
      milestone: batch
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to process batch",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const deliveryControllerBatch = async (req, res) => {
  try {
    const { batchCount, batchId } = req.body;
     
    const batch = await batchService.deliveryControllerBatch(batchId);
 
    res.status(200).json({
      message: `Batch of ${batchCount} controllers marked as delivered successfully`,
      milestone: batch
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to process delivery batch",
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
  deliveryControllerBatch,
};
