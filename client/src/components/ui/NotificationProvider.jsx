import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Download, AlertCircle } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

const NotificationItem = ({ notification, onRemove }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'download':
        return <Download className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'download':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(notification.id);
    }, notification.duration || 3000);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`flex items-center gap-3 p-4 rounded-lg border shadow-sm ${getBgColor(notification.type)}`}
    >
      {getIcon(notification.type)}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{notification.message}</p>
        {notification.description && (
          <p className="text-xs text-gray-600">{notification.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(notification.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message, description) => {
    addNotification({ type: 'success', message, description });
  };

  const showError = (message, description) => {
    addNotification({ type: 'error', message, description });
  };

  const showDownload = (message, description) => {
    addNotification({ type: 'download', message, description });
  };

  const showInfo = (message, description) => {
    addNotification({ type: 'info', message, description });
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        showSuccess, 
        showError, 
        showDownload, 
        showInfo,
        notifications 
      }}
    >
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;