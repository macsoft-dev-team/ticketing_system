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

const transitionMilestone =   async (req, res) => {
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

    const _milestoneData = {
      ticketId,
      stage: milestoneData.stage,
      order: milestoneData.order,
      status: milestoneData.status,
      photoRequired: milestoneData.photoRequired,
      startedAt: new Date(),
      changedBy: milestoneData.status === "IN_PROGRESS" ? userId : null,
    };

    const newMilestone = await milestoneService.createMilestone(_milestoneData);

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
};
