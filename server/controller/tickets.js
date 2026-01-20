const ticketService = require("../service/tickets");
const jobScheduler = require("../jobs/scheduler");
const { 
  archiveTicketById,
  getCandidateTicketsForArchival 
} = require("../jobs/archiveTickets");
const fs = require("fs");

/**
 * Utility function to read backup JSON from file path
 */
const readBackupFromFile = async (backupUrl) => {
  try {
    if (!backupUrl || !fs.existsSync(backupUrl)) {
      return null;
    }
    const jsonData = fs.readFileSync(backupUrl, "utf8");
    return JSON.parse(jsonData);
  } catch (error) {
    console.error("Error reading backup JSON from file:", error);
    return null;
  }
};

const getTickets = async (req, res) => {
  try {
    const { id } = req.user;
    const { role } = req.user;
    const { skip, take, filter } = req.query;
    
    // Parse filter if it's a JSON string
    let parsedFilter = filter;
    if (filter && typeof filter === 'string') {
      try {
        parsedFilter = JSON.parse(filter);
      } catch (e) {
        console.warn('Failed to parse filter JSON:', e);
        parsedFilter = filter;
      }
    }
    
    const { tickets, count, statusCount } = await ticketService.getTickets(
      skip,
      take,
      parsedFilter,
      id,
      role
    );
    const _transformTickets = tickets.map(ticket => {
      return {
        ...ticket,
        state: ticket.state?.name || "NEW",
        selectedDistrict: ticket.selectedDistrict?.name || "UNKNOWN",
       };
    });
    res.status(200).json({
      tickets: _transformTickets,
      totalPages: Math.ceil(count / take),
      currentPage: parseInt(skip) || 1,
      statusCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTicketById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  try {
    const ticket = await ticketService.getTicketById(parseInt(id), userId, userRole);

    ticket.state = ticket.state?.name || "NEW";
    ticket.selectedDistrict = ticket.selectedDistrict?.name || "UNKNOWN";
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.status(200).json(ticket);
  } catch (error) {
    // Check if it's an access denied error
    if (error.message.startsWith("Access denied:")) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

const createTicket = async (req, res) => {
  const ticket = req.body;
  const files = req.files; // Array of uploaded files
  const userId = req.user.id;
  const io = req.io;

  try {
    // Process uploaded files if any
    let attachments = [];
    if (files && files.length > 0) {
      attachments = files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      }));
    }

    const newTicket = await ticketService.createTicket(
      ticket,
      userId,
      io,
      attachments
    );
    

    
    res.status(201).json(newTicket);
  } catch (error) {
     res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

const updateTicket = async (req, res) => {
  const { id } = req.params;
  const { ticket } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  const io = req.io;
  try {
    const updatedTicket = await ticketService.updateTicket(
      parseInt(id),
      ticket,
      userId,
      io,
      userRole
    );
    res.status(200).json(updatedTicket);
  } catch (error) {
    // Check if it's an access denied error
    if (error.message.startsWith("Access denied:")) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  const io = req.io;
  try {
    const updatedTicket = await ticketService.updateStatus(
      parseInt(id),
      status,
      userId,
      io,
      userRole
    );
    res.status(200).json(updatedTicket);
  } catch (error) {
    // Check if it's an access denied error
    if (error.message.startsWith("Access denied:")) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteTicket = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const io = req.io;
  try {
    const deletedTicket = await ticketService.deleteTicket(
      parseInt(id),
      userId,
      io,
      userRole
    );
    if (!deletedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    // Check if it's an access denied error
    if (error.message.startsWith("Access denied:")) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

const searchByControllerNumber = async (req, res) => {
  try {
    const { controllerNo } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ticket = await ticketService.searchByControllerNumber(
      controllerNo,
      userId,
      userRole
    );

    if (!ticket) {
      return res.status(404).json({ 
        message: "No ticket found with this controller number to receive at service center",
        controllerNo 
      });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

const searchTickets = async (req, res) => {
  try {
    const { keyword } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!keyword || !keyword.trim()) {
      return res.status(400).json({
        message: "Search keyword is required",
        error: "Please provide a search keyword"
      });
    }

    const tickets = await ticketService.searchTickets(
      keyword.trim(),
      userId,
      userRole
    );

    res.status(200).json({
      tickets,
      message: `Found ${tickets.length} tickets matching "${keyword}"`
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

const checkActiveTicketForController = async (req, res) => {
  try {
    const { controllerNo } = req.params;
    
    if (!controllerNo) {
      return res.status(400).json({ 
        message: "Controller number is required",
        error: "Controller number is required"
      });
    }

    const result = await ticketService.checkActiveTicketForController(controllerNo);
    
    if (result.hasActiveTicket) {
      return res.status(400).json({
        message: "Active ticket exists",
        error: `Active ticket already exists for controller ${controllerNo}. ` +
               `Please make sure to close ticket ${result.activeTicket.ticketCode} (Status: ${result.activeTicket.status}) ` +
               `before creating a new one. Created on ${new Date(result.activeTicket.createdAt).toLocaleDateString()}.`,
        activeTicket: result.activeTicket
      });
    }

    res.status(200).json({
      message: "No active ticket found",
      hasActiveTicket: false
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error",
      error: "Failed to check for existing tickets"
    });
  }
};

const getArchivedData = async (req, res) => {
  const { id } = req.params;
  try {
    const { prisma } = require("../lib/clients");
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        ticketCode: true,
        status: true,
        backupcreatedAt: true,
        backupurl: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (!ticket.backupurl) {
      return res.status(404).json({ 
        message: "No archived data found for this ticket",
        ticketCode: ticket.ticketCode,
        status: ticket.status
      });
    }

    const archivedData = await readBackupFromFile(ticket.backupurl);
    
    if (!archivedData) {
      return res.status(404).json({ 
        message: "Failed to read archived data for this ticket",
        ticketCode: ticket.ticketCode,
        status: ticket.status
      });
    }

    res.status(200).json({
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      status: ticket.status,
      backupCreatedAt: ticket.backupcreatedAt,
      backupUrl: ticket.backupurl,
      archivedData,
    });
  } catch (error) {
    console.error("Error fetching archived data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const archiveTicketManually = async (req, res) => {
  const { id } = req.params;
  try {
    // Use the background job helper for single ticket
    const result = await archiveTicketById(parseInt(id));
    res.status(200).json({
      message: result.message,
      success: result.success,
      ticketCode: result.ticketCode,
    });
  } catch (error) {
    console.error("Error archiving ticket data:", error);
    res.status(500).json({ 
      message: "Failed to archive ticket data",
      error: error.message 
    });
  }
};

/**
 * Trigger background archival job for all closed tickets
 */
const triggerArchivalJob = async (req, res) => {
  try {
    // Only allow admins to trigger the job
    if (req.user.role !== 'MACSOFT_ADMIN' && req.user.role !== 'MACSOFT_HEAD') {
      return res.status(403).json({ 
        message: "Only admins can trigger the archival job" 
      });
    }

    // Get candidates first to show what will be archived
    const candidates = await getCandidateTicketsForArchival();

    if (candidates.length === 0) {
      return res.status(200).json({
        message: "No closed tickets found for archiving",
        processed: 0,
        candidates: [],
      });
    }

    // Run the job in the background
    jobScheduler.runArchiveTicketsNow()
      .then(result => {
        console.log("Background archival job completed:", result);
      })
      .catch(error => {
        console.error("Background archival job failed:", error);
      });

    // Return immediately with candidate info
    res.status(202).json({
      message: `Archival job started for ${candidates.length} tickets`,
      status: "processing",
      candidates: candidates.slice(0, 10).map(t => t.ticketCode), // Show first 10
      total: candidates.length,
    });
  } catch (error) {
    console.error("Error triggering archival job:", error);
    res.status(500).json({ 
      message: "Failed to trigger archival job",
      error: error.message 
    });
  }
};

/**
 * Get list of tickets pending archival
 */
const getArchivalCandidates = async (req, res) => {
  try {
    const candidates = await getCandidateTicketsForArchival();
    
    res.status(200).json({
      count: candidates.length,
      tickets: candidates,
    });
  } catch (error) {
    console.error("Error fetching archival candidates:", error);
    res.status(500).json({ 
      message: "Failed to fetch archival candidates",
      error: error.message 
    });
  }
};

module.exports = {
  getTickets,
  createTicket,
  updateTicket,
  updateStatus,
  getTicketById,
  deleteTicket,
  searchByControllerNumber,
  searchTickets,
  checkActiveTicketForController,
  getArchivedData,
  archiveTicketManually,
  triggerArchivalJob,
  getArchivalCandidates,
};
