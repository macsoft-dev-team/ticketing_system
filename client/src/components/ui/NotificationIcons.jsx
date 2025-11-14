import { Bell, Ticket, Users2, Combine, User, MessageCircle, Settings, AlertTriangle, CheckCircle } from 'lucide-react';

// Notification type configurations with icons and styling
export const NOTIFICATION_TYPES = {
  // Ticket notifications
  ticket: {
    icon: Ticket,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    label: 'Ticket'
  },
  ticket_created: {
    icon: Ticket,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    label: 'New Ticket'
  },
  ticket_updated: {
    icon: Ticket,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    label: 'Ticket Updated'
  },
  ticket_closed: {
    icon: CheckCircle,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    label: 'Ticket Closed'
  },

  // Message/Communication notifications
  message: {
    icon: MessageCircle,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    label: 'Message'
  },
  conversation: {
    icon: MessageCircle,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    label: 'Conversation'
  },
  message_received: {
    icon: MessageCircle,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    label: 'New Message'
  },

  // Spare request notifications
  spare_request: {
    icon: Combine,
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    label: 'Spare Request'
  },
  spare_request_created: {
    icon: Combine,
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    label: 'New Spare Request'
  },
  spare_request_updated: {
    icon: Combine,
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    label: 'Spare Request Updated'
  },

  // User management notifications
  user: {
    icon: User,
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    label: 'User'
  },
  user_created: {
    icon: User,
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    label: 'New User'
  },
  user_updated: {
    icon: User,
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    label: 'User Updated'
  },

  // Service center notifications
  service_center: {
    icon: Users2,
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    label: 'Service Center'
  },
  service_center_created: {
    icon: Users2,
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    label: 'New Service Center'
  },
  service_center_updated: {
    icon: Users2,
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    label: 'Service Center Updated'
  },

  // Product notifications
  product: {
    icon: Ticket,
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-600',
    label: 'Product'
  },
  product_created: {
    icon: Ticket,
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-600',
    label: 'New Product'
  },
  product_updated: {
    icon: Ticket,
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-600',
    label: 'Product Updated'
  },

  // Inventory notifications
  inventory: {
    icon: Combine,
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-600',
    label: 'Inventory'
  },
  inventory_updated: {
    icon: Combine,
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-600',
    label: 'Inventory Updated'
  },

  // System notifications
  system: {
    icon: Settings,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    label: 'System'
  },
  system_alert: {
    icon: AlertTriangle,
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    label: 'System Alert'
  },

  // Default fallback
  default: {
    icon: Bell,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    label: 'Notification'
  }
};

// Helper function to get notification type configuration
export const getNotificationTypeConfig = (type) => {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.default;
};

// Helper function to render notification icon with proper styling
export const NotificationIcon = ({ type, className = "w-4 h-4" }) => {
  const config = getNotificationTypeConfig(type);
  const Icon = config.icon;
  
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
      <Icon className={`${className} ${config.textColor}`} />
    </div>
  );
};

// Notification priority levels for styling
export const NOTIFICATION_PRIORITIES = {
  low: {
    borderColor: 'border-l-gray-300',
    bgColor: 'bg-gray-50'
  },
  normal: {
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50'
  },
  high: {
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-50'
  },
  urgent: {
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50'
  }
};

export default {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  getNotificationTypeConfig,
  NotificationIcon
};