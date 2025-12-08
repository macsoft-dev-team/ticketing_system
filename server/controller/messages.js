const conversationService = require("../service/conversation");

const getUnrepliedTickets = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  
  try {
    const result = await conversationService.getUnrepliedTickets(parseInt(userId), userRole);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching unreplied tickets:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

// Get unread message count for a specific ticket (like ticket cards)
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
      ticketId: parseInt(ticketId),
      unreadCount: unreadCount,
      hasUnreadMessages: unreadCount > 0
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

// Get unread counts for multiple tickets (for ticket cards display)
const getBulkUnreadCounts = async (req, res) => {
  const { ticketIds } = req.body; // Array of ticket IDs
  const userId = req.user.id;
  
  try {
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ticketIds array is required"
      });
    }

    // Get unread counts for all tickets
    const unreadCounts = await Promise.all(
      ticketIds.map(async (ticketId) => {
        try {
          const count = await conversationService.getUnreadMessageCount(
            parseInt(ticketId),
            userId
          );
          return {
            ticketId: parseInt(ticketId),
            unreadCount: count,
            hasUnreadMessages: count > 0
          };
        } catch (error) {
          console.error(`Error getting unread count for ticket ${ticketId}:`, error);
          return {
            ticketId: parseInt(ticketId),
            unreadCount: 0,
            hasUnreadMessages: false,
            error: true
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      unreadCounts: unreadCounts,
      totalUnreadTickets: unreadCounts.filter(item => item.hasUnreadMessages).length
    });
  } catch (error) {
    console.error("Error getting bulk unread counts:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

/**
 * Get unreplied messages for current user with audience filter
 * Query parameter: audience ("MACSOFT" | "CUSTOMER")
 * Example: GET /messages/unreplied?audience=MACSOFT
 */
const getUnrepliedMessages = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { audience } = req.query;
  
  try {
    // Validate audience parameter
    if (!audience || !["MACSOFT", "CUSTOMER"].includes(audience)) {
      return res.status(400).json({
        success: false,
        message: 'audience query parameter is required and must be either "MACSOFT" or "CUSTOMER"'
      });
    }

    const messages = await conversationService.getUnrepliedMessagesForUser(
      parseInt(userId),
      userRole,
      audience
    );
    
    res.status(200).json({
      success: true,
      audience: audience,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error("Error fetching unreplied messages:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  getUnrepliedTickets,
  getUnreadCount,
  getBulkUnreadCounts,
  getUnrepliedMessages, // New endpoint for flexible unreplied messages
};