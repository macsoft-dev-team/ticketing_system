const { prisma } = require('../lib/clients');
const { generateTicketCode } = require('../lib/ticketCodeGenerator');

/**
 * Migration script to update existing tickets that might not have proper ticket codes
 * and initialize the TicketSequence table
 */
async function migrateExistingTickets() {
  console.log('🔄 Starting ticket code migration...');

  try {
    // First, initialize the sequence table for current year if needed
    const currentYear = new Date().getFullYear();
    
    // Check if sequence exists for current year
    let sequence = await prisma.ticketSequence.findUnique({
      where: { year: currentYear }
    });

    if (!sequence) {
      // Count existing tickets for this year to set proper starting number
      const existingTicketsThisYear = await prisma.ticket.count({
        where: {
          createdAt: {
            gte: new Date(`${currentYear}-01-01`),
            lt: new Date(`${currentYear + 1}-01-01`)
          }
        }
      });

      sequence = await prisma.ticketSequence.create({
        data: {
          year: currentYear,
          lastNumber: existingTicketsThisYear,
          prefix: 'TKT'
        }
      });

      console.log(`✅ Created sequence for ${currentYear} starting at ${existingTicketsThisYear}`);
    }

    // Check if there are any existing tickets and update them if needed
    const totalTickets = await prisma.ticket.count();
    
    if (totalTickets > 0) {
      console.log(`📋 Found ${totalTickets} existing tickets`);
      
      // For now, we'll just log that tickets exist
      // If you have existing tickets without proper codes, you can manually check and update them
      console.log('ℹ️ If any existing tickets need ticket code updates, please run a separate data fix');
    } else {
      console.log('📋 No existing tickets found - starting fresh!');
    }

    // Show final statistics
    const allSequences = await prisma.ticketSequence.findMany({
      orderBy: { year: 'desc' }
    });

    console.log('\n📊 Final Ticket Sequence Statistics:');
    for (const seq of allSequences) {
      console.log(`  ${seq.year}: ${seq.prefix}-${seq.year}-${String(seq.lastNumber).padStart(3, '0')} (${seq.lastNumber} tickets)`);
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateExistingTickets()
    .then(() => {
      console.log('🎉 Migration script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateExistingTickets };