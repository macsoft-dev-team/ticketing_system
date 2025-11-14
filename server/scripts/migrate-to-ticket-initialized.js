const { PrismaClient } = require('../prisma/generated/prisma/client');

const prisma = new PrismaClient();

async function migrateToTicketInitialized() {
  try {
    console.log('🔄 Starting migration to add TICKET_INITIALIZED stage...');

    // Find all tickets that have REQUEST_SUBMISSION as their first milestone
    const ticketsWithRequestSubmission = await prisma.ticket.findMany({
      include: {
        ticketMilestones: {
          where: {
            stage: 'REQUEST_SUBMISSION',
            order: 1
          }
        }
      }
    });

    console.log(`📋 Found ${ticketsWithRequestSubmission.length} tickets to migrate`);

    for (const ticket of ticketsWithRequestSubmission) {
      if (ticket.ticketMilestones.length > 0) {
        const requestSubmissionMilestone = ticket.ticketMilestones[0];
        
        // Update the REQUEST_SUBMISSION milestone to order 1 (from 0)
        await prisma.ticketMilestone.update({
          where: { id: requestSubmissionMilestone.id },
          data: { 
            order: 1,
            notes: 'Ticket has been submitted for processing' 
          }
        });

        // Create a new TICKET_INITIALIZED milestone with order 0
        await prisma.ticketMilestone.create({
          data: {
            ticketId: ticket.id,
            stage: 'TICKET_INITIALIZED',
            order: 0,
            status: 'DONE', // This stage is automatically completed
            startedAt: ticket.createdAt, // Use ticket creation time
            completedAt: ticket.createdAt, // Immediately completed
            changedBy: ticket.createdBy,
            notes: 'Ticket has been created and initialized in the system',
            photoRequired: false,
          }
        });

        console.log(`✅ Migrated ticket ${ticket.ticketCode}`);
      }
    }

    console.log('🎉 Migration completed successfully!');
    
    // Update all other milestones' orders to account for the new first stage
    console.log('🔄 Updating milestone orders...');
    
    // Increment all milestone orders by 1 to make room for TICKET_INITIALIZED at order 0
    await prisma.$executeRaw`
      UPDATE ticketmilestone 
      SET \`order\` = \`order\` + 1 
      WHERE stage != 'TICKET_INITIALIZED' AND \`order\` < 99
    `;

    console.log('✅ All milestone orders updated!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateToTicketInitialized()
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToTicketInitialized };