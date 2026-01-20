const { prisma } = require("../lib/clients");
const { archiveTicketData } = require("../service/tickets");

/**
 * Archive closed tickets that haven't been archived yet
 * This runs as a background job to avoid blocking the main thread
 */
const archiveClosedTickets = async () => {
  try {
    console.log("Starting ticket archival job...");

    // Find all closed tickets that don't have backup data yet
    const ticketsToArchive = await prisma.ticket.findMany({
      where: {
        status: "CLOSED", 
      },
      select: {
        id: true,
        ticketCode: true,
        updatedAt: true,
      },
      take: 50, // Process in batches of 50 to avoid overwhelming the system
    });

    if (ticketsToArchive.length === 0) {
      console.log("No closed tickets found for archiving");
      return {
        success: true,
        processed: 0,
        message: "No tickets to archive",
      };
    }

    console.log(`Found ${ticketsToArchive.length} closed tickets to archive`);

    const results = {
      successful: [],
      failed: [],
    };

    // Process each ticket
    for (const ticket of ticketsToArchive) {
      try {
        console.log(`Archiving ticket ${ticket.ticketCode}...`);
        await archiveTicketData(ticket.id);
        results.successful.push(ticket.ticketCode);
        console.log(`Successfully archived ticket ${ticket.ticketCode}`);
      } catch (error) {
        console.error(`Failed to archive ticket ${ticket.ticketCode}:`, error.message);
        results.failed.push({
          ticketCode: ticket.ticketCode,
          error: error.message,
        });
      }
    }

    console.log(
      `Archival job completed. Success: ${results.successful.length}, Failed: ${results.failed.length}`
    );

    return {
      success: true,
      processed: ticketsToArchive.length,
      successful: results.successful,
      failed: results.failed,
    };
  } catch (error) {
    console.error("Error in archival job:", error);
    throw error;
  }
};

/**
 * Get list of closed tickets that need archiving
 */
const getCandidateTicketsForArchival = async () => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        status: "CLOSED", 
      },
      select: {
        id: true,
        ticketCode: true,
        customerName: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "asc", // Oldest closed tickets first
      },
    });

    return tickets;
  } catch (error) {
    console.error("Error fetching candidate tickets for archival:", error);
    throw error;
  }
};

/**
 * Archive a specific ticket by ID (for manual triggers)
 */
const archiveTicketById = async (ticketId) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketCode: true,
        status: true,
        backupurl: true,
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.status !== "CLOSED") {
      throw new Error("Can only archive closed tickets");
    }

    // Allow re-archiving (in case of updates or fixes)
    await archiveTicketData(ticket.id);

    return {
      success: true,
      ticketCode: ticket.ticketCode,
      message: ticket.backupurl 
        ? "Ticket re-archived successfully" 
        : "Ticket archived successfully",
    };
  } catch (error) {
    console.error(`Error archiving ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Archive tickets older than a specific date
 */
const archiveTicketsOlderThan = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    console.log(`Archiving closed tickets older than ${daysOld} days (before ${cutoffDate.toISOString()})`);

    const ticketsToArchive = await prisma.ticket.findMany({
      where: {
        status: "CLOSED",
        backupurl: null,
        updatedAt: {
          lt: cutoffDate,
        },
      },
      select: {
        id: true,
        ticketCode: true,
        updatedAt: true,
      },
      take: 100, // Process in batches
    });

    if (ticketsToArchive.length === 0) {
      console.log(`No closed tickets older than ${daysOld} days found for archiving`);
      return {
        success: true,
        processed: 0,
        message: "No old tickets to archive",
      };
    }

    console.log(`Found ${ticketsToArchive.length} old closed tickets to archive`);

    const results = {
      successful: [],
      failed: [],
    };

    for (const ticket of ticketsToArchive) {
      try {
        await archiveTicketData(ticket.id);
        results.successful.push(ticket.ticketCode);
      } catch (error) {
        console.error(`Failed to archive ticket ${ticket.ticketCode}:`, error.message);
        results.failed.push({
          ticketCode: ticket.ticketCode,
          error: error.message,
        });
      }
    }

    console.log(
      `Old ticket archival completed. Success: ${results.successful.length}, Failed: ${results.failed.length}`
    );

    return {
      success: true,
      processed: ticketsToArchive.length,
      daysOld,
      successful: results.successful,
      failed: results.failed,
    };
  } catch (error) {
    console.error("Error in old ticket archival:", error);
    throw error;
  }
};

module.exports = {
  archiveClosedTickets,
  getCandidateTicketsForArchival,
  archiveTicketById,
  archiveTicketsOlderThan,
};
