import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Ticket, MessageCircle, Users2, Combine, User, X } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import useAuth from '../../../../lib/hooks/useAuth';

const NotificationBell = () => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications on component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${baseUrl}/notifications`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const responseData = await response.json();
 
          // Handle the new API response format {success: true, data: [...], count: 70}
          const notificationsArray = responseData.success ? responseData.data : responseData;

          if (Array.isArray(notificationsArray)) {
            const transformedNotifications = notificationsArray.map(item => ({
              id: item.id,
              title: item.notification?.title || 'Notification',
              message: item.notification?.description || item.notification?.content || '',
              type: getNotificationType(item.notification?.type),
              time: formatRelativeTime(item.notification?.createdAt || item.createdAt),
              unread: !item.seen,
              ticketId: item.notification?.ticketId,
              ticketCode: item.notification?.ticket?.ticketCode,
            }));

            setNotifications(transformedNotifications);
            setUnreadCount(transformedNotifications.filter(n => n.unread).length);
           } else {
           }
        } else {
         }
      } catch (error) {
       } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token]);
  

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper functions
  const getNotificationType = (type) => {
    if (!type) return 'system';

    // Message/Conversation notifications
    if (type.includes('conversation') || type.includes('message') || type.includes('chat')) {
      return 'message';
    }

    // Ticket notifications
    if (type.includes('ticket')) {
      return 'ticket';
    }

    // Spare request notifications
    if (type.includes('spare') || type.includes('request') || type === 'SPARE_APPROVED' || type === 'SPARE_REJECTED') {
      return 'spare_request';
    }

    // User management notifications
    if (type.includes('user') || type.includes('account')) {
      return 'user';
    }

    // Service center notifications
    if (type.includes('service') || type.includes('center')) {
      return 'service_center';
    }

    // Product notifications
    if (type.includes('product') || type.includes('item')) {
      return 'product';
    }

    // Inventory notifications
    if (type.includes('inventory') || type.includes('stock')) {
      return 'inventory';
    }

    // System notifications
    if (type.includes('system') || type.includes('alert')) {
      return 'system_alert';
    }

    return 'system';
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.unread);

      // Mark notifications as read on server
      await Promise.all(
        unreadNotifications.map(async (notification) => {
          const baseUrl = import.meta.env.VITE_API_URL;
          return fetch(`${baseUrl}/notifications/${notification.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        })
      );

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
    setIsOpen(false);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (notification.unread) {
      try {
        const baseUrl = import.meta.env.VITE_API_URL;
        await fetch(`${baseUrl}/notifications/${notification.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        setNotifications(prev => prev.map(n =>
          n.id === notification.id ? { ...n, unread: false } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to the appropriate page based on notification type and data
    const { type, ticketId, ticketCode, entityId, entityType, action } = notification;

    setIsOpen(false); // Close dropdown first

    try {
      switch (type) {
        case 'message':
        case 'conversation':
        case 'message_received':
          // Navigate to ticket conversation
          if (ticketId) {
            navigate(`/tickets/${ticketId}#conversation`);
            // Scroll to conversation section after navigation
            setTimeout(() => {
              const conversationElement = document.getElementById('conversation-section');
              if (conversationElement) {
                conversationElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 500);
          }
          break;

        case 'ticket':
        case 'ticket_created':
        case 'ticket_updated':
        case 'ticket_closed':
          // Navigate to ticket details
          if (ticketId) {
            navigate(`/tickets/${ticketId}`);
          } else if (ticketCode) {
            // If only ticket code is available, we might need to parse it
            const ticketMatch = ticketCode.match(/TKT-\d{4}-(\d{3})/);
            const id = ticketMatch ? ticketMatch[1] : ticketCode;
            navigate(`/tickets/${id}`);
          }
          break;

        case 'spare_request':
        case 'spare_request_created':
        case 'spare_request_updated':
          // For approval-related notifications, navigate to spare request page
          // For general users, show their spare requests; for admin/head, show approval page
          if (user?.role === 'MACSOFT_ADMIN' || user?.role === 'MACSOFT_HEAD') {
            // Admin or head users can see the approval page if the notification is about approval
            if (notification.title?.includes('approved') || notification.title?.includes('rejected')) {
              navigate('/spare-request-approval');
            } else {
              navigate('/spare-request');
            }
          } else {
            navigate('/spare-request');
          }
          break;

        case 'user':
        case 'user_created':
        case 'user_updated':
          // Navigate to users management
          if (entityId) {
            navigate(`/users?highlight=${entityId}`);
          } else {
            navigate('/users');
          }
          break;

        case 'service_center':
        case 'service_center_created':
        case 'service_center_updated':
          // Navigate to service centers
          if (entityId) {
            navigate(`/service-centers?highlight=${entityId}`);
          } else {
            navigate('/service-centers');
          }
          break;

        case 'product':
        case 'product_created':
        case 'product_updated':
          // Navigate to products
          if (entityId) {
            navigate(`/products?highlight=${entityId}`);
          } else {
            navigate('/products');
          }
          break;

        case 'inventory':
        case 'inventory_updated':
          // Navigate to inventory
          if (entityId) {
            navigate(`/inventory?highlight=${entityId}`);
          } else {
            navigate('/inventory');
          }
          break;

        case 'system_alert':
        case 'system':
          // Navigate to dashboard for system alerts
          navigate('/dashboard');
          break;

        default:
          // Fallback: if we have a ticket ID, go to ticket, otherwise go to dashboard
          if (ticketId) {
            navigate(`/tickets/${ticketId}`);
          } else {
            navigate('/dashboard');
          }
          break;
      }
    } catch (error) {
      console.error('Error navigating to notification target:', error);
      // Fallback navigation
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white">
            {unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-800">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      notification.unread ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        {notification.type === 'ticket' && <Ticket className="w-4 h-4 text-blue-600" />}
                        {notification.type === 'message' && <MessageCircle className="w-4 h-4 text-green-600" />}
                        {notification.type === 'spare_request' && <Combine className="w-4 h-4 text-purple-600" />}
                        {notification.type === 'user' && <User className="w-4 h-4 text-indigo-600" />}
                        {notification.type === 'service_center' && <Users2 className="w-4 h-4 text-orange-600" />}
                        {notification.type === 'product' && <Ticket className="w-4 h-4 text-teal-600" />}
                        {notification.type === 'inventory' && <Combine className="w-4 h-4 text-yellow-600" />}
                        {(notification.type === 'system' || notification.type === 'system_alert') && <Bell className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;