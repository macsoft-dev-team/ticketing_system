import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from '../hooks/useAuth';
import { useSoundManager } from '../hooks/SoundManager';

const BuzzerAlertsContext = createContext({
  isEnabled: true,
  alerts: [],
  toggleBuzzer: () => { },
  dismissAlert: () => { },
  clearAllAlerts: () => { }
});

export const useBuzzerAlerts = () => {
  const context = useContext(BuzzerAlertsContext);
  if (!context) {
    throw new Error('useBuzzerAlerts must be used within a BuzzerAlertsProvider');
  }
  return context;
};

export const BuzzerAlertsProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const { play, setVolume, getVolume } = useSoundManager();
  const [isEnabled, setIsEnabled] = useState(
    localStorage.getItem('buzzerEnabled') !== 'false'
  );
  const [alerts, setAlerts] = useState([]);
  const buzzerIntervalRef = useRef(null);

  // Play buzzer sound using SoundManager
  const playBuzzer = () => {
    try {
      // Get current volume and boost to maximum for buzzer alerts
      const originalVolume = getVolume();

      setVolume(1.0); // Set to maximum volume (100%)

      // Play the critical notification sound at full volume
      play('notify_critical');

      // Restore original volume after 5 seconds
      setTimeout(() => {
        setVolume(originalVolume);
      }, 5000);

    } catch (error) {
      console.warn('❌ Could not play buzzer sound:', error);
    }
  };

  // Show browser notification
  const showNotification = (alertData) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(`Customer Needs Response - ${alertData.ticketCode}`, {
        body: `Customer last replied ${alertData.hoursWaiting} hours ago. Please respond soon.`,
        icon: '/favicon.ico',
        tag: `buzzer-${alertData.ticketId}`,
        requireInteraction: true
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showNotification(alertData);
        }
      });
    }
  };

  // Handle new buzzer alert
  const handleBuzzerAlert = (alertData) => {
     // Only process alerts for specific Macsoft roles (exclude MACSOFT_ADMIN)
    const allowedRoles = ['MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
    if (!user || !allowedRoles.includes(user.role)) {
       return;
    }

    // Check if alert already exists
    const existingAlert = alerts.find(alert => alert.ticketId === alertData.ticketId);
    if (existingAlert) {
      // Update existing alert with latest data
      setAlerts(prev => prev.map(alert =>
        alert.ticketId === alertData.ticketId
          ? { ...alertData, id: alert.id, receivedAt: alert.receivedAt }
          : alert
      ));
    } else {
      // Add new alert
      const newAlert = {
        ...alertData,
        id: Date.now() + Math.random(),
        receivedAt: new Date()
      };
      setAlerts(prev => [...prev, newAlert]);
    }

    if (isEnabled) {
      playBuzzer();
      showNotification(alertData);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('buzzer_alert', handleBuzzerAlert);

      return () => {
        socket.off('buzzer_alert', handleBuzzerAlert);
      };
    }
  }, [socket, isConnected, user, alerts, isEnabled, play]);

  // Toggle buzzer on/off
  const toggleBuzzer = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    localStorage.setItem('buzzerEnabled', newEnabled.toString());

    if (buzzerIntervalRef.current) {
      clearInterval(buzzerIntervalRef.current);
      buzzerIntervalRef.current = null;
    }
  };

  // Dismiss specific alert
  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    setAlerts([]);
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    isEnabled,
    alerts,
    toggleBuzzer,
    dismissAlert,
    clearAllAlerts
  };

  return (
    <BuzzerAlertsContext.Provider value={value}>
      {children}
    </BuzzerAlertsContext.Provider>
  );
};

export default BuzzerAlertsContext;