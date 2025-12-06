import { useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * Custom hook for managing socket-based activities and notifications
 * Provides easy access to real-time updates for tickets, conversations, and other activities
 */
export const useSocketActivities = () => {
  const {
    isConnected,
    socket,
    notifications,
    buzzerAlerts,
    clearNotifications,
    markNotificationAsRead,
    clearBuzzerAlerts,
    unreadNotifications,
    activeAlerts,
    joinConversation,
    leaveConversation
  } = useSocket();

  // Join a ticket conversation
  const joinTicketConversation = useCallback((ticketId) => {
    if (isConnected && ticketId) {
      joinConversation(ticketId);
    }
  }, [isConnected, joinConversation]);

  // Leave a ticket conversation
  const leaveTicketConversation = useCallback((ticketId) => {
    if (isConnected && ticketId) {
      leaveConversation(ticketId);
    }
  }, [isConnected, leaveConversation]);

  // Listen for specific activity types
  const useActivityListener = useCallback((activityType, callback) => {
    useEffect(() => {
      const handleActivity = (event) => {
        const data = event.detail;
        if (data.type === activityType || data.entityType === activityType) {
          callback(data);
        }
      };

      // Listen for various socket events
      window.addEventListener('socketNotification', handleActivity);
      window.addEventListener('conversationUpdate', handleActivity);
      window.addEventListener('milestoneUpdate', handleActivity);

      return () => {
        window.removeEventListener('socketNotification', handleActivity);
        window.removeEventListener('conversationUpdate', handleActivity);
        window.removeEventListener('milestoneUpdate', handleActivity);
      };
    }, [activityType, callback]);
  }, []);

  // Get notifications for specific ticket
  const getTicketNotifications = useCallback((ticketId) => {
    return notifications.filter(notif => notif.ticketId === parseInt(ticketId));
  }, [notifications]);

  // Get notifications for specific user
  const getUserNotifications = useCallback((userId) => {
    return notifications.filter(notif => notif.targetUserId === parseInt(userId));
  }, [notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notif => notif.type === type);
  }, [notifications]);

  // Send test notification (for development)
  const sendTestNotification = useCallback((data) => {
    if (isConnected && socket) {
      socket.emit('send-test-notification', data);
    }
  }, [isConnected, socket]);

  // Send test buzzer alert (for Macsoft roles only)
  const sendTestBuzzer = useCallback((data) => {
    if (isConnected && socket) {
      socket.emit('send-test-buzzer', data);
    }
  }, [isConnected, socket]);

  // Send test ticket message update (for testing ticket card updates)
  const sendTestTicketMessage = useCallback((ticketId, messageData = {}) => {
    const testTicketMessage = {
      ticketId: ticketId,
      id: Date.now(),
      content: messageData.content || 'Test message for ticket card update',
      createdAt: new Date().toISOString(),
      senderId: messageData.senderId || 999,
      sender: {
        id: messageData.senderId || 999,
        name: messageData.senderName || 'Test User',
        role: 'TEST_ROLE'
      },
      attachments: messageData.attachments || [],
      seenBy: [],
      // Include ticket-level updates
      ticketUpdates: messageData.ticketUpdates || {
        hasNewActivity: true,
        lastActivity: new Date().toISOString(),
        lastMessageBy: messageData.senderName || 'Test User'
      }
    };
    
    // Directly emit the custom event for testing
    window.dispatchEvent(new CustomEvent('socketTicketMessage', {
      detail: testTicketMessage
    }));
    
    console.log('🎫 Sent test ticket message with updates:', testTicketMessage);
  }, []);

  // Send test new ticket creation (for testing ticket list updates)
  const sendTestTicketCreation = useCallback((ticketData = {}) => {
    const testTicket = {
      id: Date.now(),
      ticketCode: `TKT-2025-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
      title: ticketData.title || 'Test Ticket Creation',
      description: ticketData.description || 'This is a test ticket created for socket testing',
      status: ticketData.status || 'OPEN',
      priority: ticketData.priority || 'MEDIUM',
      customerName: ticketData.customerName || 'Test Customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isNewTicket: true,
      messages: [],
      createdByUser: {
        id: 999,
        name: 'Test User',
        role: 'TEST_ROLE'
      },
      ticketMilestones: [],
      ...ticketData
    };
    
    // Directly emit the custom event for testing
    window.dispatchEvent(new CustomEvent('socketTicketCreated', {
      detail: testTicket
    }));
    
    console.log('🎫 Sent test ticket creation:', testTicket);
  }, []);

  // Send test milestone creation
  const sendTestMilestoneCreation = useCallback((milestoneData = {}) => {
    const testMilestone = {
      type: 'milestone-created',
      ticketId: milestoneData.ticketId || 1,
      ticketCode: milestoneData.ticketCode || 'TKT-2025-001',
      milestone: {
        id: Date.now(),
        stage: milestoneData.stage || 'UNDER_INVESTIGATION',
        status: 'IN_PROGRESS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        changer: {
          id: 999,
          name: 'Test User',
          role: 'TEST_ROLE'
        },
        config: {
          label: 'Under Investigation',
          description: 'Test milestone creation'
        },
        ...milestoneData.milestone
      },
      createdBy: {
        id: 999,
        name: 'Test User'
      },
      timestamp: new Date().toISOString()
    };
    
    // Emit the custom event for testing
    window.dispatchEvent(new CustomEvent('socketMilestoneCreated', {
      detail: testMilestone
    }));
    
    console.log('🎯 Sent test milestone creation:', testMilestone);
  }, []);

  // Send test milestone transition
  const sendTestMilestoneTransition = useCallback((transitionData = {}) => {
    const testTransition = {
      type: 'milestone-transitioned',
      ticketId: transitionData.ticketId || 1,
      ticketCode: transitionData.ticketCode || 'TKT-2025-001',
      milestone: {
        id: Date.now(),
        stage: transitionData.toStage || 'PARTS_ORDERED',
        status: 'IN_PROGRESS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        changer: {
          id: 999,
          name: 'Test User',
          role: 'TEST_ROLE'
        },
        config: {
          label: 'Parts Ordered',
          description: 'Test milestone transition'
        },
        ...transitionData.milestone
      },
      fromStage: transitionData.fromStage || 'UNDER_INVESTIGATION',
      toStage: transitionData.toStage || 'PARTS_ORDERED',
      isTicketClosed: false,
      updatedBy: {
        id: 999,
        name: 'Test User'
      },
      timestamp: new Date().toISOString()
    };
    
    // Emit the custom event for testing
    window.dispatchEvent(new CustomEvent('socketMilestoneTransitioned', {
      detail: testTransition
    }));
    
    console.log('🎯 Sent test milestone transition:', testTransition);
  }, []);

  // Send test milestone update
  const sendTestMilestoneUpdate = useCallback((updateData = {}) => {
    const testUpdate = {
      type: 'milestone-updated',
      ticketId: updateData.ticketId || 1,
      ticketCode: updateData.ticketCode || 'TKT-2025-001',
      milestone: {
        id: Date.now(),
        stage: updateData.stage || 'UNDER_INVESTIGATION',
        status: 'IN_PROGRESS',
        notes: updateData.notes || 'Test milestone update notes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        changer: {
          id: 999,
          name: 'Test User',
          role: 'TEST_ROLE'
        },
        config: {
          label: 'Under Investigation',
          description: 'Test milestone update'
        },
        ...updateData.milestone
      },
      updatedBy: {
        id: 999,
        name: 'Test User'
      },
      timestamp: new Date().toISOString()
    };
    
    // Emit the custom event for testing
    window.dispatchEvent(new CustomEvent('socketMilestone', {
      detail: testUpdate
    }));
    
    console.log('🎯 Sent test milestone update:', testUpdate);
  }, []);

  return {
    // Connection status
    isConnected,
    
    // Notifications
    notifications,
    unreadNotifications,
    clearNotifications,
    markNotificationAsRead,
    getTicketNotifications,
    getUserNotifications,
    getNotificationsByType,
    
    // Buzzer alerts
    buzzerAlerts,
    activeAlerts,
    clearBuzzerAlerts,
    
    // Conversations
    joinTicketConversation,
    leaveTicketConversation,
    
    // Activity listeners
    useActivityListener,
    
    // Testing functions
    sendTestNotification,
    sendTestBuzzer,
    sendTestTicketMessage,
    sendTestTicketCreation,
    sendTestMilestoneCreation,
    sendTestMilestoneTransition,
    sendTestMilestoneUpdate,
    
    // Raw socket access if needed
    socket
  };
};

/**
 * Hook for listening to specific types of activities
 * @param {string} activityType - Type of activity to listen for
 * @param {function} callback - Callback function to handle the activity
 * @param {Array} dependencies - Dependencies array for the effect
 */
export const useActivityListener = (activityType, callback, dependencies = []) => {
  useEffect(() => {
    const handleActivity = (event) => {
      const data = event.detail;
      if (data.type === activityType || data.entityType === activityType) {
        callback(data);
      }
    };

    window.addEventListener('socketNotification', handleActivity);
    window.addEventListener('conversationUpdate', handleActivity);
    window.addEventListener('milestoneUpdate', handleActivity);

    return () => {
      window.removeEventListener('socketNotification', handleActivity);
      window.removeEventListener('conversationUpdate', handleActivity);
      window.removeEventListener('milestoneUpdate', handleActivity);
    };
  }, [activityType, callback, ...dependencies]);
};

/**
 * Hook for managing ticket conversation in a component
 * Automatically joins conversation on mount and leaves on unmount
 * @param {number|string} ticketId - The ticket ID to join conversation for
 */
export const useTicketConversation = (ticketId) => {
  const { joinTicketConversation, leaveTicketConversation } = useSocketActivities();

  useEffect(() => {
    if (ticketId) {
      joinTicketConversation(ticketId);
      
      return () => {
        leaveTicketConversation(ticketId);
      };
    }
  }, [ticketId, joinTicketConversation, leaveTicketConversation]);
};

export default useSocketActivities;