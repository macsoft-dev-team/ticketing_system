import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useNotification } from '../../lib/hooks/useNotifications';
import { getNotificationIcon } from './NotificationIcons';

const NotificationBell = () => {
    const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, handleNotificationNavigation } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Fetch notifications on component mount
    useEffect(() => {
        console.log('🔔 NotificationBell mounting, fetching notifications...');
        fetchNotifications({ skip: 0, take: 20, filter: "all" });
    }, [fetchNotifications]);

    // Debug notifications data
    useEffect(() => {
        console.log('🔔 Notifications data:', {
            count: notifications.length,
            unreadCount,
            loading,
            notifications: notifications.slice(0, 3) // First 3 for debugging
        });
    }, [notifications, unreadCount, loading]);

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

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        setIsOpen(false);
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read if unread
        if (notification.unread) {
            await markAsRead(notification.id);
        }

        setIsOpen(false); // Close dropdown first
        handleNotificationNavigation(notification, navigate);
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
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => fetchNotifications({ skip: 0, take: 20, filter: "all" })}
                                disabled={loading}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Refresh notifications"
                            >
                                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
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
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
                                                {getNotificationIcon(notification.type)}
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
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-xs text-gray-400">
                                                        {notification.time}
                                                    </p>
                                                    {notification.ticketCode && (
                                                        <span className="text-xs text-blue-600 font-medium">
                                                            {notification.ticketCode}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 bg-gray-50">
                            <button
                                className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/notifications');
                                }}
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;