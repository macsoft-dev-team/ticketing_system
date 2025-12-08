const { prisma } = require("../lib/clients");
const {
  createTicketNotification,
  saveAndBroadcastNotification,
  createNotification,
  NOTIFICATION_TYPES,
} = require("../lib/notificationUtils");

// Define Macsoft roles (internal users)
const MACSOFT_ROLES = [
  'MACSOFT_ADMIN',
  'MACSOFT_HEAD', 
  'MACSOFT_SUPPORT'
];

// Define Customer roles (external users)
const CUSTOMER_ROLES = [
  'CUSTOMER_SERVICE_HEAD',
  'SERVICE_CENTER_TECHNICIAN',
  'CUSTOMER_FIELD_ENGINEER'
];

/**
 * Auto-close tickets where Macsoft users were the last to reply
 * and no customer response was received within 48 hours
 */
const autoCloseTickets = async () => {
  try {
    console.log('Starting auto-close ticket job...');
    
    // Get current timestamp in UTC (as stored in database)
    const nowUTC = new Date();
    
    // Calculate 48 hours ago in UTC (since database stores UTC)
    const fortyEightHoursAgoUTC = new Date(nowUTC.getTime() - (48 * 60 * 60 * 1000));
    
    // For logging purposes, show IST times
    const istNow = new Date(nowUTC.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const fortyEightHoursAgoIST = new Date(fortyEightHoursAgoUTC.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    console.log(`Current UTC time: ${nowUTC.toISOString()}`);
    console.log(`Current IST time: ${istNow.toLocaleString()}`);
    console.log(`48 hours ago UTC: ${fortyEightHoursAgoUTC.toISOString()}`);
    console.log(`48 hours ago IST: ${fortyEightHoursAgoIST.toLocaleString()}`);
    
    // Find open tickets that have messages (no age restriction on ticket itself)
    const candidateTickets = await prisma.ticket.findMany({
      where: {
        status: {
          in: ['OPEN']
        },
        messages: {
          some: {} // Has at least one message
        }
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                role: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        createdByUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`Found ${candidateTickets.length} candidate tickets to check`);
    
    let closedCount = 0;
    
    for (const ticket of candidateTickets) {
      if (ticket.messages.length === 0) continue;
      
      // Get the last message
      const lastMessage = ticket.messages[0];
      
      // Check if last message was from a Macsoft user
      const isLastMessageFromMacsoft = MACSOFT_ROLES.includes(lastMessage.sender.role);
      
      if (!isLastMessageFromMacsoft) continue;
      
      // Check if 48 hours have passed since the last Macsoft message
      const lastMacsoftMessageTime = lastMessage.createdAt;
      if (lastMacsoftMessageTime >= fortyEightHoursAgoUTC) {
        // Less than 48 hours since last Macsoft message, skip this ticket
        continue;
      }
      
      // For logging, show ticket creation time and last message time in IST
      const ticketCreatedIST = new Date(ticket.createdAt.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const messageTimeIST = new Date(lastMessage.createdAt.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      
      console.log(`Checking ticket ${ticket.ticketCode}: Created at ${ticketCreatedIST.toLocaleString()} IST, Last message at ${messageTimeIST.toLocaleString()} IST, 48h cutoff: ${fortyEightHoursAgoIST.toLocaleString()} IST`);
      
      // Check if there are any customer messages after the last Macsoft message
      const hasCustomerResponseAfterMacsoft = ticket.messages.some(message => {
        return CUSTOMER_ROLES.includes(message.sender.role) && 
               message.createdAt > lastMessage.createdAt;
      });
      
      if (hasCustomerResponseAfterMacsoft) continue;
      
      // Check if there are any pending spare requests for this ticket
      const pendingSpareRequests = await prisma.spareRequest.findMany({
        where: {
          ticketCode: ticket.ticketCode,
          status: {
            in: ['PENDING', 'URGENT', 'APPROVED', 'PARTIALLY_APPROVED'] // Any active status (exclude REJECTED)
          }
        }
      });
      
      if (pendingSpareRequests.length > 0) {
        console.log(`Skipping auto-close for ticket ${ticket.ticketCode} - has ${pendingSpareRequests.length} pending spare request(s)`);
        continue;
      }
      
      // Check if there are any active spare-related milestones
      const spareRelatedMilestones = await prisma.ticketMilestone.findMany({
        where: {
          ticketId: ticket.id,
          stage: {
            in: ['SPARE_REQUESTED', 'SPARE_APPROVED', 'PARTIALY_SPARE_APPROVED']
          },
          status: {
            in: ['PENDING'] // Active milestones
          }
        }
      });
      
      if (spareRelatedMilestones.length > 0) {
        console.log(`Skipping auto-close for ticket ${ticket.ticketCode} - has ${spareRelatedMilestones.length} active spare-related milestone(s)`);
        continue;
      }
      
      // Check if there are any active workflow milestones that should prevent auto-closing
      const activeWorkflowMilestones = await prisma.ticketMilestone.findMany({
        where: {
          ticketId: ticket.id,
          stage: {
            in: [
              'SENT_TO_SERVICE_CENTER',
              'SUBMITTED_TO_SERVICE_CENTER', 
              'RECEIVED_AT_SERVICE_CENTER',
              'DIAGNOSIS_IN_PROGRESS',
              'REPAIR_IN_PROGRESS',
              'REPLACEMENT_IN_PROGRESS',
              'READY_FOR_DISPATCH'
            ]
          },
          status: {
            in: ['PENDING', 'IN_PROGRESS'] // Active milestones
          }
        }
      });
      
      if (activeWorkflowMilestones.length > 0) {
        console.log(`Skipping auto-close for ticket ${ticket.ticketCode} - has ${activeWorkflowMilestones.length} active workflow milestone(s): ${activeWorkflowMilestones.map(m => m.stage).join(', ')}`);
        continue;
      }
      
      // Close the ticket
      await closeTicketDueToNoResponse(ticket, lastMessage);
      closedCount++;
      
      console.log(`Auto-closed ticket: ${ticket.ticketCode} - Last message from ${lastMessage.sender.name} at ${lastMessage.createdAt}`);
    }
    
    console.log(`Auto-close job completed. Closed ${closedCount} tickets.`);
    return { success: true, closedCount };
    
  } catch (error) {
    console.error('Error in auto-close ticket job:', error);
    throw error;
  }
};

/**
 * Close a ticket due to no customer response and create appropriate notifications
 */
const closeTicketDueToNoResponse = async (ticket, lastMessage) => {
  try {
    // Update ticket status to CLOSED
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'CLOSED',
        updatedAt: new Date()
      }
    });
    
    // Update all existing pending/in-progress milestones to DONE before creating TICKET_CLOSED
    try {
      // Update all pending/in-progress milestones to DONE
      const updatedMilestones = await prisma.ticketMilestone.updateMany({
        where: {
          ticketId: ticket.id,
          status: {
            in: ['PENDING', 'IN_PROGRESS']
          }
        },
        data: {
          status: 'DONE',
          completedAt: new Date(),
          notes: 'Marked as done due to ticket auto-closure'
        }
      });
      
      if (updatedMilestones.count > 0) {
        console.log(`Updated ${updatedMilestones.count} existing milestones to DONE for ${ticket.ticketCode}`);
      }
      
      // Get the highest order number for existing milestones
      const lastMilestone = await prisma.ticketMilestone.findFirst({
        where: { ticketId: ticket.id },
        orderBy: { order: 'desc' }
      });
      
      const nextOrder = lastMilestone ? lastMilestone.order + 1 : 1;
      
      // Create TICKET_CLOSED milestone
      await prisma.ticketMilestone.create({
        data: {
          ticketId: ticket.id,
          stage: 'TICKET_CLOSED',
          order: nextOrder,
          description: 'Ticket automatically closed due to no customer response',
          status: 'DONE',
          startedAt: new Date(),
          completedAt: new Date(),
          changedBy: 1, // System user ID
          notes: `Automatically closed due to no customer response within 48 hours of last Macsoft reply on ${new Date(lastMessage.createdAt.toLocaleString("en-US", {timeZone: "Asia/Kolkata"})).toLocaleString()} IST.`
        }
      });
      
      console.log(`Created TICKET_CLOSED milestone for ${ticket.ticketCode}`);
    } catch (milestoneError) {
      console.log(`Could not update milestones for ${ticket.ticketCode}:`, milestoneError.message);
    }
    
    // Create a system message indicating auto-closure
    const lastMessageIST = new Date(lastMessage.createdAt.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const systemMessage = await prisma.message.create({
      data: {
        content: `Ticket automatically closed due to no customer response within 48 hours of last Macsoft reply on ${lastMessageIST.toLocaleString()} IST.`,
        senderId: 1, // System user ID (changed from 19 to 1 for consistency)
        ticketId: ticket.id
      }
    });
    
    // Create notification for ticket creator
    const creatorNotification = createNotification(
      NOTIFICATION_TYPES.TICKET_CLOSED,
      'Ticket Auto-Closed',
      `Ticket ${ticket.ticketCode} auto-closed due to no response within 48 hours.`,
      {
        ticketId: ticket.id,
        ticketCode: ticket.ticketCode,
        userId: 1 // System user ID
      }
    );
    
    // Send notification to ticket creator
    await saveAndBroadcastNotification(prisma, null, creatorNotification, [ticket.createdBy]);
    
    // Get all users who participated in the conversation for broader notification
    const participantIds = [...new Set(ticket.messages.map(msg => msg.senderId))];
    
    // Create notification for all participants
    const participantNotification = createNotification(
      NOTIFICATION_TYPES.TICKET_CLOSED,
      'Ticket Auto-Closed',
      `Ticket ${ticket.ticketCode} auto-closed - no response within 48 hours.`,
      {
        ticketId: ticket.id,
        ticketCode: ticket.ticketCode,
        userId: 1 // System user ID
      }
    );
    
    await saveAndBroadcastNotification(prisma, null, participantNotification, participantIds);
    
    // Mark all messages in this ticket as seen by all participants
    try {
      const messageIds = ticket.messages.map(msg => msg.id);
      const participantUserIds = [...new Set(ticket.messages.map(msg => msg.senderId))];
      
      // Create MessageSeen records for all participants for all messages (if not already exists)
      for (const messageId of messageIds) {
        for (const userId of participantUserIds) {
          await prisma.messageSeen.upsert({
            where: {
              messageId_userId: {
                messageId: messageId,
                userId: userId
              }
            },
            update: {
              seenAt: new Date()
            },
            create: {
              messageId: messageId,
              userId: userId,
              seenAt: new Date()
            }
          });
        }
      }
      
      console.log(`Marked ${messageIds.length} messages as seen for ${participantUserIds.length} participants in ticket ${ticket.ticketCode}`);
    } catch (messageSeenError) {
      console.log(`Could not mark messages as seen for ${ticket.ticketCode}:`, messageSeenError.message);
    }
    
    // Mark all notifications related to this ticket as seen
    try {
      // Get all notifications for this ticket
      const ticketNotifications = await prisma.notification.findMany({
        where: { ticketId: ticket.id },
        include: {
          recipients: true
        }
      });
      
      // Update all notification recipients to mark as seen
      for (const notification of ticketNotifications) {
        await prisma.notificationRecipient.updateMany({
          where: {
            notificationId: notification.id,
            seen: false
          },
          data: {
            seen: true,
            seenAt: new Date()
          }
        });
      }
      
      console.log(`Marked ${ticketNotifications.length} notifications as seen for ticket ${ticket.ticketCode}`);
    } catch (notificationSeenError) {
      console.log(`Could not mark notifications as seen for ${ticket.ticketCode}:`, notificationSeenError.message);
    }
    
    // Get updated ticket
    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id }
    });
    
    return updatedTicket;
    
  } catch (error) {
    console.error(`Error closing ticket ${ticket.ticketCode}:`, error);
    throw error;
  }
};

/**
 * Get tickets that are candidates for auto-closure (for monitoring purposes)
 */
const getCandidateTicketsForClosure = async () => {
  try {
    const nowUTC = new Date();
    const fortyEightHoursAgoUTC = new Date(nowUTC.getTime() - (48 * 60 * 60 * 1000));
    
    const candidates = await prisma.ticket.findMany({
      where: {
        status: {
          in: ['OPEN']
        },
        messages: {
          some: {
            createdAt: {
              lt: fortyEightHoursAgoUTC
            },
            sender: {
              role: {
                in: MACSOFT_ROLES
              }
            }
          }
        }
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                role: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Get last 5 messages for analysis
        }
      }
    });
    
    return candidates.filter(ticket => {
      const lastMessage = ticket.messages[0];
      if (!lastMessage) return false;
      
      const isLastFromMacsoft = MACSOFT_ROLES.includes(lastMessage.sender.role);
      if (!isLastFromMacsoft) return false;
      
      const hasCustomerResponseAfter = ticket.messages.some(msg => 
        CUSTOMER_ROLES.includes(msg.sender.role) && msg.createdAt > lastMessage.createdAt
      );
      
      return !hasCustomerResponseAfter;
    });
    
  } catch (error) {
    console.error('Error getting candidate tickets:', error);
    throw error;
  }
};

module.exports = {
  autoCloseTickets,
  getCandidateTicketsForClosure,
  MACSOFT_ROLES,
  CUSTOMER_ROLES
};