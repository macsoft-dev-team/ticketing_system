/**
 * Test script for buzzer alerts functionality
 * Run with: node scripts/test-buzzer-alerts.js
 */

require('dotenv').config();
const { checkPendingCustomerMessages, getCandidateTicketsForBuzzer } = require('../jobs/buzzerAlerts');

async function testBuzzerAlerts() {
  try {
    console.log('=== Testing Buzzer Alerts Functionality ===\n');
    
    // First, check for candidate tickets
    console.log('1. Checking for candidate tickets for buzzer alerts...');
    const candidates = await getCandidateTicketsForBuzzer();
    
    console.log(`Found ${candidates.length} candidate tickets for buzzer alerts:`);
    
    if (candidates.length > 0) {
      candidates.forEach((ticket, index) => {
        const lastMessage = ticket.messages[0];
        console.log(`\n${index + 1}. Ticket: ${ticket.ticketCode}`);
        console.log(`   Customer: ${ticket.customerName}`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Description: ${ticket.description.substring(0, 100)}...`);
        console.log(`   Last Message From: ${lastMessage.sender.name} (${lastMessage.sender.role})`);
        console.log(`   Last Message At: ${lastMessage.createdAt}`);
        console.log(`   Hours Since Last Message: ${Math.round((new Date() - new Date(lastMessage.createdAt)) / (1000 * 60 * 60))}`);
        console.log(`   Message Preview: ${lastMessage.content.substring(0, 150)}...`);
      });
    } else {
      console.log('No tickets found that meet the buzzer alert criteria.');
    }
    
    // Run the buzzer alerts check (without io for testing)
    console.log('\n2. Running buzzer alerts check...');
    const result = await checkPendingCustomerMessages(null); // null io means no actual buzzer alerts sent
    
    console.log('\n=== Buzzer Alerts Check Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Pending Tickets Count: ${result.pendingCount}`);
    
    if (result.tickets && result.tickets.length > 0) {
      console.log('\nTickets needing Macsoft response:');
      result.tickets.forEach((ticket, index) => {
        console.log(`\n${index + 1}. ${ticket.ticketCode}`);
        console.log(`   Customer: ${ticket.customerName}`);
        console.log(`   Service Center: ${ticket.serviceCenter}`);
        console.log(`   Last Message From: ${ticket.lastMessageFrom}`);
        console.log(`   Hours Since: ${ticket.hoursSinceLastMessage}`);
      });
      
      console.log('\n🚨 These tickets would trigger buzzer alerts to Macsoft users!');
    } else {
      console.log('\nNo tickets need immediate Macsoft response.');
    }
    
    // Show what the buzzer alert would look like
    if (result.pendingCount > 0) {
      console.log('\n=== Sample Buzzer Alert Data ===');
      const sampleBuzzerAlert = {
        type: 'CUSTOMER_RESPONSE_PENDING',
        urgency: 'HIGH',
        title: 'Customer Messages Pending Response',
        message: `${result.pendingCount} tickets have customer messages waiting for Macsoft response (3+ hours)`,
        actionRequired: 'Please respond to pending customer messages',
        sound: {
          enabled: true,
          type: 'urgent',
          duration: 5000,
          repeat: 3
        },
        tickets: result.tickets.slice(0, 3) // Show first 3 for demo
      };
      
      console.log(JSON.stringify(sampleBuzzerAlert, null, 2));
    }
    
  } catch (error) {
    console.error('Error testing buzzer alerts functionality:', error);
  }
}

// Test with shorter time threshold for demo purposes
async function testWithShorterThreshold() {
  console.log('\n=== Testing with 5-Minute Threshold (for demo) ===\n');
  
  try {
    const { prisma } = require('../lib/clients');
    
    // Use 5 minutes instead of 3 hours for testing
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000));
    
    const CUSTOMER_ROLES = [
      'CUSTOMER_SERVICE_HEAD',
      'SERVICE_CENTER_TECHNICIAN',
      'CUSTOMER_FIELD_ENGINEER'
    ];
    
    const MACSOFT_ROLES = [
      'MACSOFT_ADMIN',
      'MACSOFT_HEAD', 
      'MACSOFT_SUPPORT'
    ];
    
    // Find tickets with customer messages in last 5 minutes
    const recentTickets = await prisma.ticket.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        messages: {
          some: {
            createdAt: { gte: fiveMinutesAgo },
            sender: { role: { in: CUSTOMER_ROLES } }
          }
        }
      },
      include: {
        messages: {
          include: {
            sender: { select: { id: true, role: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    console.log(`Found ${recentTickets.length} tickets with customer messages in the last 5 minutes`);
    
    const pendingTickets = recentTickets.filter(ticket => {
      const lastMessage = ticket.messages[0];
      if (!lastMessage || !CUSTOMER_ROLES.includes(lastMessage.sender.role)) return false;
      
      // Check if there's a Macsoft response after the customer message
      const hasMacsoftResponse = ticket.messages.some(msg => 
        MACSOFT_ROLES.includes(msg.sender.role) && msg.createdAt > lastMessage.createdAt
      );
      
      return !hasMacsoftResponse;
    });
    
    console.log(`${pendingTickets.length} of these tickets need Macsoft response:`);
    
    pendingTickets.forEach((ticket, index) => {
      const lastMessage = ticket.messages[0];
      const minutesSince = Math.round((new Date() - lastMessage.createdAt) / (1000 * 60));
      const secondsSince = Math.round((new Date() - lastMessage.createdAt) / 1000);
      
      console.log(`\n${index + 1}. ${ticket.ticketCode}`);
      console.log(`   Customer: ${ticket.customerName}`);
      console.log(`   Last Customer Message: ${lastMessage.createdAt}`);
      console.log(`   From: ${lastMessage.sender.name}`);
      console.log(`   Time Since: ${minutesSince > 0 ? `${minutesSince} minutes` : `${secondsSince} seconds`}`);
      console.log(`   Message Preview: ${lastMessage.content ? lastMessage.content.substring(0, 100) : 'No content'}...`);
    });
    
  } catch (error) {
    console.error('Error in shorter threshold test:', error);
  }
}

// Run the tests
testBuzzerAlerts()
  .then(() => testWithShorterThreshold())
  .then(() => {
    console.log('\nBuzzer alerts test completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });