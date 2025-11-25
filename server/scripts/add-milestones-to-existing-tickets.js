/**
 * Migration Script: Add Milestones to Existing Tickets
 * 
 * This script creates milestone records for all existing tickets
 * that don't have milestones yet.
 * 
 * Usage: node scripts/add-milestones-to-existing-tickets.js
 */

const { prisma } = require('../lib/clients');
const { createInitialMilestones } = require('../service/milestones');

async function addMilestonesToExistingTickets() {
  try {
    // Get all tickets
    const tickets = await prisma.ticket.findMany({
      include: {
        ticketMilestones: true,
        createdByUser: true,
      },
    });

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const ticket of tickets) {
      try {
        // Check if ticket already has milestones
        if (ticket.ticketMilestones && ticket.ticketMilestones.length > 0) {
           skippedCount++;
          continue;
        }

        // Create milestones for this ticket
         await createInitialMilestones(ticket.id, ticket.createdBy);
         migratedCount++;
      } catch (error) {
         errorCount++;
      }
    }

   } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addMilestonesToExistingTickets()
  .then(() => {
     process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
