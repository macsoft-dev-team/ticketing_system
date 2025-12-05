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
  const { token, isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  const connect = () => {
    if (token && !socket) {
       const socketInstance = socketService.connect(token);
      setSocket(socketInstance);
      
      if (socketInstance) {
        socketInstance.on('connect', () => {
           setIsConnected(true);
           
           // Join notification rooms when connected
           if (user?.id) {
             socketInstance.emit('join-notifications', user.id);
             
             // Join Macsoft alerts room for buzzer alerts if user is Macsoft team
             const MACSOFT_ROLES = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
             if (user.role && MACSOFT_ROLES.includes(user.role)) {
               socketInstance.emit('join-macsoft-alerts', user.role);
               console.log(`🚨 Joined Macsoft alerts room as ${user.role}`);
             }
           }
        });
        
        socketInstance.on('disconnect', () => {
          setIsConnected(false);
        });
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
    if (isAuthenticated && token && user) {
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
  }, [isAuthenticated, token, user]);

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