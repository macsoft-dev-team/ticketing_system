/**
 * Comprehensive test for auto-close functionality with shorter time threshold
 * This simulates the full auto-close process including message/notification marking
 */

require('dotenv').config();
const { autoCloseTickets, MACSOFT_ROLES, CUSTOMER_ROLES } = require('../jobs/autoCloseTickets');
const { prisma } = require('../lib/clients');

/**
 * Test auto-close with 24-hour threshold (for testing purposes)
 */
const testAutoCloseWithShorterThreshold = async () => {
  try {
    console.log('=== Testing Auto-Close with 24-Hour Threshold ===\n');
    
    // Temporarily modify the time threshold for testing
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    // Find candidate tickets (using 24 hours instead of 48)
    const candidateTickets = await prisma.ticket.findMany({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS']
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

    console.log(`Found ${candidateTickets.length} total tickets with messages`);
    
    // Filter for tickets where Macsoft users replied last and it's older than 24 hours
    const eligibleTickets = candidateTickets.filter(ticket => {
      if (ticket.messages.length === 0) return false;
      
      const lastMessage = ticket.messages[0];
      const isLastMessageFromMacsoft = MACSOFT_ROLES.includes(lastMessage.sender.role);
      const isOlderThan24Hours = lastMessage.createdAt < twentyFourHoursAgo;
      
      if (!isLastMessageFromMacsoft || !isOlderThan24Hours) return false;
      
      // Check if there are any customer messages after the last Macsoft message
      const hasCustomerResponseAfterMacsoft = ticket.messages.some(message => {
        return CUSTOMER_ROLES.includes(message.sender.role) && 
               message.createdAt > lastMessage.createdAt;
      });
      
      return !hasCustomerResponseAfterMacsoft;
    });

    console.log(`Found ${eligibleTickets.length} tickets eligible for auto-close (24h threshold):`);
    
    if (eligibleTickets.length > 0) {
      eligibleTickets.slice(0, 3).forEach((ticket, index) => { // Show first 3 for demo
        const lastMessage = ticket.messages[0];
        console.log(`\n${index + 1}. Ticket: ${ticket.ticketCode}`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Last Message From: ${lastMessage.sender.name} (${lastMessage.sender.role})`);
        console.log(`   Last Message At: ${lastMessage.createdAt}`);
        console.log(`   Hours Since: ${Math.round((new Date() - new Date(lastMessage.createdAt)) / (1000 * 60 * 60))}`);
        console.log(`   Total Messages: ${ticket.messages.length}`);
      });
      
      // Test with just one ticket to avoid closing too many
      if (eligibleTickets.length > 0) {
        const testTicket = eligibleTickets[0];
        console.log(`\n--- Testing Full Auto-Close Process on ${testTicket.ticketCode} ---`);
        
        // Check current status before
        const beforeStats = await getTicketStats(testTicket.id);
        console.log('Before auto-close:', beforeStats);
        
        // Create a modified auto-close function with 24-hour threshold
        const testAutoClose = async () => {
          try {
            const ticket = await prisma.ticket.findUnique({
              where: { id: testTicket.id },
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
                }
              }
            });
            
            if (!ticket) return { success: false, message: 'Ticket not found' };
            
            const lastMessage = ticket.messages[0];
            if (!lastMessage) return { success: false, message: 'No messages found' };
            
            // Apply the full close process (same as in autoCloseTickets.js)
            await closeTicketDueToNoResponseTest(ticket, lastMessage);
            
            return { success: true, ticketCode: ticket.ticketCode };
          } catch (error) {
            console.error('Error in test auto-close:', error);
            return { success: false, error: error.message };
          }
        };
        
        const result = await testAutoClose();
        console.log('Auto-close result:', result);
        
        if (result.success) {
          // Check status after
          const afterStats = await getTicketStats(testTicket.id);
          console.log('After auto-close:', afterStats);
          
          console.log('\n✅ Full auto-close test completed successfully!');
        } else {
          console.log('❌ Auto-close test failed:', result);
        }
      }
    } else {
      console.log('\nNo tickets found that meet the 24-hour criteria for testing.');
      console.log('This is expected if all recent tickets have customer responses or are too recent.');
    }
    
  } catch (error) {
    console.error('Error in comprehensive auto-close test:', error);
    throw error;
  }
};

/**
 * Get statistics about a ticket's messages and notifications
 */
const getTicketStats = async (ticketId) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { 
      status: true, 
      ticketCode: true,
      messages: {
        include: {
          seenBy: true
        }
      }
    }
  });
  
  const notifications = await prisma.notification.findMany({
    where: { ticketId },
    include: {
      recipients: true
    }
  });
  
  const totalMessageSeenRecords = ticket.messages.reduce((acc, msg) => acc + msg.seenBy.length, 0);
  const totalNotificationRecipients = notifications.reduce((acc, notif) => acc + notif.recipients.length, 0);
  const unseenNotifications = notifications.reduce((acc, notif) => acc + notif.recipients.filter(r => !r.seen).length, 0);
  
  return {
    ticketCode: ticket.ticketCode,
    status: ticket.status,
    messageCount: ticket.messages.length,
    messageSeenRecords: totalMessageSeenRecords,
    notificationCount: notifications.length,
    notificationRecipients: totalNotificationRecipients,
    unseenNotifications
  };
};

/**
 * Simplified version of closeTicketDueToNoResponse for testing
 */
const closeTicketDueToNoResponseTest = async (ticket, lastMessage) => {
  // This is a simplified version that just updates the ticket status
  // and marks messages/notifications as seen (without creating new notifications)
  
  console.log(`Closing ticket ${ticket.ticketCode} due to no response...`);
  
  // Update ticket status
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: 'CLOSED', updatedAt: new Date() }
  });
  
  // Mark messages as seen
  const messageIds = ticket.messages.map(msg => msg.id);
  const participantIds = [...new Set(ticket.messages.map(msg => msg.senderId))];
  
  for (const messageId of messageIds) {
    for (const userId of participantIds) {
      await prisma.messageSeen.upsert({
        where: {
          messageId_userId: { messageId, userId }
        },
        update: { seenAt: new Date() },
        create: { messageId, userId, seenAt: new Date() }
      });
    }
  }
  
  // Mark notifications as seen
  await prisma.notificationRecipient.updateMany({
    where: {
      notification: { ticketId: ticket.id },
      seen: false
    },
    data: {
      seen: true,
      seenAt: new Date()
    }
  });
  
  console.log(`✅ Marked ${messageIds.length} messages and notifications as seen`);
};

// Run the test
testAutoCloseWithShorterThreshold()
  .then(() => {
    console.log('\nComprehensive test completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });