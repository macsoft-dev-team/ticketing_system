/**
 * Script: Close Inactive In-Progress Tickets
 *
 * Closes open/in-progress tickets with remark:
 * "Closed automatically due to inactivity" (or a custom remark).
 *
 * Usage:
 *   node server/scripts/close-inactive-tickets.js [options]
 *   or from within server directory:
 *   node scripts/close-inactive-tickets.js [options]
 *
 * Options:
 *   --hours=<number>     Inactivity threshold in hours (default: 48)
 *   --days=<number>      Inactivity threshold in days (e.g. --days=7)
 *   --all                Close ALL open/in-progress tickets regardless of inactivity duration
 *   --ticket=<code/id>   Close a specific ticket by ticket code or ID
 *   --remark="<text>"    Custom remark (default: "Closed automatically due to inactivity")
 *   --dry-run            Simulate and display tickets that would be closed without modifying database
 *   --help               Show help instructions
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { prisma } = require('../lib/clients');
const spareRequestService = require('../service/spareRequests');

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  hours: 48,
  all: false,
  dryRun: false,
  ticket: null,
  remark: 'Closed automatically due to inactivity',
};

for (const arg of args) {
  if (arg === '--help' || arg === '-h') {
    console.log(`
Usage: node server/scripts/close-inactive-tickets.js [options]

Options:
  --hours=<n>       Inactivity threshold in hours (default: 48)
  --days=<n>        Inactivity threshold in days (e.g. --days=2)
  --all             Close ALL open/in-progress tickets regardless of last activity
  --ticket=<code>   Close only the specified ticket code or ID
  --remark="<text>" Custom remark (default: "Closed automatically due to inactivity")
  --dry-run         Preview matching tickets without closing them
  --help, -h        Show this help message

Examples:
  node server/scripts/close-inactive-tickets.js --dry-run
  node server/scripts/close-inactive-tickets.js --hours=48
  node server/scripts/close-inactive-tickets.js --days=3
  node server/scripts/close-inactive-tickets.js --all --remark="Batch closed due to inactivity"
  node server/scripts/close-inactive-tickets.js --ticket=TCK-2026-001
`);
    process.exit(0);
  } else if (arg === '--all') {
    options.all = true;
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg.startsWith('--hours=')) {
    options.hours = parseFloat(arg.split('=')[1]);
  } else if (arg.startsWith('--days=')) {
    options.hours = parseFloat(arg.split('=')[1]) * 24;
  } else if (arg.startsWith('--ticket=')) {
    options.ticket = arg.split('=')[1].trim();
  } else if (arg.startsWith('--remark=')) {
    options.remark = arg.split('=')[1].trim();
  }
}

async function closeInactiveTickets() {
  const startTime = Date.now();
  console.log('='.repeat(70));
  console.log('  CLOSE INACTIVE IN-PROGRESS TICKETS SCRIPT');
  console.log('='.repeat(70));
  console.log(`Mode:            ${options.dryRun ? 'DRY RUN (Preview Only - No Changes)' : 'LIVE EXECUTION'}`);
  console.log(`Inactivity:      ${options.all ? 'ALL IN-PROGRESS TICKETS' : `>= ${options.hours} hour(s)`}`);
  console.log(`Remark:          "${options.remark}"`);
  if (options.ticket) {
    console.log(`Target Ticket:   ${options.ticket}`);
  }
  console.log('='.repeat(70));

  try {
    // 1. Identify system user to attribute closing to
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['MACSOFT_ADMIN', 'MACSOFT_HEAD'] } },
      select: { id: true, name: true, role: true }
    });
    const systemUserId = adminUser ? adminUser.id : 1;
    console.log(`System user for closure: ID ${systemUserId} (${adminUser?.name || 'System Administrator'})\n`);

    // 2. Fetch candidate tickets (all non-closed tickets)
    const ticketWhere = {
      status: { not: 'CLOSED' }
    };

    if (options.ticket) {
      if (!isNaN(options.ticket)) {
        ticketWhere.OR = [
          { id: parseInt(options.ticket, 10) },
          { ticketCode: options.ticket }
        ];
      } else {
        ticketWhere.ticketCode = options.ticket;
      }
    }

    const tickets = await prisma.ticket.findMany({
      where: ticketWhere,
      include: {
        createdByUser: {
          select: { id: true, name: true, role: true, centerCode: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, content: true, createdAt: true, senderId: true }
        },
        ticketMilestones: {
          orderBy: { order: 'desc' },
          take: 1,
          select: { id: true, stage: true, status: true, order: true, updatedAt: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${tickets.length} open/in-progress ticket(s) in database.`);

    const now = Date.now();
    const thresholdMs = options.hours * 60 * 60 * 1000;
    const candidates = [];

    for (const ticket of tickets) {
      // Determine latest activity time
      const latestMessageTime = ticket.messages?.[0]?.createdAt ? new Date(ticket.messages[0].createdAt).getTime() : 0;
      const latestMilestoneTime = ticket.ticketMilestones?.[0]?.updatedAt ? new Date(ticket.ticketMilestones[0].updatedAt).getTime() : 0;
      const ticketUpdatedTime = ticket.updatedAt ? new Date(ticket.updatedAt).getTime() : 0;
      const ticketCreatedTime = ticket.createdAt ? new Date(ticket.createdAt).getTime() : 0;

      const lastActivityTimestamp = Math.max(
        latestMessageTime,
        latestMilestoneTime,
        ticketUpdatedTime,
        ticketCreatedTime
      );

      const inactiveDurationHours = ((now - lastActivityTimestamp) / (1000 * 60 * 60)).toFixed(1);

      if (options.all || (now - lastActivityTimestamp) >= thresholdMs) {
        candidates.push({
          ticket,
          lastActivityTime: new Date(lastActivityTimestamp),
          inactiveDurationHours,
          currentStage: ticket.ticketMilestones?.[0]?.stage || 'UNKNOWN'
        });
      }
    }

    console.log(`Identified ${candidates.length} ticket(s) matching inactivity criteria.\n`);

    if (candidates.length === 0) {
      console.log('No tickets qualify for closure under the specified parameters.');
      return;
    }

    let closedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < candidates.length; i++) {
      const { ticket, lastActivityTime, inactiveDurationHours, currentStage } = candidates[i];
      const indexStr = `[${i + 1}/${candidates.length}]`;
      const ticketInfo = `${ticket.ticketCode} (ID: ${ticket.id}) - Stage: ${currentStage} - Inactive for: ${inactiveDurationHours}h`;

      if (options.dryRun) {
        console.log(`${indexStr} [DRY RUN] Would close: ${ticketInfo}`);
        continue;
      }

      console.log(`${indexStr} Closing: ${ticketInfo}...`);

      try {
        await prisma.$transaction(async (tx) => {
          // A. Cancel any pending or approved spare requests
          try {
            await spareRequestService.bulkCancelSpareRequestsByTicket(
              ticket.ticketCode,
              systemUserId,
              options.remark
            );
          } catch (spareErr) {
            console.warn(`    ⚠️  Spare cancellation notice for ${ticket.ticketCode}: ${spareErr.message}`);
          }

          // B. Complete all active milestones
          await tx.ticketMilestone.updateMany({
            where: {
              ticketId: ticket.id,
              status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] }
            },
            data: {
              status: 'DONE',
              completedAt: new Date(),
              notes: `[Closure] ${options.remark}`
            }
          });

          // C. Get the highest milestone order
          const lastMilestone = await tx.ticketMilestone.findFirst({
            where: { ticketId: ticket.id },
            orderBy: { order: 'desc' }
          });
          const nextOrder = lastMilestone ? lastMilestone.order + 1 : 15;

          // D. Create TICKET_CLOSED milestone
          await tx.ticketMilestone.create({
            data: {
              ticketId: ticket.id,
              stage: 'TICKET_CLOSED',
              order: nextOrder,
              description: 'Ticket automatically closed due to inactivity',
              status: 'DONE',
              startedAt: new Date(),
              completedAt: new Date(),
              changedBy: systemUserId,
              notes: options.remark
            }
          });

          // E. Update ticket status to CLOSED
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: 'CLOSED',
              updatedAt: new Date()
            }
          });

          // F. Add conversation message
          await tx.message.create({
            data: {
              content: options.remark,
              senderId: systemUserId,
              ticketId: ticket.id
            }
          });

          // G. Notification for ticket creator
          if (ticket.createdBy) {
            await tx.notification.create({
              data: {
                title: 'Ticket Closed Due to Inactivity',
                description: `Ticket ${ticket.ticketCode} has been closed: ${options.remark}`,
                type: 'TICKET_CLOSED',
                createdById: systemUserId,
                recipients: {
                  create: {
                    userId: ticket.createdBy,
                    seen: false
                  }
                }
              }
            });
          }
        });

        console.log(`    ✅ Successfully closed ${ticket.ticketCode}`);
        closedCount++;
      } catch (err) {
        console.error(`    ❌ Failed to close ${ticket.ticketCode}: ${err.message}`);
        failedCount++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('  EXECUTION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Evaluated:  ${tickets.length} tickets`);
    console.log(`Targeted:   ${candidates.length} tickets`);
    if (options.dryRun) {
      console.log(`Simulated:  ${candidates.length} tickets would be closed (Dry Run)`);
    } else {
      console.log(`Closed:     ${closedCount} tickets successfully closed`);
      console.log(`Failed:     ${failedCount} tickets`);
    }
    console.log(`Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.log('='.repeat(70));
  } catch (err) {
    console.error('Fatal error during execution:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

closeInactiveTickets();
