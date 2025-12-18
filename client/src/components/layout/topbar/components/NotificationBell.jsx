import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Ticket, MessageCircle, Users2, Combine, User, X } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import useAuth from '../../../../lib/hooks/useAuth';
import { useSocketActivities } from '../../../../lib/hooks/useSocketActivities';
import { useSoundManager } from '../../../../lib/hooks/SoundManager';
import { useToast } from '../../../ui/toast';
import { useSocket } from '../../../../lib/contexts/SocketContext';
import useTitleNotification from '../../../../lib/hooks/useTitleNotification';

const NotificationBell = () => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Use socket activities for real-time notifications
  const {
    isConnected,
    notifications: socketNotifications,
    unreadNotifications,
    markNotificationAsRead,
    clearNotifications
  } = useSocketActivities();

  // Sound manager for notification sounds
  const { play } = useSoundManager();

  // Toast notifications for visual feedback
  const { addToast } = useToast();

  // Socket context for current ticket tracking
  const { currentTicketId } = useSocket();

  // Transform socket notifications to match UI format
  const [notifications, setNotifications] = useState([]); // Only first 20 for display
  const [allNotifications, setAllNotifications] = useState([]); // All notifications for count
  const [unreadCount, setUnreadCount] = useState(0);
  const lastNotificationCountRef = useRef(0);
  const initialLoadCompleteRef = useRef(false);

  // Update local state when socket notifications change
  useEffect(() => {
    if (socketNotifications && socketNotifications.length > 0) {
      // Always merge socket notifications with existing ones to prevent replacement
      const transformedSocketNotifications = socketNotifications.map(item => ({
        id: item.id || Date.now() + Math.random(),
        title: item.title || 'Notification',
        message: item.message || item.description || '',
        type: getNotificationType(item.type),
        time: formatRelativeTime(item.timestamp || item.createdAt),
        unread: !item.seen,
        ticketId: item.ticketId,
        ticketCode: item.ticketCode,
        rawData: item
      }));

      // Merge new notifications with existing ones, avoiding duplicates
      setAllNotifications(prevAll => {
        const existingIds = new Set(prevAll.map(n => n.id));
        const newNotifications = transformedSocketNotifications.filter(n => !existingIds.has(n.id));

        if (newNotifications.length > 0) {
          // Add new notifications to the beginning
          return [...newNotifications, ...prevAll];
        }

        // If no new notifications, just update existing ones
        const updatedNotifications = prevAll.map(existing => {
          const updated = transformedSocketNotifications.find(n => n.id === existing.id);
          return updated || existing;
        });

        return updatedNotifications;
      });

      // Update displayed notifications (first 20)
      setNotifications(prevDisplayed => {
        const existingIds = new Set(prevDisplayed.map(n => n.id));
        const newNotifications = transformedSocketNotifications.filter(n => !existingIds.has(n.id));

        if (newNotifications.length > 0) {
          const combined = [...newNotifications, ...prevDisplayed];
          return combined.slice(0, 20);
        }

        // Update existing displayed notifications
        const updatedNotifications = prevDisplayed.map(existing => {
          const updated = transformedSocketNotifications.find(n => n.id === existing.id);
          return updated || existing;
        });

        return updatedNotifications.slice(0, 20);
      });

      // Update unread count
      setUnreadCount(unreadNotifications || transformedSocketNotifications.filter(n => n.unread).length);
    }
  }, [socketNotifications, unreadNotifications]);

  // Track shown toast notifications to prevent duplicates
  const shownToastIds = useRef(new Set());

  // Detect new notifications and show toast + play sound
  useEffect(() => {
    if (socketNotifications && socketNotifications.length > 0) {
      socketNotifications.forEach(notification => {
        // Only show toast for unseen notifications that haven't been shown yet
        if (!notification.seen && !shownToastIds.current.has(notification.id)) {
          // Check if notification is related to current ticket (handle both string and number types)
          const notifTicketId = parseInt(notification.ticketId);
          const currTicketId = parseInt(currentTicketId);
          const metaTicketId = notification.metadata?.ticketId ? parseInt(notification.metadata.ticketId) : null;
          const isCurrentTicketNotification = currentTicketId &&
            (notifTicketId === currTicketId ||
              (metaTicketId && metaTicketId === currTicketId));

          if (!isCurrentTicketNotification) {
            // Show toast notification for different tickets
            addToast({
              id: `notification-${notification.id}`,
              title: notification.title || 'New Notification',
              description: notification.message || notification.description || '',
              variant: 'default',
              duration: 5000,
            });

            // Mark this notification as shown
            shownToastIds.current.add(notification.id);
          }
        }
      });
    }
  }, [socketNotifications, currentTicketId, addToast]);

  // Also detect unread count changes for sound
  useEffect(() => {
    if (unreadCount > 0 && notifications.length > 0) {
      const latestNotification = notifications[0];
    }
  }, [unreadCount, notifications]);

  // Fetch initial notifications from API (fallback)
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token || socketNotifications.length > 0) return; // Skip if we have socket notifications

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
          const notificationsArray = responseData.success ? responseData.data : responseData;

          if (Array.isArray(notificationsArray) && socketNotifications.length === 0) {
            const allTransformedNotifications = notificationsArray.map(item => ({
              id: item.notification?.id || item.id, // Use notification ID, fallback to recipient ID
              title: item.notification?.title || 'Notification',
              message: item.notification?.description || item.notification?.content || '',
              type: getNotificationType(item.notification?.type),
              time: formatRelativeTime(item.notification?.createdAt || item.createdAt),
              unread: !item.seen,
              ticketId: item.notification?.ticketId,
              ticketCode: item.notification?.ticket?.ticketCode,
            }));

            // Store all notifications and set only first 20 for display
            setAllNotifications(allTransformedNotifications);
            setNotifications(allTransformedNotifications.slice(0, 20));
            setUnreadCount(allTransformedNotifications.filter(n => n.unread).length);
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token, socketNotifications]);


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
    if (markingAllAsRead) return; // Prevent multiple clicks

    setMarkingAllAsRead(true);
    try {
      // Use all notifications for marking as read, not just displayed ones
      const unreadNotifications = allNotifications.filter(n => n.unread);

      // Mark notifications as read using socket system
      unreadNotifications.forEach(notification => {
        markNotificationAsRead(notification.id);
      });

      // Also try to mark as read on server if possible
      if (token && unreadNotifications.length > 0) {
        try {
          const baseUrl = import.meta.env.VITE_API_URL;
          const notificationIds = unreadNotifications.map(n => n.id);
          
          // Send all notification IDs in a single request
          const response = await fetch(`${baseUrl}/notifications/mark-all-read`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notificationIds })
          });

          if (response.ok) {
            // Update local state immediately after successful API call
            setAllNotifications(prevAll => 
              prevAll.map(notification => ({ ...notification, unread: false }))
            );
            
            setNotifications(prevDisplayed => 
              prevDisplayed.map(notification => ({ ...notification, unread: false }))
            );
            
            setUnreadCount(0);
          }
        } catch (error) {
          console.warn('Could not mark notifications as read on server:', error);
        }
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    } finally {
      setMarkingAllAsRead(false);
      setIsOpen(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread using socket system
    if (notification.unread) {
      markNotificationAsRead(notification.id);

      // Also try to mark as read on server if possible
      if (token) {
        try {
          const baseUrl = import.meta.env.VITE_API_URL;
          const response = await fetch(`${baseUrl}/notifications/${notification.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            // Update local state immediately after successful API call
            setAllNotifications(prevAll => 
              prevAll.map(n => 
                n.id === notification.id ? { ...n, unread: false } : n
              )
            );
            
            setNotifications(prevDisplayed => 
              prevDisplayed.map(n => 
                n.id === notification.id ? { ...n, unread: false } : n
              )
            );
            
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        } catch (error) {
          console.warn('Could not mark notification as read on server:', error);
        }
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
              navigate('/spare-request-approval');
            }
          } else {
            navigate('/spare-request-approval');
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
          navigate('/');
          break;

        default:
          // Fallback: if we have a ticket ID, go to ticket, otherwise go to dashboard
          if (ticketId) {
            navigate(`/tickets/${ticketId}`);
          } else {
            navigate(`/tickets/${ticketId}`);
          }
          break;
      }
    } catch (error) {
      console.error('Error navigating to notification target:', error);
      // Fallback navigation
      navigate(`/tickets/${ticketId}`);
    }
  };
  useTitleNotification(unreadCount);
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={toggleNotifications}
          title="Notifications"
          className="p-2 text-gray-400 cursor-pointer hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6" />
        </button>

        {/* Badge for unread count */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleNotifications();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute rounded-full min-w-[1.25rem] px-1.5 py-0.5 font-bold cursor-pointer -top-1 -right-1 flex items-center justify-center text-[0.6rem] bg-red-500 text-white border-2 border-white hover:bg-red-600 transition-colors"
            style={{ 
              zIndex: 1000,
              pointerEvents: 'auto',
              position: 'absolute'
            }}
            title={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </button>
        )}
      </div>
      {isOpen && (
        <div className="absolute -right-14 sm:right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                title={isConnected ? 'Real-time connected' : 'Disconnected - using cached data'}
              />
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markingAllAsRead}
                  className={`text-sm cursor-pointer transition-colors flex items-center space-x-1 ${markingAllAsRead
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-800'
                    }`}
                  title="Mark all as read"
                >
                  {markingAllAsRead && (
                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
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
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${notification.unread ? 'bg-blue-50' : ''
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

          {/* Footer - Always show */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            {allNotifications.length > notifications.length && (
              <p className="text-xs text-gray-500 text-center mb-2">
                Showing {notifications.length} of {allNotifications.length} notifications
              </p>
            )}
            {user.role !== "CUSTOMER_FIELD_ENGINEER" && user.role !== "CUSTOMER_SERVICE_HEAD" && (
              <button
                className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
              >
                View all notifications
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;