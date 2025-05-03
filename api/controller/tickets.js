const ticketService = require("../service/tickets");

const getTickets = async (req, res) => {
  try {
    const tickets = await ticketService.getTickets();
    res.status(200).json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createTicket = async (req, res) => {
  const ticket = req.body;
  const { file } = req;
  const userId = req.user.id;
  const io = req.io;
  try {
    const newTicket = await ticketService.createTicket(ticket, userId, io);
    res.status(201).json(newTicket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateTicket = async (req, res) => {
  const { id } = req.params;
  const { ticket } = req.body;
  const userId = req.user.id;
  const io = req.io;
  try {
    const updatedTicket = await ticketService.updateTicket(
      parseInt(id),
      ticket,
      userId,
      io
    );
    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  const io = req.io;
  try {
    const updatedTicket = await ticketService.updateStatus(
      parseInt(id),
      status,
      userId,
      io
    );
    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getTickets,
  createTicket,
  updateTicket,
  updateStatus,
};
