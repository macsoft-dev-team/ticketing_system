import React from 'react';
import { useSocket } from '../lib/contexts/SocketContext';
import { useBuzzer } from '../lib/hooks/useBuzzer';
import { useBuzzerAlerts } from '../lib/contexts/BuzzerAlertsContext';
import { useSoundManager } from '../lib/hooks/SoundManager';

const BuzzerTestPanel = () => {
  const { socket, isConnected } = useSocket();
  const { isEnabled, alertCount, toggleBuzzer, clearAllAlerts } = useBuzzer();
  const { alerts } = useBuzzerAlerts();
  const { play, soundMap, setVolume, getVolume } = useSoundManager();

  // Get working hours status from API
  const [workingStatus, setWorkingStatus] = React.useState({ 
    isWorking: true, 
    reason: 'Loading...' 
  });

  // Update working status periodically
  React.useEffect(() => {
    const updateWorkingStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3057/api'}/working-hours/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setWorkingStatus({
            isWorking: data.data.isWithinWorkingHours,
            reason: data.data.isWithinWorkingHours ? 
              `Working hours (${data.data.dayOfWeek}, ${data.data.hour}:${data.data.minutes.toString().padStart(2, '0')})` :
              `Outside working hours (${data.data.dayOfWeek}, ${data.data.hour}:${data.data.minutes.toString().padStart(2, '0')})`
          });
        }
      } catch (error) {
        console.error('Failed to get working hours status:', error);
      }
    };

    updateWorkingStatus();
    const interval = setInterval(updateWorkingStatus, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const simulateBuzzerAlert = () => {
    // Simulate a buzzer alert by triggering the test event
    const mockAlert = {
      ticketId: Math.floor(Math.random() * 1000) + 1,
      ticketCode: `TKT-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      hoursWaiting: Math.floor(Math.random() * 12) + 1,
      assignedTo: 'Test User',
      conversationId: Math.floor(Math.random() * 1000) + 1,
      customerName: 'Test Customer'
    };

    // Trigger test buzzer alert through socket
    if (socket) {
      socket.emit('send-test-buzzer', mockAlert);
      console.log('🧪 Test buzzer alert sent:', mockAlert);
    } else {
      console.warn('Socket not connected');
    }
  };

  const simulateUrgentAlert = () => {
    const mockUrgentAlert = {
      ticketId: Math.floor(Math.random() * 1000) + 1,
      ticketCode: `TKT-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      hoursWaiting: Math.floor(Math.random() * 6) + 6, // 6-12 hours (urgent)
      assignedTo: 'Urgent Test User',
      conversationId: Math.floor(Math.random() * 1000) + 1,
      customerName: 'Urgent Test Customer'
    };

    if (socket) {
      socket.emit('send-test-buzzer', mockUrgentAlert);
      console.log('🚨 Test urgent buzzer alert sent:', mockUrgentAlert);
    } else {
      console.warn('Socket not connected');
    }
  };

  const testSoundDirectly = () => {
    console.log('🔊 Testing notify_critical sound directly');
    console.log('Sound URL:', import.meta.env.SOUND_URL);
    console.log('Sound Map:', soundMap);
    
    try {
      play('notify_critical');
      console.log('✅ Sound play() called successfully');
    } catch (error) {
      console.error('❌ Error playing sound:', error);
    }
  };

  const testVolumeControl = () => {
    console.log('🔊 Testing volume control feature');
    const currentVolume = getVolume();
    console.log(`Current volume: ${currentVolume}`);
    
    // Set volume to low first
    setVolume(0.1);
    console.log('Set volume to 10%');
    
    setTimeout(() => {
      // Test the volume boost and restore functionality
      console.log('🔊 Testing volume boost to 100%');
      const originalVolume = getVolume();
      console.log(`Volume before boost: ${originalVolume}`);
      
      setVolume(1.0); // Boost to 100%
      play('notify_critical');
      console.log('✅ Playing sound at 100% volume');
      
      // Restore after 3 seconds (shorter for testing)
      setTimeout(() => {
        console.log(`🔊 Restoring volume to: ${originalVolume}`);
        setVolume(originalVolume);
      }, 3000);
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      zIndex: 999
    }}>
     {/*  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
        🧪 Buzzer Test Panel
      </h4>
      
      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6c757d' }}>
        Socket: {isConnected ? '✅ Connected' : '❌ Disconnected'} | 
        Buzzer: {isEnabled ? '🔊 Enabled' : '🔇 Disabled'} | 
        Alerts: {alertCount}
      </div>
      
      <div style={{ 
        marginBottom: '8px', 
        fontSize: '11px', 
        color: workingStatus.isWorking ? '#28a745' : '#dc3545',
        fontWeight: 'bold',
        padding: '4px 8px',
        backgroundColor: workingStatus.isWorking ? '#d4edda' : '#f8d7da',
        borderRadius: '4px',
        border: `1px solid ${workingStatus.isWorking ? '#c3e6cb' : '#f5c6cb'}`
      }}>
        {workingStatus.isWorking ? '🟢' : '🔴'} {workingStatus.reason}
      </div>
      
      <div style={{ marginBottom: '8px', fontSize: '10px', color: '#6c757d' }}>
        SOUND_URL: {import.meta.env.SOUND_URL || 'Not set'}<br/>
        VITE_SOUND_URL: {import.meta.env.VITE_SOUND_URL || 'Not set'}<br/>
        Critical Sound: {soundMap?.notify_critical?.file || 'Not found'}<br/>
        Current Volume: {Math.round(getVolume() * 100)}%<br/>
        Active Alerts: {alerts.length}<br/>
        <strong>Office Hours:</strong> Mon-Fri 9AM-6PM<br/>
        <strong>Breaks:</strong> 11:00-11:15, 13:00-13:30, 16:00-16:15
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={testSoundDirectly}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔊 Test Sound Directly
        </button>
        
        <button
          onClick={testVolumeControl}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔊 Test Volume Control
        </button>
        
        <button
          onClick={simulateBuzzerAlert}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Normal Alert
        </button>
        
        <button
          onClick={simulateUrgentAlert}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Urgent Alert
        </button>
        
        <button
          onClick={toggleBuzzer}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: isEnabled ? '#28a745' : '#ffc107',
            color: isEnabled ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isEnabled ? 'Disable' : 'Enable'} Buzzer
        </button>
        
        {alertCount > 0 && (
          <button
            onClick={clearAllAlerts}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear All ({alertCount})
          </button>
        )}
      </div>
      
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#6c757d' }}>
        This panel is for testing only. Remove in production.
      </div> */}
    </div>
  );
};

export default BuzzerTestPanel;