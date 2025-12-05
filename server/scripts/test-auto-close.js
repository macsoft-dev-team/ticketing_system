/**
 * Test script for the auto-close tickets functionality
 * Run with: node scripts/test-auto-close.js
 */

require('dotenv').config();
const { autoCloseTickets, getCandidateTicketsForClosure } = require('../jobs/autoCloseTickets');

async function testAutoClose() {
  try {
    console.log('=== Testing Auto-Close Tickets Functionality ===\n');
    
    // First, check for candidate tickets
    console.log('1. Checking for candidate tickets...');
    const candidates = await getCandidateTicketsForClosure();
    
    console.log(`Found ${candidates.length} candidate tickets for auto-closure:`);
    
    if (candidates.length > 0) {
      candidates.forEach((ticket, index) => {
        const lastMessage = ticket.messages[0];
        console.log(`\n${index + 1}. Ticket: ${ticket.ticketCode}`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Description: ${ticket.description.substring(0, 100)}...`);
        console.log(`   Last Message From: ${lastMessage.sender.name} (${lastMessage.sender.role})`);
        console.log(`   Last Message At: ${lastMessage.createdAt}`);
        console.log(`   Hours Since Last Message: ${Math.round((new Date() - new Date(lastMessage.createdAt)) / (1000 * 60 * 60))}`);
      });
    } else {
      console.log('No tickets found that meet the auto-closure criteria.');
    }
    
    // Ask for confirmation before proceeding
    console.log('\n2. Running auto-close job...');
    const result = await autoCloseTickets();
    
    console.log('\n=== Auto-Close Job Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Tickets Closed: ${result.closedCount}`);
    
    if (result.closedCount > 0) {
      console.log('\nTickets were successfully auto-closed. Check the application for notifications.');
    } else {
      console.log('\nNo tickets were closed in this run.');
    }
    
  } catch (error) {
    console.error('Error testing auto-close functionality:', error);
  }
}

// Run the test
testAutoClose()
  .then(() => {
    console.log('\nTest completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });