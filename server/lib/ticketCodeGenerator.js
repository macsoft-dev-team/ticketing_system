const { prisma } = require("./clients");

/**
 * Generates a unique ticket code with auto-increment functionality
 * Format: PREFIX-YEAR-SEQUENCE (e.g., TKT-2025-001)
 * @param {string} prefix - Optional prefix for the ticket code (default: "TKT")
 * @param {string} suffix - Optional suffix for the ticket code
 * @returns {Promise<string>} - Generated ticket code
 */
const generateTicketCode = async (prefix = "TKT", suffix = "") => {
  const currentYear = new Date().getFullYear();
  
  try {
    // Use transaction to ensure atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Find or create sequence record for current year
      let sequence = await tx.ticketSequence.findUnique({
        where: { year: currentYear }
      });

      if (!sequence) {
        // Create new sequence for the year
        sequence = await tx.ticketSequence.create({
          data: {
            year: currentYear,
            lastNumber: 1,
            prefix: prefix
          }
        });
      } else {
        // Increment the sequence
        sequence = await tx.ticketSequence.update({
          where: { year: currentYear },
          data: { 
            lastNumber: { increment: 1 },
            prefix: prefix // Update prefix if different
          }
        });
      }

      // Format the ticket code
      const paddedNumber = String(sequence.lastNumber).padStart(3, '0');
      const ticketCode = suffix 
        ? `${prefix}-${currentYear}-${paddedNumber}-${suffix}`
        : `${prefix}-${currentYear}-${paddedNumber}`;

      return ticketCode;
    });

    return result;
  } catch (error) {
    console.error('Error generating ticket code:', error);
    throw new Error('Failed to generate ticket code');
  }
};

/**
 * Gets the next ticket number for a given year without incrementing
 * @param {number} year - Year to check (default: current year)
 * @returns {Promise<number>} - Next ticket number
 */
const getNextTicketNumber = async (year = new Date().getFullYear()) => {
  try {
    const sequence = await prisma.ticketSequence.findUnique({
      where: { year: year }
    });

    return sequence ? sequence.lastNumber + 1 : 1;
  } catch (error) {
    console.error('Error getting next ticket number:', error);
    throw new Error('Failed to get next ticket number');
  }
};

/**
 * Gets ticket statistics for a given year
 * @param {number} year - Year to get stats for (default: current year)
 * @returns {Promise<object>} - Ticket statistics
 */
const getTicketStats = async (year = new Date().getFullYear()) => {
  try {
    const sequence = await prisma.ticketSequence.findUnique({
      where: { year: year }
    });

    const totalTickets = await prisma.ticket.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    });

    return {
      year,
      lastNumber: sequence?.lastNumber || 0,
      totalTickets,
      prefix: sequence?.prefix || "TKT"
    };
  } catch (error) {
    console.error('Error getting ticket stats:', error);
    throw new Error('Failed to get ticket stats');
  }
};

/**
 * Updates the prefix for ticket codes (applies to new tickets)
 * @param {string} newPrefix - New prefix to use
 * @param {number} year - Year to update (default: current year)
 * @returns {Promise<object>} - Updated sequence record
 */
const updateTicketPrefix = async (newPrefix, year = new Date().getFullYear()) => {
  try {
    const sequence = await prisma.ticketSequence.upsert({
      where: { year: year },
      update: { prefix: newPrefix },
      create: {
        year: year,
        lastNumber: 0,
        prefix: newPrefix
      }
    });

    return sequence;
  } catch (error) {
    console.error('Error updating ticket prefix:', error);
    throw new Error('Failed to update ticket prefix');
  }
};

module.exports = {
  generateTicketCode,
  getNextTicketNumber,
  getTicketStats,
  updateTicketPrefix
};