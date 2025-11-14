import { 
  Bell, 
  Ticket, 
  Users2, 
  Combine, 
  MessageCircle, 
  User,
  CheckCircle,
  Circle
} from 'lucide-react';

// Notification icon mappings
export const getNotificationIcon = (type, size = 'w-4 h-4') => {
  const iconClass = `${size}`;
  
  switch (type) {
    case 'ticket':
      return <Ticket className={`${iconClass} text-blue-600`} />;
    case 'message':
      return <MessageCircle className={`${iconClass} text-green-600`} />;
    case 'spare_request':
      return <Combine className={`${iconClass} text-purple-600`} />;
    case 'user':
      return <User className={`${iconClass} text-indigo-600`} />;
    case 'service_center':
      return <Users2 className={`${iconClass} text-orange-600`} />;
    case 'product':
      return <Ticket className={`${iconClass} text-teal-600`} />;
    case 'inventory':
      return <Combine className={`${iconClass} text-yellow-600`} />;
    case 'system':
    case 'system_alert':
      return <Bell className={`${iconClass} text-red-600`} />;
    default:
      return <Bell className={`${iconClass} text-gray-600`} />;
  }
};

// Read/Unread status icons
export const getStatusIcon = (unread) => {
  if (unread) {
    return <Circle className="w-3 h-3 text-blue-600 fill-current" />;
  }
  return <CheckCircle className="w-3 h-3 text-gray-400" />;
};