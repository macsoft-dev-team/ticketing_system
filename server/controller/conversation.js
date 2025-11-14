const conversationService = require("../service/conversation");

const getConversations = async (req, res) => {
  const { ticketId } = req.params;
  try {
    const conversations = await conversationService.getConversations(
      parseInt(ticketId)
    );
    res.status(200).json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createConversation = async (req, res) => {
  const { ticketId } = req.params;
  const io = req.io;
  const userId = req.user.id;
  const { message } = req.body;
  const files = req.files || [];
  
  const conversationData = {
    message,
    userId,
    ticketId: parseInt(ticketId),
  };
  
  try {
    const conversation = await conversationService.createConversation(
      conversationData,
      userId,
      io,
      files
    );
    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateSeen = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  try {
    const updatedConversation = await conversationService.updateSeen(
      parseInt(conversationId),
      userId
    );
    res.status(200).json(updatedConversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getConversations,
  createConversation,
  updateSeen,
};
