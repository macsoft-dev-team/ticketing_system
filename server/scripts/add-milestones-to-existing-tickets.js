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
  console.log('🚀 Starting milestone migration...\n');

  try {
    // Get all tickets
    const tickets = await prisma.ticket.findMany({
      include: {
        ticketMilestones: true,
        createdByUser: true,
      },
    });

    console.log(`📊 Found ${tickets.length} total tickets\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const ticket of tickets) {
      try {
        // Check if ticket already has milestones
        if (ticket.ticketMilestones && ticket.ticketMilestones.length > 0) {
          console.log(`⏭️  Skipping ${ticket.ticketCode} - already has ${ticket.ticketMilestones.length} milestones`);
          skippedCount++;
          continue;
        }

        // Create milestones for this ticket
        console.log(`✨ Creating milestones for ${ticket.ticketCode}...`);
        await createInitialMilestones(ticket.id, ticket.createdBy);
        console.log(`✅ Created milestones for ${ticket.ticketCode}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error creating milestones for ${ticket.ticketCode}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Migrated:  ${migratedCount} tickets`);
    console.log(`⏭️  Skipped:   ${skippedCount} tickets (already have milestones)`);
    console.log(`❌ Errors:    ${errorCount} tickets`);
    console.log(`📊 Total:     ${tickets.length} tickets`);
    console.log('='.repeat(60) + '\n');

    console.log('✨ Migration completed successfully!\n');
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
    console.log('👋 Goodbye!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
