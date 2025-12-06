import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSoundManager } from '../hooks/SoundManager';
import socket, { connectSocket, disconnectSocket, joinConversation, leaveConversation } from '../socket/socket';

const SocketContext = createContext({
  isConnected: false,
  socket: null,
  connect: () => { },
  disconnect: () => { },
  joinConversation: () => { },
  leaveConversation: () => { },
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
  const { play, muted } = useSoundManager();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [buzzerAlerts, setBuzzerAlerts] = useState([]);
  const [currentTicketId, setCurrentTicketId] = useState(null); // Track current ticket being viewed
  const processedMessagesRef = useRef(new Set()); // Track processed messages to prevent duplicate sounds

  // RBAC helper function to check if user has access to ticket-related events
  const hasAccessToTicket = useCallback((ticketData) => {
    if (!user || !ticketData) return false;

    const userRole = user.role;
    const userId = user.id;

    // MACSOFT roles have global access
    if (['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'].includes(userRole)) {
      return true;
    }

    // CUSTOMER_FIELD_ENGINEER: Only tickets created by them
    if (userRole === 'CUSTOMER_FIELD_ENGINEER') {
      return ticketData.createdBy === userId || ticketData.createdByUserId === userId;
    }

    // SERVICE_CENTER_TECHNICIAN: Only tickets assigned to their service center
    if (userRole === 'SERVICE_CENTER_TECHNICIAN') {
      const userCenterCode = user.centerCode;
      return userCenterCode && ticketData.assignedServiceCenter === userCenterCode;
    }

    // CUSTOMER_SERVICE_HEAD: Tickets where creator's state is in CSH's allowed states
    if (userRole === 'CUSTOMER_SERVICE_HEAD') {
      // Note: This would require additional user state data to implement fully
      // For now, we'll allow access (could be enhanced with state checking)
      return true;
    }

    console.warn(`🔒 [SOCKET RBAC] Unknown role: ${userRole}, denying access`);
    return false;
  }, [user]);

  // RBAC helper for notification events
  const hasAccessToNotification = useCallback((notificationData) => {
    // If it's a ticket-related notification, check ticket access
    if (notificationData.ticketId) {
      return hasAccessToTicket(notificationData);
    }
    
    // For non-ticket notifications, allow based on role hierarchy
    if (!user) return false;
    
    const userRole = user.role;
    
    // MACSOFT roles get all notifications
    if (['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'].includes(userRole)) {
      return true;
    }
    
    // Other roles get notifications based on their scope
    return true; // Allow for now, can be refined based on notification type
  }, [user, hasAccessToTicket]);

  // RBAC helper for milestone events
  const hasAccessToMilestone = useCallback((milestoneData) => {
    if (!user || !milestoneData) return false;

    const userRole = user.role;
    const userId = user.id;

    // MACSOFT roles have global access
    if (['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'].includes(userRole)) {
      return true;
    }

    // For ticket-related milestones, use ticket access logic
    if (milestoneData.ticketId) {
      return hasAccessToTicket(milestoneData);
    }

    // For project milestones or other milestone types
    // CUSTOMER_FIELD_ENGINEER: Only milestones for their created tickets/projects
    if (userRole === 'CUSTOMER_FIELD_ENGINEER') {
      return milestoneData.createdBy === userId || milestoneData.userId === userId;
    }

    // SERVICE_CENTER_TECHNICIAN: Only milestones for their service center
    if (userRole === 'SERVICE_CENTER_TECHNICIAN') {
      const userCenterCode = user.centerCode;
      return userCenterCode && milestoneData.centerCode === userCenterCode;
    }

    // CUSTOMER_SERVICE_HEAD: Allow access based on state/region
    if (userRole === 'CUSTOMER_SERVICE_HEAD') {
      return true; // Allow access, could be refined with state checking
    }

    console.warn(`🔒 [SOCKET RBAC] Unknown role for milestone: ${userRole}, denying access`);
    return false;
  }, [user, hasAccessToTicket]);

  // Centralized function to handle message sound logic
  const playMessageSound = useCallback((messageData, eventType) => {
    console.log(`🎵 [SOCKET] playMessageSound called for ${eventType}:`, {
      ticketId: messageData.ticketId,
      id: messageData.id,
      createdAt: messageData.createdAt,
      senderId: messageData.senderId
    });

    // Create unique message identifier
    const messageKey = `${messageData.ticketId}-${messageData.id}-${messageData.createdAt}`;
    console.log(`🔑 [SOCKET] Message key: ${messageKey}`);

    // Check if this message has already been processed for sound
    if (processedMessagesRef.current.has(messageKey)) {
      console.log(`🔄 [SOCKET] DUPLICATE ${eventType} message - already processed, skipping sound (key: ${messageKey})`);
      return false; // Indicate sound was not played
    }

    // Mark message as processed for sound
    processedMessagesRef.current.add(messageKey);
    console.log(`✅ [SOCKET] Marked message as processed: ${messageKey} (total processed: ${processedMessagesRef.current.size})`);

    // Clean up old message keys (keep only last 100)
    if (processedMessagesRef.current.size > 100) {
      const keysArray = Array.from(processedMessagesRef.current);
      keysArray.slice(0, 50).forEach(key => processedMessagesRef.current.delete(key));
      console.log(`🧹 [SOCKET] Cleaned up processed messages, now have: ${processedMessagesRef.current.size}`);
    }

    // Determine which sound to play based on user location
    const msgTicketId = parseInt(messageData.ticketId);
    const currTicketId = parseInt(currentTicketId);
    const isInSameTicket = currentTicketId && currTicketId === msgTicketId;
    const isSentByCurrentUser = user && messageData.senderId === user.id;

    // Only play sound for messages from other users
    if (!muted && !isSentByCurrentUser) {
      if (isInSameTicket) {
        console.log(`🔊 [SOCKET] Playing inbound_chime for receiver in same ticket (${eventType})`);
        play('inbound_chime');
      } else {
        console.log(`🔊 [SOCKET] Playing message_tone for receiver outside chat (${eventType})`);
        play('message_tone');
      }
      return true; // Indicate sound was played
    } else {
      console.log(`🔇 [SOCKET] Not playing sound - muted or sent by current user (${eventType})`);
      return false; // Indicate sound was not played
    }
  }, [currentTicketId, user, muted, play]);

  // Debug currentTicketId changes
  useEffect(() => {
    console.log(`🎯 [SOCKET] Current ticket ID changed to: ${currentTicketId}`);
  }, [currentTicketId]);

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
      setIsConnected(true);
    };

    const handleDisconnect = (reason) => {
      setIsConnected(false);
    };

    const handleError = (error) => {
      setIsConnected(false);
    };

    const handleNotification = (event) => {
      const notificationData = event.detail;
      
      // RBAC: Check if user has access to this notification
      if (!hasAccessToNotification(notificationData)) {
        console.log(`🔒 [SOCKET RBAC] User ${user?.id} (${user?.role}) denied access to notification:`, notificationData);
        return; // Don't process notification user doesn't have access to
      }
      
      console.log(`✅ [SOCKET RBAC] User ${user?.id} (${user?.role}) has access to notification:`, notificationData);
      
      // Check if notification is for current ticket
      const isCurrentTicketNotification = currentTicketId && notificationData.ticketId === currentTicketId;

      // Play notification sound only if not for current ticket
      if (!muted && !isCurrentTicketNotification) {
        play('inbound_notification');
      }

      setNotifications(prev => {
        // Add new notification and keep only last 50
        const updated = [notificationData, ...prev].slice(0, 50);
        return updated;
      });
    };

    const handleBuzzerAlert = (event) => {
      const alertData = event.detail;
      
      // RBAC: Check if user has access to this buzzer alert
      if (!hasAccessToTicket(alertData)) {
        console.log(`🔒 [SOCKET RBAC] User ${user?.id} (${user?.role}) denied access to buzzer alert:`, alertData);
        return; // Don't process alert user doesn't have access to
      }
      
      console.log(`✅ [SOCKET RBAC] User ${user?.id} (${user?.role}) has access to buzzer alert:`, alertData);

      // Check if alert is for current ticket
      const isCurrentTicketAlert = currentTicketId && alertData.ticketId === currentTicketId;

      // Play critical alert sound (buzzer alerts are urgent, may play even for current ticket)
      if (!muted && !isCurrentTicketAlert) {
        play('notify_critical');
      }

      setBuzzerAlerts(prev => {
        // Add new alert and keep only last 20
        const updated = [alertData, ...prev].slice(0, 20);
        return updated;
      });
    };

    const handleConversation = (event) => {
      const messageData = event.detail;
      
      // RBAC: Check if user has access to this conversation
      if (!hasAccessToTicket(messageData)) {
        console.log(`🔒 [SOCKET RBAC] User ${user?.id} (${user?.role}) denied access to conversation:`, messageData);
        return; // Don't process conversation user doesn't have access to
      }
      
      console.log(`✅ [SOCKET RBAC] User ${user?.id} (${user?.role}) has access to conversation:`, messageData);

      // Use centralized sound logic
      const soundPlayed = playMessageSound(messageData, 'conversation');
      const isSentByCurrentUser = user && messageData.senderId === user.id;

      // Note: Outbound sound is now played in ChatInput component on send

      // Dispatch to components that need conversation updates
      window.dispatchEvent(new CustomEvent('conversationUpdate', {
        detail: {
          ...messageData,
          showToast: !isSentByCurrentUser,
          isSentByCurrentUser
        }
      }));
    };

    const handleMilestone = (event) => {
      const milestoneData = event.detail;
      
      // RBAC: Check if user has access to this milestone
      if (!hasAccessToMilestone(milestoneData)) {
        console.log(`🔒 [SOCKET RBAC] User ${user?.id} (${user?.role}) denied access to milestone:`, milestoneData);
        return; // Don't process milestone user doesn't have access to
      }
      
      console.log(`✅ [SOCKET RBAC] User ${user?.id} (${user?.role}) has access to milestone:`, milestoneData);

      // Play sound based on milestone type
      if (!muted) {
        if (milestoneData.type === 'milestone-transitioned') {
          play('case_modified');
        } else if (milestoneData.type === 'milestone-created') {
          play('case_initiated');
        } else {
          play('case_modified');
        }
      }

      // Dispatch to components that need milestone updates
      window.dispatchEvent(new CustomEvent('milestoneUpdate', {
        detail: milestoneData
      }));
    };

    const handleTicketMessageUpdate = (event) => {
      const messageData = event.detail;
      
      // RBAC: Check if user has access to this ticket message
      if (!hasAccessToTicket(messageData)) {
        console.log(`🔒 [SOCKET RBAC] User ${user?.id} (${user?.role}) denied access to ticket message:`, messageData);
        return; // Don't process message user doesn't have access to
      }
      
      console.log(`✅ [SOCKET RBAC] User ${user?.id} (${user?.role}) has access to ticket message:`, messageData);

      // Use centralized sound logic
      const soundPlayed = playMessageSound(messageData, 'ticket-message');
      const isSentByCurrentUser = user && messageData.senderId === user.id;

      // Note: Outbound sound is now played in useConversation hook on send

      // Dispatch to components that need ticket message updates (for ticket cards)
      window.dispatchEvent(new CustomEvent('ticketMessageUpdate', {
        detail: {
          ...messageData,
          showToast: !isSentByCurrentUser,
          isSentByCurrentUser
        }
      }));
    };

    const handleTicketCreated = (event) => {
      const ticketData = event.detail;
      
      // RBAC: Check if user has access to this newly created ticket
      if (!hasAccessToTicket(ticketData)) {
        console.log(`🔒 [SOCKET RBAC] User ${user?.id} (${user?.role}) denied access to new ticket:`, ticketData);
        return; // Don't process ticket user doesn't have access to
      }
      
      console.log(`✅ [SOCKET RBAC] User ${user?.id} (${user?.role}) has access to new ticket:`, ticketData);

      // Play sound for new ticket creation
      if (!muted) {
        play('case_initiated');
      }

      // Dispatch to components that need new ticket updates
      window.dispatchEvent(new CustomEvent('ticketCreated', {
        detail: ticketData
      }));
    };

    // Socket direct event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);

    // Add handlers for new milestone events
    const handleMilestoneCreated = (event) => {
      handleMilestone(event); // Reuse existing handler with sound
    };

    const handleMilestoneTransitioned = (event) => {
      handleMilestone(event); // Reuse existing handler with sound
    };

    // Custom event listeners for socket events
    window.addEventListener('socketNotification', handleNotification);
    window.addEventListener('socketBuzzerAlert', handleBuzzerAlert);
    window.addEventListener('socketConversation', handleConversation);
    window.addEventListener('socketMilestone', handleMilestone);
    window.addEventListener('socketMilestoneCreated', handleMilestoneCreated);
    window.addEventListener('socketMilestoneTransitioned', handleMilestoneTransitioned);
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
      window.removeEventListener('socketMilestoneCreated', handleMilestoneCreated);
      window.removeEventListener('socketMilestoneTransitioned', handleMilestoneTransitioned);
      window.removeEventListener('socketTicketMessage', handleTicketMessageUpdate);
      window.removeEventListener('socketTicketCreated', handleTicketCreated);
    };
  }, [user]);

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
    activeAlerts: buzzerAlerts.length,
    currentTicketId,
    setCurrentTicketId
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;