/**
 * Test script for the auto-close tickets functionality
 * Run with: node scripts/test-auto-close.js
 */

require('dotenv').config();
const { autoCloseTickets, getCandidateTicketsForClosure } = require('../jobs/autoCloseTickets');

async function testAutoClose() {
  try {
     
     const candidates = await getCandidateTicketsForClosure();
    
     
    if (candidates.length > 0) {
      candidates.forEach((ticket, index) => {
        const lastMessage = ticket.messages[0];
       });
    } else {
      console.log('No tickets found that meet the auto-closure criteria.');
    }
    
    // Ask for confirmation before proceeding
     const result = await autoCloseTickets();
    
     
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