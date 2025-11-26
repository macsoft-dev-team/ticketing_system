import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    const serverUrl = import.meta.env.VITE_WS_URL;
     this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
       this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
       this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
    });

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
     }
  }

  // Listen to conversation messages for a specific ticket
  listenToConversation(ticketId, callback) {
    if (!this.socket) return;

    const eventName = 'conversation';
    const wrappedCallback = (message) => {
      // Only process messages for this ticket
      if (message.ticketId === ticketId) {
        callback(message);
      }
    };

    this.socket.on(eventName, wrappedCallback);
    
    // Store listener for cleanup
    if (!this.listeners.has(ticketId)) {
      this.listeners.set(ticketId, []);
    }
    this.listeners.get(ticketId).push({ eventName, callback: wrappedCallback });

   }

  // Notification listeners removed - conversations only

  // Listen to ticket updates
  listenToTicketUpdates(callback) {
    if (!this.socket) return;

    this.socket.on('ticket', callback);
   }

  // Stop listening to conversation for a specific ticket
  stopListeningToConversation(ticketId) {
    if (!this.socket || !this.listeners.has(ticketId)) return;

    const ticketListeners = this.listeners.get(ticketId);
    ticketListeners.forEach(({ eventName, callback }) => {
      this.socket.off(eventName, callback);
    });

    this.listeners.delete(ticketId);
   }

  // Remove all listeners
  removeAllListeners() {
    if (!this.socket) return;

    this.socket.removeAllListeners();
    this.listeners.clear();
   }

  // Check if socket is connected
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Emit event
  emit(eventName, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('Cannot emit event - socket not connected');
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;