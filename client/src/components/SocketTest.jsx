import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import socketService from '../lib/services/socketService';

const SocketTest = () => {
  const { token } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [logs, setLogs] = useState([]);
  const [testResults, setTestResults] = useState({});

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
   };

  const runConnectionTest = async () => {
    addLog('Starting WebSocket connection test...', 'info');
    setLogs([]);
    
    try {
      // Test 1: Check if token exists
      if (token) {
        addLog('✅ Auth token found', 'success');
        setTestResults(prev => ({ ...prev, tokenExists: true }));
      } else {
        addLog('❌ No auth token found', 'error');
        setTestResults(prev => ({ ...prev, tokenExists: false }));
        return;
      }

      // Test 2: Test Socket.IO server accessibility
      try {
        const response = await fetch(`${import.meta.env.VITE_WS_URL}/socket.io/?EIO=4&transport=polling`);
        if (response.ok) {
          addLog('✅ Socket.IO server is accessible', 'success');
          setTestResults(prev => ({ ...prev, serverAccessible: true }));
        } else {
          addLog(`❌ Socket.IO server returned: ${response.status}`, 'error');
          setTestResults(prev => ({ ...prev, serverAccessible: false }));
        }
      } catch (error) {
        addLog(`❌ Cannot reach Socket.IO server: ${error.message}`, 'error');
        setTestResults(prev => ({ ...prev, serverAccessible: false }));
      }

      // Test 3: Attempt socket connection
      addLog('Attempting socket connection...', 'info');
      
      // Disconnect existing connection
      if (socketService.isSocketConnected()) {
        socketService.disconnect();
        addLog('Disconnected existing socket', 'info');
      }

      // Connect with token
      const socket = socketService.connect(token);
      
      if (socket) {
        addLog('Socket instance created', 'success');
        setTestResults(prev => ({ ...prev, socketCreated: true }));

        // Listen for connection events
        socket.on('connect', () => {
          addLog('✅ Socket connected successfully!', 'success');
          setConnectionStatus('connected');
          setTestResults(prev => ({ ...prev, connectionSuccessful: true }));
        });

        socket.on('connect_error', (error) => {
          addLog(`❌ Socket connection error: ${error.message}`, 'error');
          setConnectionStatus('error');
          setTestResults(prev => ({ ...prev, connectionSuccessful: false, error: error.message }));
        });

        socket.on('disconnect', (reason) => {
          addLog(`❌ Socket disconnected: ${reason}`, 'warning');
          setConnectionStatus('disconnected');
        });

        // Check connection status after a short delay
        setTimeout(() => {
          if (socket.connected) {
            addLog('✅ Socket connection confirmed', 'success');
            setConnectionStatus('connected');
          } else {
            addLog('❌ Socket failed to connect within timeout', 'error');
            setConnectionStatus('timeout');
          }
        }, 5000);

      } else {
        addLog('❌ Failed to create socket instance', 'error');
        setTestResults(prev => ({ ...prev, socketCreated: false }));
      }

    } catch (error) {
      addLog(`❌ Test failed: ${error.message}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults({});
  };

  useEffect(() => {
    // Update connection status based on socketService
    const checkStatus = () => {
      if (socketService.isSocketConnected()) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    };

    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'timeout': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">WebSocket Connection Test</h2>
      
      {/* Connection Status */}
      <div className="mb-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
        <p className={`text-lg font-medium ${getStatusColor()}`}>
          Status: {connectionStatus.toUpperCase()}
        </p>
        <p className="text-sm text-gray-600">
          Socket Connected: {socketService.isSocketConnected() ? '✅ Yes' : '❌ No'}
        </p>
      </div>

      {/* Test Controls */}
      <div className="mb-4 space-x-2">
        <button 
          onClick={runConnectionTest}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Run Connection Test
        </button>
        <button 
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      {/* Test Results Summary */}
      {Object.keys(testResults).length > 0 && (
        <div className="mb-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Test Results</h3>
          <ul className="space-y-1">
            <li>Token Available: {testResults.tokenExists ? '✅' : '❌'}</li>
            <li>Server Accessible: {testResults.serverAccessible ? '✅' : '❌'}</li>
            <li>Socket Created: {testResults.socketCreated ? '✅' : '❌'}</li>
            <li>Connection Successful: {testResults.connectionSuccessful ? '✅' : '❌'}</li>
            {testResults.error && (
              <li className="text-red-500">Error: {testResults.error}</li>
            )}
          </ul>
        </div>
      )}

      {/* Logs */}
      <div className="border rounded-lg">
        <h3 className="text-lg font-semibold p-4 border-b">Connection Logs</h3>
        <div className="p-4 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Click "Run Connection Test" to start.</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((log, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0">
                    {log.timestamp}
                  </span>
                  <span className={`
                    ${log.type === 'error' ? 'text-red-500' : 
                      log.type === 'success' ? 'text-green-500' : 
                      log.type === 'warning' ? 'text-yellow-500' : 
                      'text-gray-700'}
                  `}>
                    {log.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocketTest;