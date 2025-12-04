const conversationService = require("../service/conversation");

const getConversations = async (req, res) => {
  const { ticketId } = req.params;
  try {
    const conversations = await conversationService.getConversations(
      parseInt(ticketId)
    );
    res.status(200).json(conversations);
  } catch (error) {
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
    console.error("Error creating conversation:", error);
    
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('NotificationRecipient_notificationId_userId_key')) {
      return res.status(409).json({ 
        message: "Notification recipient already exists for this notification" 
      });
    }
    
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
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark specific message as seen
const markMessageAsSeen = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;
  try {
    const result = await conversationService.markMessageAsSeen(
      parseInt(messageId),
      userId
    );
    res.status(200).json({
      success: true,
      data: result,
      message: "Message marked as seen"
    });
  } catch (error) {
    console.error("Error marking message as seen:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark messages in a ticket as seen
const markMessagesAsSeen = async (req, res) => {
  const { ticketId } = req.params;
  const { messageIds } = req.body; // Optional array of specific message IDs
  const userId = req.user.id;
  
  try {
    const result = await conversationService.markMessagesAsSeen(
      parseInt(ticketId),
      userId,
      messageIds
    );
    res.status(200).json({
      success: true,
      data: result,
      message: "Messages marked as seen"
    });
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get unread message count for a ticket
const getUnreadCount = async (req, res) => {
  const { ticketId } = req.params;
  const userId = req.user.id;
  
  try {
    const unreadCount = await conversationService.getUnreadMessageCount(
      parseInt(ticketId),
      userId
    );
    res.status(200).json({
      success: true,
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getConversations,
  createConversation,
  updateSeen,
  markMessageAsSeen,
  markMessagesAsSeen,
  getUnreadCount,
};
