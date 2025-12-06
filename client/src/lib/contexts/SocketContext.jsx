import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import socket, { connectSocket, disconnectSocket, joinConversation, leaveConversation } from '../socket/socket';

const SocketContext = createContext({
  isConnected: false,
  socket: null,
  connect: () => {},
  disconnect: () => {},
  joinConversation: () => {},
  leaveConversation: () => {},
  notifications: [],
  buzzerAlerts: []
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [buzzerAlerts, setBuzzerAlerts] = useState([]);

  const connect = () => {
    if (token && user && !isConnected) {
      connectSocket();
    }
  };

  const disconnect = () => {
    if (isConnected) {
      disconnectSocket();
    }
  };

  // Set up socket event listeners
  useEffect(() => {
    const handleConnect = () => {
      console.log(`🔌 Socket connected for user: ${user?.name} (${user?.role})`);
      setIsConnected(true);
    };

    const handleDisconnect = (reason) => {
      console.log(`🔌 Socket disconnected: ${reason}`);
      setIsConnected(false);
    };

    const handleError = (error) => {
      console.error('❌ Socket error:', error);
      setIsConnected(false);
    };

    const handleNotification = (event) => {
      const notificationData = event.detail;
      console.log('📢 Received notification via custom event:', notificationData);
      
      setNotifications(prev => {
        // Add new notification and keep only last 50
        const updated = [notificationData, ...prev].slice(0, 50);
        return updated;
      });
    };

    const handleBuzzerAlert = (event) => {
      const alertData = event.detail;
      console.log('🚨 Received buzzer alert via custom event:', alertData);
      
      setBuzzerAlerts(prev => {
        // Add new alert and keep only last 20
        const updated = [alertData, ...prev].slice(0, 20);
        return updated;
      });
    };

    const handleConversation = (event) => {
      const messageData = event.detail;
      console.log('💬 Received conversation message via custom event:', messageData);
      
      // Dispatch to components that need conversation updates
      window.dispatchEvent(new CustomEvent('conversationUpdate', {
        detail: messageData
      }));
    };

    const handleMilestone = (event) => {
      const milestoneData = event.detail;
      console.log('🎯 Received milestone update via custom event:', milestoneData);
      
      // Dispatch to components that need milestone updates
      window.dispatchEvent(new CustomEvent('milestoneUpdate', {
        detail: milestoneData
      }));
    };

    const handleTicketMessageUpdate = (event) => {
      const messageData = event.detail;
      console.log('🎫 Received ticket message update via custom event:', messageData);
      
      // Dispatch to components that need ticket message updates (for ticket cards)
      window.dispatchEvent(new CustomEvent('ticketMessageUpdate', {
        detail: messageData
      }));
    };

    const handleTicketCreated = (event) => {
      const ticketData = event.detail;
      console.log('🎫 Received new ticket creation via custom event:', ticketData);
      
      // Dispatch to components that need new ticket updates
      window.dispatchEvent(new CustomEvent('ticketCreated', {
        detail: ticketData
      }));
    };

    // Socket direct event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);

    // Custom event listeners for socket events
    window.addEventListener('socketNotification', handleNotification);
    window.addEventListener('socketBuzzerAlert', handleBuzzerAlert);
    window.addEventListener('socketConversation', handleConversation);
    window.addEventListener('socketMilestone', handleMilestone);
    window.addEventListener('socketTicketMessage', handleTicketMessageUpdate);
    window.addEventListener('socketTicketCreated', handleTicketCreated);

    return () => {
      // Cleanup socket listeners
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);

      // Cleanup custom event listeners
      window.removeEventListener('socketNotification', handleNotification);
      window.removeEventListener('socketBuzzerAlert', handleBuzzerAlert);
      window.removeEventListener('socketConversation', handleConversation);
      window.removeEventListener('socketMilestone', handleMilestone);
      window.removeEventListener('socketTicketMessage', handleTicketMessageUpdate);
      window.removeEventListener('socketTicketCreated', handleTicketCreated);
    };
  }, [user]);

  // Connect when user is authenticated and has token
  useEffect(() => {
    if (isAuthenticated && token && user) {
      console.log(`🔐 Authenticated user ${user.name} ready for socket connection`);
      connect();
    } else {
      console.log('🔐 Not authenticated, disconnecting socket');
      disconnect();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (!isAuthenticated) {
        disconnect();
      }
    };
  }, [isAuthenticated, token, user]);

  // Helper function to clear notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Helper function to mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, seen: true }
          : notif
      )
    );
  };

  // Helper function to clear buzzer alerts
  const clearBuzzerAlerts = () => {
    setBuzzerAlerts([]);
  };

  const value = {
    isConnected,
    socket,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    notifications,
    buzzerAlerts,
    clearNotifications,
    markNotificationAsRead,
    clearBuzzerAlerts,
    unreadNotifications: notifications.filter(n => !n.seen).length,
    activeAlerts: buzzerAlerts.length
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;