import { io } from "socket.io-client";
import { APP_WS_URL } from "../constants/api";
import SessionManager from "../utils/sessionManager";

// Create socket connection with proper authentication
const createSocket = () => {
  const token = SessionManager.getToken();
  
  const socket = io(APP_WS_URL, {
    withCredentials: true,
    autoConnect: false, // Don't auto connect, we'll connect when token is available
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
    timeout: 10000,
    forceNew: true,
  });

  // Set up connection event listeners
  socket.on('connect', () => {
    console.log('🔌 Socket connected successfully');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
    
    // If authentication error, try to refresh token
    if (error.message.includes('Authentication error')) {
      console.log('🔄 Authentication error, attempting to reconnect...');
      // Could trigger token refresh logic here
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  // Set up notification listeners
  socket.on('notification', (notificationData) => {
    console.log('📢 [SOCKET_JS] Received notification:', notificationData);
    
    // Check if this is a message notification for current ticket - suppress toast but allow sound
    const currentTicketId = window.currentTicketId;
    if (notificationData.type === 'message' && notificationData.ticketId && currentTicketId) {
      // Handle both string and number comparisons
      const notifTicketId = parseInt(notificationData.ticketId);
      const currTicketId = parseInt(currentTicketId);
      if (notifTicketId === currTicketId) {
        console.log(`🔕 [SOCKET_JS] User in same ticket ${currTicketId} - modifying notification to suppress toast only`);
        // Modify notification to suppress toast but allow sound
        notificationData.suppressToast = true;
        notificationData.allowSound = true;
      }
    }
    
    console.log('📨 [SOCKET_JS] Dispatching socketNotification event');
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('socketNotification', {
      detail: notificationData
    }));
  });

  socket.on('buzzer_alert', (alertData) => {
    console.log('🚨 Received buzzer alert:', alertData);
    
    // Dispatch custom event for buzzer alerts
    window.dispatchEvent(new CustomEvent('socketBuzzerAlert', {
      detail: alertData
    }));
  });

  socket.on('conversation', (messageData) => {
    console.log('💬 [SOCKET_JS] Received conversation message:', messageData);
    
    // Check if this is a message for current ticket - allow sound but suppress toast
    const currentTicketId = window.currentTicketId;
    if (messageData.ticketId && currentTicketId) {
      // Handle both string and number comparisons
      const msgTicketId = parseInt(messageData.ticketId);
      const currTicketId = parseInt(currentTicketId);
      if (msgTicketId === currTicketId) {
        console.log(`🔕 [SOCKET_JS] User in same ticket ${currTicketId} - allowing conversation event with toast suppression`);
        // Modify message to suppress toast but allow sound
        messageData.suppressToast = true;
        messageData.allowSound = true;
      }
    }
    
    console.log('📨 [SOCKET_JS] Dispatching socketConversation event');
    // Dispatch custom event for conversation updates
    window.dispatchEvent(new CustomEvent('socketConversation', {
      detail: messageData
    }));
  });

  socket.on('milestone-updated', (milestoneData) => {
    console.log('🎯 Received milestone update:', milestoneData);
    
    // Dispatch custom event for milestone updates
    window.dispatchEvent(new CustomEvent('socketMilestone', {
      detail: milestoneData
    }));
  });

  socket.on('milestone-created', (milestoneData) => {
    console.log('🎯 Received milestone creation:', milestoneData);
    
    // Dispatch custom event for milestone creation
    window.dispatchEvent(new CustomEvent('socketMilestoneCreated', {
      detail: milestoneData
    }));
  });

  socket.on('milestone-transitioned', (milestoneData) => {
    console.log('🎯 Received milestone transition:', milestoneData);
    
    // Dispatch custom event for milestone transitions
    window.dispatchEvent(new CustomEvent('socketMilestoneTransitioned', {
      detail: milestoneData
    }));
  });

  // Listen for ticket message events (for updating last message in ticket cards)
  socket.on('ticket-message', (messageData) => {
    console.log('🎫 [SOCKET_JS] Received ticket message update:', messageData);
    
    // Check if this is a message for current ticket - allow sound but suppress toast
    const currentTicketId = window.currentTicketId;
    if (messageData.ticketId && currentTicketId) {
      // Handle both string and number comparisons
      const msgTicketId = parseInt(messageData.ticketId);
      const currTicketId = parseInt(currentTicketId);
      if (msgTicketId === currTicketId) {
        console.log(`🔕 [SOCKET_JS] User in same ticket ${currTicketId} - allowing ticket-message event with toast suppression`);
        // Modify message to suppress toast but allow sound
        messageData.suppressToast = true;
        messageData.allowSound = true;
      }
    }
    
    console.log('📨 [SOCKET_JS] Dispatching socketTicketMessage event');
    // Dispatch custom event for ticket message updates
    window.dispatchEvent(new CustomEvent('socketTicketMessage', {
      detail: messageData
    }));
  });

  // Listen for new ticket creation events
  socket.on('ticket-created', (ticketData) => {
    console.log('🎫 Received new ticket creation:', ticketData);
    
    // Dispatch custom event for new ticket creation
    window.dispatchEvent(new CustomEvent('socketTicketCreated', {
      detail: ticketData
    }));
  });

  return socket;
};

// Create the socket instance
const socket = createSocket();

// Helper function to connect socket with current token
export const connectSocket = () => {
  const token = SessionManager.getToken();
  if (token) {
    socket.auth = { token };
    socket.connect();
  } else {
    console.warn('⚠️ No token available for socket connection');
  }
};

// Helper function to disconnect socket
export const disconnectSocket = () => {
  socket.disconnect();
};

// Helper function to join a conversation
export const joinConversation = (ticketId) => {
  if (socket.connected) {
    socket.emit('join-conversation', ticketId);
  }
};

// Helper function to leave a conversation
export const leaveConversation = (ticketId) => {
  if (socket.connected) {
    socket.emit('leave-conversation', ticketId);
  }
};

export default socket;
