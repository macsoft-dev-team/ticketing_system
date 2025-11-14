import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import socketService from '../services/socketService';

const SocketContext = createContext({
  isConnected: false,
  socket: null,
  connect: () => {},
  disconnect: () => {}
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  const connect = () => {
    if (token && !socket) {
      console.log('Connecting socket for conversations only');
      const socketInstance = socketService.connect(token);
      setSocket(socketInstance);
      
      if (socketInstance) {
        socketInstance.on('connect', () => {
          console.log('Socket connected - conversations only');
          setIsConnected(true);
        });
        
        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        // Note: All notification listeners removed - only conversation functionality remains
      }
    }
  };

  const disconnect = () => {
    if (socket) {
      socketService.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  // All notification-related functions removed - conversations only

  // Connect when user is authenticated and has token
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (!isAuthenticated) {
        disconnect();
      }
    };
  }, [isAuthenticated, token]);

  const value = {
    isConnected,
    socket,
    connect,
    disconnect
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;