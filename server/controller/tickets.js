const ticketService = require("../service/tickets");

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
    res.status(200).json({
      tickets,
      totalPages: Math.ceil(count / take),
      currentPage: parseInt(skip) || 1,
      statusCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTicketById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  try {
    const ticket = await ticketService.getTicketById(parseInt(id), userId, userRole);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.status(200).json(ticket);
  } catch (error) {
    console.error(error);
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
    
    console.log('✅ Ticket created successfully:', {
      id: newTicket.id,
      ticketCode: newTicket.ticketCode,
      status: 'success'
    });
    
    res.status(201).json(newTicket);
  } catch (error) {
    console.error('❌ Error creating ticket:', error);
    console.error('❌ Error stack:', error.stack);
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
    console.error(error);
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
    console.error(error);
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
    console.error(error);
    // Check if it's an access denied error
    if (error.message.startsWith("Access denied:")) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getTickets,
  createTicket,
  updateTicket,
  updateStatus,
  getTicketById,
  deleteTicket,
};
