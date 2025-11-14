const { prisma } = require("../lib/clients");
const { generateTicketFileUrl } = require("../lib/ticket_file_handler");
const {
  validateMilestoneTransition,
  getStageConfig,
  getNextAvailableStages,
  canRoleTransitionToStage,
} = require("../lib/milestoneConfig");
const spareRequestService = require("./spareRequests");

const createMilestone = async (milestoneData) => {
  try {
    const milestone = await prisma.ticketMilestone.create({
      data: milestoneData,
    });

    return milestone;
  } catch (error) {
    console.error("Error creating initial milestones:", error);
    throw error;
  }
};

const getTicketMilestones = async (ticketId) => {
  try {
    const milestones = await prisma.ticketMilestone.findMany({
      where: { ticketId },
      include: {
        changer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        attachments: true,
      },
      orderBy: { order: "asc" },
    });

    // Enhance with configuration data
    return milestones.map((milestone) => {
      const config = getStageConfig(milestone.stage);
      return {
        ...milestone,
        config,
      };
    });
  } catch (error) {
    console.error("Error fetching ticket milestones:", error);
    throw error;
  }
};

const getCurrentMilestone = async (ticketId) => {
  try {
    const milestone = await prisma.ticketMilestone.findFirst({
      where: {
        ticketId,
        status: { in: ["IN_PROGRESS", "BLOCKED"] },
      },
      include: {
        changer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        attachments: true,
      },
      orderBy: { order: "desc" },
    });

    if (!milestone) return null;

    const config = getStageConfig(milestone.stage);
    return {
      ...milestone,
      config,
    };
  } catch (error) {
    console.error("Error fetching current milestone:", error);
    throw error;
  }
};

