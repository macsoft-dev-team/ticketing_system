/**
 * Test script specifically for message/notification marking functionality
 * This uses a shorter time threshold for testing purposes
 */

require('dotenv').config();
const { prisma } = require('../lib/clients');
const {
  createNotification,
  saveAndBroadcastNotification,
  NOTIFICATION_TYPES,
} = require('../lib/notificationUtils');

// Define role categories for testing
const MACSOFT_ROLES = [
  'MACSOFT_ADMIN',
  'MACSOFT_HEAD', 
  'MACSOFT_SUPPORT'
];

const CUSTOMER_ROLES = [
  'CUSTOMER_SERVICE_HEAD',
  'SERVICE_CENTER_TECHNICIAN',
  'CUSTOMER_FIELD_ENGINEER'
];

/**
 * Test the message and notification marking functionality
 */
const testMessageNotificationMarking = async () => {
  try {
    console.log('=== Testing Message/Notification Marking Functionality ===\n');
    
    // Use 24 hours instead of 48 for testing
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    // Find one open ticket that has messages for testing
    const testTicket = await prisma.ticket.findFirst({
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
            },
            seenBy: true
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

    if (!testTicket || testTicket.messages.length === 0) {
      console.log('No suitable test ticket found with messages.');
      return;
    }

    console.log(`Testing with ticket: ${testTicket.ticketCode}`);
    console.log(`Messages in ticket: ${testTicket.messages.length}`);
    
    // Check current seen status
    const messageSeenCounts = await Promise.all(
      testTicket.messages.map(async (message) => {
        const seenCount = await prisma.messageSeen.count({
          where: { messageId: message.id }
        });
        return { messageId: message.id, seenCount };
      })
    );
    
    console.log('Current message seen counts:', messageSeenCounts);
    
    // Check notification status for this ticket
    const ticketNotifications = await prisma.notification.findMany({
      where: { ticketId: testTicket.id },
      include: {
        recipients: {
          where: { seen: false }
        }
      }
    });
    
    console.log(`Notifications for ticket: ${ticketNotifications.length}`);
    console.log(`Unseen notification recipients: ${ticketNotifications.reduce((acc, n) => acc + n.recipients.length, 0)}`);
    
    // Now test the marking functionality
    console.log('\n--- Testing Message/Notification Marking ---');
    
    // Get all participants
    const participantIds = [...new Set(testTicket.messages.map(msg => msg.senderId))];
    const messageIds = testTicket.messages.map(msg => msg.id);
    
    console.log(`Participants: ${participantIds.length}`);
    console.log(`Messages to mark: ${messageIds.length}`);
    
    // Mark messages as seen
    for (const messageId of messageIds) {
      for (const userId of participantIds) {
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
    
    console.log(`✅ Marked ${messageIds.length} messages as seen for ${participantIds.length} participants`);
    
    // Mark notifications as seen
    await prisma.notificationRecipient.updateMany({
      where: {
        notificationId: { in: ticketNotifications.map(n => n.id) },
        seen: false
      },
      data: {
        seen: true,
        seenAt: new Date()
      }
    });
    
    const updatedUnseenCount = await prisma.notificationRecipient.count({
      where: {
        notificationId: { in: ticketNotifications.map(n => n.id) },
        seen: false
      }
    });
    
    console.log(`✅ Marked notifications as seen. Remaining unseen: ${updatedUnseenCount}`);
    
    // Verify the results
    const finalSeenCounts = await Promise.all(
      messageIds.map(async (messageId) => {
        const seenCount = await prisma.messageSeen.count({
          where: { messageId }
        });
        return { messageId, seenCount };
      })
    );
    
    console.log('\nFinal message seen counts:', finalSeenCounts);
    console.log('\n✅ Message/Notification marking test completed successfully!');
    
  } catch (error) {
    console.error('Error testing message/notification marking:', error);
    throw error;
  }
};

// Run the test
testMessageNotificationMarking()
  .then(() => {
    console.log('\nTest completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });