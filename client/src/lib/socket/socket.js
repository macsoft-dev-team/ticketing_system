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
    console.log('📢 Received notification:', notificationData);
    
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
    console.log('💬 Received conversation message:', messageData);
    
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

  // Listen for ticket message events (for updating last message in ticket cards)
  socket.on('ticket-message', (messageData) => {
    console.log('🎫 Received ticket message update:', messageData);
    
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