const transitionMilestone = async (
  ticketId,
  targetStage,
  userId,
  userRole,
  data = {},
  io = null
) => {
  try {
    // Get target stage configuration first
    const targetConfig = getStageConfig(targetStage);

    // Get current milestone
    const currentMilestone = await getCurrentMilestone(ticketId);

    // Validate transition
    const validation = validateMilestoneTransition(
      userRole,
      targetStage,
      currentMilestone,
      data
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get ticket for file URL generation
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { ticketCode: true },
    });

    // Handle attachments for CURRENT milestone if provided (to satisfy photo gate)
    if (
      currentMilestone &&
      data.currentMilestonePhotos &&
      data.currentMilestonePhotos.length > 0
    ) {
      await prisma.attachments.createMany({
        data: data.currentMilestonePhotos.map((attachment) => ({
          fileName: attachment.originalName || attachment.filename,
          fileType: attachment.mimetype,
          fileSize: attachment.size,
          fileUrl: generateTicketFileUrl(
            ticket.ticketCode,
            attachment.filename,
            'milestones'
          ),
          milestoneId: currentMilestone.id,
          ticketId: ticketId,
        })),
      });
    }

    // Mark current milestone as done if exists
    if (currentMilestone) {
      await prisma.ticketMilestone.update({
        where: { id: currentMilestone.id },
        data: {
          status: "DONE",
          completedAt: new Date(),
        },
      });
    }

    // Handle special case for SPARE_APPROVED - update all pending spare request items
    let spareApprovalResult = null;
    if (targetStage === 'SPARE_APPROVED') {
      try {
        spareApprovalResult = await spareRequestService.bulkApproveSpareRequestsByTicket(
          ticket.ticketCode, 
          userId
        );
        console.log(`✅ Bulk approved ${spareApprovalResult.approvedRequests} spare requests with ${spareApprovalResult.approvedItems} items for ticket ${ticket.ticketCode}`);
      } catch (spareApprovalError) {
        console.error('❌ Error auto-approving spare requests during milestone transition:', spareApprovalError);
        // Continue with milestone creation even if spare approval fails
      }
    }

    // Create the new milestone
    const createdMilestone = await prisma.ticketMilestone.create({
      data: {
        ticketId,
        stage: targetStage,
        order: targetConfig.order,
        status: targetConfig.isFinal ? "DONE" : "IN_PROGRESS",
        startedAt: new Date(),
        completedAt: targetConfig.isFinal ? new Date() : null,
        changedBy: userId,
        notes: data.notes || null,
        photoRequired: targetConfig.photoRequired || false,
        description: targetConfig.description || null,
        allowedRoles:  String(targetConfig.allowedRoles || []),
      },
      include: {
        changer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    // Handle attachments for the new milestone if provided
    if (data.attachments && data.attachments.length > 0) {
      await prisma.attachments.createMany({
        data: data.attachments.map((attachment) => ({
          fileName: attachment.originalName || attachment.filename,
          fileType: attachment.mimetype,
          fileSize: attachment.size,
          fileUrl: generateTicketFileUrl(
            ticket.ticketCode,
            attachment.filename,
            'milestones'
          ),
          milestoneId: createdMilestone.id,
          ticketId: ticketId,
        })),
      });
    }

    // Update ticket status based on milestone
    if (targetConfig.isFinal) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "CLOSED" },
      });
    } else if (createdMilestone.order > 1) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Fetch the updated milestone with attachments
    const finalMilestone = await prisma.ticketMilestone.findUnique({
      where: { id: createdMilestone.id },
      include: {
        changer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    // Broadcast real-time update
    if (io) {
      const updateData = {
        ticketId,
        milestone: finalMilestone,
        previousStage: currentMilestone?.stage,
        newStage: targetStage,
        isTicketClosed: targetConfig.isFinal,
        ticketStatus: targetConfig.isFinal ? "CLOSED" : "IN_PROGRESS",
      };

      // Add spare request approval info for SPARE_APPROVED transitions
      if (targetStage === 'SPARE_APPROVED' && spareApprovalResult) {
        updateData.spareRequestsApproved = true;
        updateData.spareApprovalResult = spareApprovalResult;
      }

      io.emit("milestone-updated", updateData);
      
      // Also emit spare request update for real-time UI updates
      if (targetStage === 'SPARE_APPROVED' && spareApprovalResult) {
        io.emit("spare-requests-bulk-approved", {
          ticketCode: ticket.ticketCode,
          approvedBy: userId,
          timestamp: new Date().toISOString(),
          approvalResult: spareApprovalResult,
        });
      }
    }

    const result = {
      ...finalMilestone,
      config: targetConfig,
    };

    // Include spare approval result for SPARE_APPROVED transitions
    if (targetStage === 'SPARE_APPROVED' && spareApprovalResult) {
      result.spareApprovalResult = spareApprovalResult;
    }

    return result;
  } catch (error) {
    console.error("Error transitioning milestone:", error);
    throw error;
  }
};

const getAvailableTransitions = async (ticketId, userRole) => {
  try {
    const currentMilestone = await getCurrentMilestone(ticketId);

    if (!currentMilestone) {
      // If no current milestone, return first stage if user can access it
      const firstStage = getStageConfig("TICKET_RAISED");
      if (canRoleTransitionToStage(userRole, firstStage.stage)) {
        return [firstStage];
      }
      return [];
    }

    const availableStages = getNextAvailableStages(
      currentMilestone.stage,
      userRole
    );
    return availableStages;
  } catch (error) {
    console.error("Error getting available transitions:", error);
    throw error;
  }
};

const updateMilestoneNotes = async (milestoneId, notes, userId) => {
  try {
    const updatedMilestone = await prisma.ticketMilestone.update({
      where: { id: milestoneId },
      data: {
        notes,
        changedBy: userId,
        updatedAt: new Date(),
      },
      include: {
        changer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    const config = getStageConfig(updatedMilestone.stage);
    return {
      ...updatedMilestone,
      config,
    };
  } catch (error) {
    console.error("Error updating milestone notes:", error);
    throw error;
  }
};

const addPhotosToCurrentMilestone = async (
  ticketId,
  userId,
  attachments = []
) => {
  try {
    const currentMilestone = await getCurrentMilestone(ticketId);

    if (!currentMilestone) {
      throw new Error("No active milestone found for this ticket");
    }

    if (!attachments || attachments.length === 0) {
      throw new Error("No photos provided");
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { ticketCode: true },
    });

    // Create attachments for the current milestone
    await prisma.attachments.createMany({
      data: attachments.map((attachment) => ({
        fileName: attachment.originalName || attachment.filename,
        fileType: attachment.mimetype,
        fileSize: attachment.size,
        fileUrl: generateTicketFileUrl(ticket.ticketCode, attachment.filename, 'milestones'),
        milestoneId: currentMilestone.id,
        ticketId: ticketId,
      })),
    });

    // Fetch updated milestone with new attachments
    const updatedMilestone = await prisma.ticketMilestone.findUnique({
      where: { id: currentMilestone.id },
      include: {
        changer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    const config = getStageConfig(updatedMilestone.stage);
    return {
      ...updatedMilestone,
      config,
    };
  } catch (error) {
    console.error("Error adding photos to milestone:", error);
    throw error;
  }
};

const updateMilestone = async (milestoneId, milestoneData, userId) => {
  try {
    // Check if this is a transition action
    if (milestoneData.action === "transition" && milestoneData.targetStage) {
      // This should use transitionMilestone instead
      throw new Error("Use transitionMilestone function for stage transitions");
    }

    // Prepare update data - only include valid schema fields
    const validFields = [
      "status",
      "notes",
      "startedAt",
      "completedAt",
      "eta",
      "slaDueAt",
      "photoRequired",
    ];
    const updateData = {};

    validFields.forEach((field) => {
      if (milestoneData[field] !== undefined) {
        updateData[field] = milestoneData[field];
      }
    });

    // Always update tracking fields
    updateData.changedBy = userId;
    updateData.updatedAt = new Date();

    const updatedMilestone = await prisma.ticketMilestone.update({
      where: { id: milestoneId },
      data: updateData,
      include: {
        changer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    const config = getStageConfig(updatedMilestone.stage);
    return {
      ...updatedMilestone,
      config,
    };
  } catch (error) {
    console.error("Error updating milestone:", error);
    throw error;
  }
};

module.exports = {
  getTicketMilestones,
  getCurrentMilestone,
  updateMilestone,
  transitionMilestone,
  getAvailableTransitions,
  updateMilestoneNotes,
  addPhotosToCurrentMilestone,
  createMilestone,
};
