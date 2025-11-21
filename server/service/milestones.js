const { prisma } = require("../lib/clients");
const { generateTicketFileUrl } = require("../lib/ticket_file_handler");
const {
  validateMilestoneTransition,
  getStageConfig,
  getNextAvailableStages,
  canRoleTransitionToStage,
} = require("../lib/milestoneConfig");
const spareRequestService = require("./spareRequests");
const { saveAndBroadcastNotification, createMilestoneNotification } = require("../lib/notificationUtils");

const createMilestone = async (milestoneData, io) => {
  try {
    const milestone = await prisma.ticketMilestone.create({
      data: milestoneData,
      include: {
        changer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        attachments: true,
        ticket: true,
      },
    });

    // Create notification for milestone creation
    try {
      if (milestoneData.changedBy) {
        const milestoneConfig = getStageConfig(milestone.stage);
        const milestoneWithConfig = {
          ...milestone,
          config: milestoneConfig,
        };
        
        const targetRoles = [
          'MACSOFT_ADMIN',
          'MACSOFT_HEAD', 
          'MACSOFT_SUPPORT',
          'CUSTOMER_SERVICE_HEAD'
        ];
        
        const targetUsers = await prisma.user.findMany({
          where: {
            role: { in: targetRoles },
            id: { not: milestoneData.changedBy }
          },
          select: { id: true }
        });
        
        const targetUserIds = targetUsers.map(user => user.id);
        
        if (targetUserIds.length > 0) {
          const notificationData = createMilestoneNotification(
            'created',
            milestoneWithConfig,
            milestone.ticket,
            milestoneData.changedBy
          );
          
          await saveAndBroadcastNotification(prisma, io, notificationData, targetUserIds);
          console.log(`📢 Milestone creation notification sent to ${targetUserIds.length} users`);
        }
      }
    } catch (notificationError) {
      console.error('❌ Error sending milestone creation notification:', notificationError);
      // Don't throw - milestone creation should succeed even if notification fails
    }

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
            "milestones"
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
    if (targetStage === "SPARE_APPROVED") {
      try {
        spareApprovalResult =
          await spareRequestService.bulkApproveSpareRequestsByTicket(
            ticket.ticketCode,
            userId
          );
        console.log(
          `✅ Bulk approved ${spareApprovalResult.approvedRequests} spare requests with ${spareApprovalResult.approvedItems} items for ticket ${ticket.ticketCode}`
        );
      } catch (spareApprovalError) {
        console.error(
          "❌ Error auto-approving spare requests during milestone transition:",
          spareApprovalError
        );
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
        allowedRoles: String(targetConfig.allowedRoles || []),
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
            "milestones"
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

    // Create and send milestone notification
    try {
      const milestoneWithConfig = {
        ...finalMilestone,
        config: targetConfig,
      };
      
      // Determine which users should receive milestone notifications
      // Get users based on roles that should be notified about milestone changes
      const targetRoles = [
        'MACSOFT_ADMIN',
        'MACSOFT_HEAD', 
        'MACSOFT_SUPPORT',
        'CUSTOMER_SERVICE_HEAD'
      ];
      
      // For field clearance notifications, also notify field engineers
      if (targetStage === 'REQUEST_CLEARED_AT_FIELD' || targetStage === 'FIELD_CLEARANCE_APPROVED') {
        targetRoles.push('CUSTOMER_FIELD_ENGINEER');
      }
      
      // For service center related stages, notify technicians
      if (['RECEIVED_AT_SERVICE_CENTER', 'DIAGNOSIS_IN_PROGRESS', 'REPAIR_IN_PROGRESS', 'REPLACEMENT_IN_PROGRESS', 'REPAIRED'].includes(targetStage)) {
        targetRoles.push('SERVICE_CENTER_TECHNICIAN');
      }
      
      const targetUsers = await prisma.user.findMany({
        where: {
          role: { in: targetRoles },
          // Exclude the user who made the transition
          id: { not: userId }
        },
        select: { id: true }
      });
      
      const targetUserIds = targetUsers.map(user => user.id);
      
      if (targetUserIds.length > 0) {
        const notificationData = createMilestoneNotification(
          targetConfig.isFinal ? 'completed' : 'stage_changed',
          milestoneWithConfig,
          ticket,
          userId,
          {
            previousStage: currentMilestone?.stage,
            previousStageLabel: currentMilestone ? getStageConfig(currentMilestone.stage)?.label : null,
            isTransition: true,
            spareRequestsApproved: targetStage === "SPARE_APPROVED" && spareApprovalResult
          }
        );
        
        await saveAndBroadcastNotification(prisma, io, notificationData, targetUserIds);
        console.log(`📢 Milestone notification sent to ${targetUserIds.length} users for stage transition to ${targetConfig.label}`);
      }
    } catch (notificationError) {
      console.error('❌ Error sending milestone notification:', notificationError);
      // Don't throw - milestone transition should succeed even if notification fails
    }

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
      if (targetStage === "SPARE_APPROVED" && spareApprovalResult) {
        updateData.spareRequestsApproved = true;
        updateData.spareApprovalResult = spareApprovalResult;
      }

      io.emit("milestone-updated", updateData);

      // Also emit spare request update for real-time UI updates
      if (targetStage === "SPARE_APPROVED" && spareApprovalResult) {
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
    if (targetStage === "SPARE_APPROVED" && spareApprovalResult) {
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
        ticket: {
          select: {
            id: true,
            ticketCode: true,
            customerName: true,
            priority: true,
          },
        },
      },
    });

    const config = getStageConfig(updatedMilestone.stage);
    const milestoneWithConfig = {
      ...updatedMilestone,
      config,
    };

    // Create notification for milestone notes update
    try {
      const targetRoles = [
        'MACSOFT_ADMIN',
        'MACSOFT_HEAD', 
        'MACSOFT_SUPPORT',
        'CUSTOMER_SERVICE_HEAD'
      ];
      
      const targetUsers = await prisma.user.findMany({
        where: {
          role: { in: targetRoles },
          id: { not: userId }
        },
        select: { id: true }
      });
      
      const targetUserIds = targetUsers.map(user => user.id);
      
      if (targetUserIds.length > 0) {
        const notificationData = createMilestoneNotification(
          'updated',
          milestoneWithConfig,
          updatedMilestone.ticket,
          userId,
          {
            updateType: 'notes',
            hasNotes: Boolean(notes)
          }
        );
        
        // Note: We don't have io here, so pass null - notifications will still be saved to DB
        await saveAndBroadcastNotification(prisma, null, notificationData, targetUserIds);
        console.log(`📢 Milestone notes update notification sent to ${targetUserIds.length} users`);
      }
    } catch (notificationError) {
      console.error('❌ Error sending milestone notes update notification:', notificationError);
      // Don't throw - notes update should succeed even if notification fails
    }

    return milestoneWithConfig;
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
      select: { 
        ticketCode: true,
        id: true,
        customerName: true,
        priority: true,
      },
    });

    // Create attachments for the current milestone
    await prisma.attachments.createMany({
      data: attachments.map((attachment) => ({
        fileName: attachment.originalName || attachment.filename,
        fileType: attachment.mimetype,
        fileSize: attachment.size,
        fileUrl: generateTicketFileUrl(
          ticket.ticketCode,
          attachment.filename,
          "milestones"
        ),
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
    const milestoneWithConfig = {
      ...updatedMilestone,
      config,
    };

    // Create notification for photos added to milestone
    try {
      const targetRoles = [
        'MACSOFT_ADMIN',
        'MACSOFT_HEAD', 
        'MACSOFT_SUPPORT',
        'CUSTOMER_SERVICE_HEAD'
      ];
      
      const targetUsers = await prisma.user.findMany({
        where: {
          role: { in: targetRoles },
          id: { not: userId }
        },
        select: { id: true }
      });
      
      const targetUserIds = targetUsers.map(user => user.id);
      
      if (targetUserIds.length > 0) {
        const notificationData = createMilestoneNotification(
          'updated',
          milestoneWithConfig,
          ticket,
          userId,
          {
            updateType: 'photos',
            photosAdded: attachments.length
          }
        );
        
        // Note: We don't have io here, so pass null - notifications will still be saved to DB
        await saveAndBroadcastNotification(prisma, null, notificationData, targetUserIds);
        console.log(`📢 Milestone photos update notification sent to ${targetUserIds.length} users`);
      }
    } catch (notificationError) {
      console.error('❌ Error sending milestone photos update notification:', notificationError);
      // Don't throw - photos update should succeed even if notification fails
    }

    return milestoneWithConfig;
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

const receiveControllerAtServiceCenter = async (
  controllerNo,
  userId,
  userRole,
  attachments,
  io
) => {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Find ticket by controller number
    const ticket = await prisma.ticket.findFirst({
      where: {
        controllerNo: {
          contains: controllerNo,
         }
      },
      include: {
        ticketMilestones: {
          orderBy: {
            order: 'asc'
          }
        },
        serviceCenter: true,
      }
    });

    if (!ticket) {
      throw new Error(`No ticket found with controller number: ${controllerNo}`);
    }

    // Check if user has permission to receive at service center
    if (!canRoleTransitionToStage(userRole, 'RECEIVED_AT_SERVICE_CENTER')) {
      throw new Error(`Your role (${userRole}) does not have permission to receive controllers`);
    }

    // Check if user is from the assigned service center
    if (userRole === 'SERVICE_CENTER_TECHNICIAN' || userRole === 'CUSTOMER_SERVICE_HEAD') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { serviceCenterCode: true },
      });

      if (!user?.serviceCenterCode || ticket.assignedServiceCenter !== user.serviceCenterCode) {
        throw new Error('This ticket is not assigned to your service center');
      }
    }

    // Validate that photos are provided (mandatory for RECEIVED_AT_SERVICE_CENTER)
    if (!attachments || attachments.length === 0) {
      throw new Error('Photos are mandatory when receiving controller at service center');
    }

    const config = getStageConfig('RECEIVED_AT_SERVICE_CENTER');
    if (config.minPhotos && attachments.length < config.minPhotos) {
      throw new Error(`At least ${config.minPhotos} photos are required (${config.requiredPhotos?.join(', ') || 'Controller Front, Controller Bottom, Full View Open, MCB Close Up'})`);
    }

    // Move files from temp to proper location
    const baseDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    const targetDir = path.join(baseDir, ticket.ticketCode, 'milestones');
    
    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });

    // Move files and update attachment paths
    const processedAttachments = await Promise.all(attachments.map(async (attachment) => {
      const sourcePath = attachment.path;
      const targetPath = path.join(targetDir, attachment.filename);
      
      try {
        await fs.rename(sourcePath, targetPath);
      } catch (error) {
        // If rename fails (cross-device), try copy and delete
        await fs.copyFile(sourcePath, targetPath);
        await fs.unlink(sourcePath);
      }
      
      return {
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimetype: attachment.mimetype,
        size: attachment.size,
        path: targetPath,
        label: attachment.label, // Preserve the label
        type: attachment.type    // Preserve the type
      };
    }));

    // Transition to RECEIVED_AT_SERVICE_CENTER
    const milestone = await transitionMilestone(
      ticket.id,
      'RECEIVED_AT_SERVICE_CENTER',
      userId,
      userRole,
      {
        notes: `Controller received at service center. Serial: ${controllerNo}`,
        attachments: processedAttachments,
      },
      io
    );

    return {
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        controllerNo: ticket.controllerNo,
        status: ticket.status,
      },
      milestone,
    };
  } catch (error) {
    console.error('Error receiving controller at service center:', error);
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
  receiveControllerAtServiceCenter,
};
