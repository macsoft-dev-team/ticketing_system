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

// RBAC Socket emission helper for milestone events
const emitMilestoneEventWithRBAC = (io, eventName, ticketData, eventData) => {
  if (!io || !ticketData) return;
  
  const dataToEmit = eventData;
  
  // Always emit to MACSOFT roles (global access)
  io.to('role-MACSOFT_ADMIN').emit(eventName, dataToEmit);
  io.to('role-MACSOFT_HEAD').emit(eventName, dataToEmit);
  io.to('role-MACSOFT_SUPPORT').emit(eventName, dataToEmit);
  
  // Emit to ticket creator (if they are a field engineer)
  if (ticketData.createdBy) {
    io.to(`notifications-${ticketData.createdBy}`).emit(eventName, dataToEmit);
  }
  
  // Emit to assigned service center
  if (ticketData.assignedServiceCenter) {
    io.to(`center-${ticketData.assignedServiceCenter}`).emit(eventName, dataToEmit);
  }
  
  // Emit to Customer Service Heads
  io.to('role-CUSTOMER_SERVICE_HEAD').emit(eventName, dataToEmit);
 };

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
        }
      }
    } catch (notificationError) {
      // Don't throw - milestone creation should succeed even if notification fails
    }

    return milestone;
  } catch (error) {
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

    // Additional validation for RECEIVED_AT_SERVICE_CENTER
    if (targetStage === 'RECEIVED_AT_SERVICE_CENTER') {
      // Check if current milestone is SUBMITTED_TO_SERVICE_CENTER (which is the required prerequisite)
      if (!currentMilestone || currentMilestone.stage !== 'SUBMITTED_TO_SERVICE_CENTER') {
        throw new Error('Controller must be submitted to service center by field engineer before it can be received');
      }
    }

    // Get ticket for file URL generation and notification targeting
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { 
        ticketCode: true,
        id: true,
        createdBy: true,
        stateCode: true,
        customerName: true,
        priority: true,
      },
    });

    // Special validation for close_ticket and cancel_spare_and_close actions
    if (data.action === 'close_ticket' || data.action === 'cancel_spare_and_close') {
      // Allow MACSOFT_ADMIN unrestricted access, SERVICE_CENTER_TECHNICIAN only if they created the ticket
      if (userRole !== 'SERVICE_CENTER_TECHNICIAN' && userRole !== 'MACSOFT_ADMIN') {
        throw new Error('Only service center technicians or MACSOFT admins can perform this action');
      }
      
      // MACSOFT_ADMIN can close any ticket, SERVICE_CENTER_TECHNICIAN can only close tickets they created
      if (userRole === 'SERVICE_CENTER_TECHNICIAN' && ticket.createdBy !== userId) {
        throw new Error('Service center technicians can only close tickets they created');
      }
    }

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
      } catch (spareApprovalError) {
    
        // Continue with milestone creation even if spare approval fails
      }
    }

    // Handle special case for cancel_spare_and_close - cancel all spare requests
    if (data.action === 'cancel_spare_and_close') {
      try {
        await spareRequestService.bulkCancelSpareRequestsByTicket(
          ticket.ticketCode,
          userId,
          'Service center technician cancelled spare requests and closed ticket'
        );
      } catch (cancelError) {
        console.error('Error cancelling spare requests:', cancelError);
        // Continue with milestone creation even if spare cancellation fails
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

    // Handle auto-transition to TICKET_CLOSED for DELIVERED_TO_FIELD or FIELD_CLEARANCE_APPROVED
    let finalMilestone = createdMilestone;
    let shouldCreateTicketClosed = false;
    
    if (targetStage === 'DELIVERED_TO_FIELD' || targetStage === 'FIELD_CLEARANCE_APPROVED') {
      shouldCreateTicketClosed = true;
      
      // First mark the current milestone as DONE
      await prisma.ticketMilestone.update({
        where: { id: createdMilestone.id },
        data: {
          status: "DONE",
          completedAt: new Date(),
        },
      });
      
      // Create TICKET_CLOSED milestone
      const ticketClosedConfig = getStageConfig('TICKET_CLOSED');
      const ticketClosedMilestone = await prisma.ticketMilestone.create({
        data: {
          ticketId,
          stage: 'TICKET_CLOSED',
          order: ticketClosedConfig.order,
          status: "DONE",
          startedAt: new Date(),
          completedAt: new Date(),
          changedBy: userId,
          notes: `Automatically closed after ${targetConfig.label}`,
          photoRequired: false,
          description: ticketClosedConfig.description,
          allowedRoles: String(ticketClosedConfig.allowedRoles || []),
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
      
      finalMilestone = ticketClosedMilestone;
    }

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
    if (targetConfig.isFinal || shouldCreateTicketClosed) {
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

    // Fetch the updated milestone with attachments (use finalMilestone which could be TICKET_CLOSED)
    const milestoneWithAttachments = await prisma.ticketMilestone.findUnique({
      where: { id: finalMilestone.id },
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
    
    finalMilestone = milestoneWithAttachments;

    // Create and send milestone notification
    try {
      // Use the appropriate config - if we auto-transitioned to TICKET_CLOSED, use that config
      const configToUse = shouldCreateTicketClosed ? getStageConfig('TICKET_CLOSED') : targetConfig;
      const milestoneWithConfig = {
        ...finalMilestone,
        config: configToUse,
      };
      
      // Determine which users should receive milestone notifications
      // Get users based on roles that should be notified about milestone changes
      const targetRoles = [
        'MACSOFT_ADMIN',
        'MACSOFT_HEAD', 
        'MACSOFT_SUPPORT',
      ];
      
      // For field clearance notifications, notify only the field engineer who raised the ticket
      // and customer service heads assigned to the ticket's state
      if (targetStage === 'REQUEST_CLEARED_AT_FIELD' || targetStage === 'FIELD_CLEARANCE_APPROVED') {
        // Build query conditions
        const whereConditions = {
          OR: [
            // Include MACSOFT roles
            { role: { in: targetRoles } },
            // Include the field engineer who created the ticket
            { 
              id: ticket.createdBy,
              role: 'CUSTOMER_FIELD_ENGINEER'
            },
          ],
          // Exclude the user who made the transition
          id: { not: userId }
        };

        // If ticket has a state, include customer service heads assigned to that state
        // using the many-to-many UserStates relation
        if (ticket.stateCode) {
          const stateInfo = await prisma.state.findUnique({
            where: { stateCode: ticket.stateCode },
            select: { id: true }
          });

          if (stateInfo) {
            whereConditions.OR.push({
              role: 'CUSTOMER_SERVICE_HEAD',
              states: {
                some: {
                  id: stateInfo.id
                }
              }
            });
          }
        }

        const targetUsers = await prisma.user.findMany({
          where: whereConditions,
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
        }
      } else {
        // For other stages, use the original notification logic
        // Add CUSTOMER_SERVICE_HEAD to target roles for all other stages
        targetRoles.push('CUSTOMER_SERVICE_HEAD');
        
        // For service center related stages, notify technicians
        if (['SUBMITTED_TO_SERVICE_CENTER', 'RECEIVED_AT_SERVICE_CENTER', 'DIAGNOSIS_IN_PROGRESS', 'REPAIR_IN_PROGRESS', 'REPLACEMENT_IN_PROGRESS', 'REPAIRED', 'READY_FOR_DISPATCH'].includes(targetStage)) {
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
        }
      }
    } catch (notificationError) {
      // Don't throw - milestone transition should succeed even if notification fails
    }

    // Broadcast real-time update
    if (io) {
      const updateData = {
        ticketId,
        milestone: finalMilestone,
        previousStage: currentMilestone?.stage,
        newStage: shouldCreateTicketClosed ? 'TICKET_CLOSED' : targetStage,
        isTicketClosed: targetConfig.isFinal || shouldCreateTicketClosed,
        ticketStatus: (targetConfig.isFinal || shouldCreateTicketClosed) ? "CLOSED" : "IN_PROGRESS",
        autoTransitioned: shouldCreateTicketClosed,
        originalTargetStage: shouldCreateTicketClosed ? targetStage : undefined,
      };

      // Add spare request approval info for SPARE_APPROVED transitions
      if (targetStage === "SPARE_APPROVED" && spareApprovalResult) {
        updateData.spareRequestsApproved = true;
        updateData.spareApprovalResult = spareApprovalResult;
      }

      // Use RBAC-aware emission
      emitMilestoneEventWithRBAC(io, "milestone-updated", ticket, updateData);

      // Also emit spare request update for real-time UI updates
      if (targetStage === "SPARE_APPROVED" && spareApprovalResult) {
        const spareEventData = {
          ticketCode: ticket.ticketCode,
          approvedBy: userId,
          timestamp: new Date().toISOString(),
          approvalResult: spareApprovalResult,
        };
        emitMilestoneEventWithRBAC(io, "spare-requests-bulk-approved", ticket, spareEventData);
      }
    }

    const result = {
      ...finalMilestone,
      config: shouldCreateTicketClosed ? getStageConfig('TICKET_CLOSED') : targetConfig,
      autoTransitioned: shouldCreateTicketClosed,
      originalTargetStage: shouldCreateTicketClosed ? targetStage : undefined,
    };

    // Include spare approval result for SPARE_APPROVED transitions
    if (targetStage === "SPARE_APPROVED" && spareApprovalResult) {
      result.spareApprovalResult = spareApprovalResult;
    }

    return result;
  } catch (error) {
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
      }
    } catch (notificationError) {
      // Don't throw - notes update should succeed even if notification fails
    }

    return milestoneWithConfig;
  } catch (error) {
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
      }
    } catch (notificationError) {
      // Don't throw - photos update should succeed even if notification fails
    }

    return milestoneWithConfig;
  } catch (error) {
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

    // Validate that controller has been submitted to service center first
    const currentMilestone = ticket.ticketMilestones.find(
      milestone => milestone.status === 'IN_PROGRESS' || milestone.status === 'BLOCKED'
    );
    
    if (!currentMilestone || currentMilestone.stage !== 'SUBMITTED_TO_SERVICE_CENTER') {
      throw new Error('Controller must be submitted to service center by field engineer before it can be received');
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
