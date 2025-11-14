
import {
    fetchNotifications,
    fetchNotificationsByFilter,
    fetchNotificationCounts,
    fetchNotificationById,
    createNotification,
    updateNotification,   
    enableConversation,
    markAllAsRead,
    setNotification,
    setFilter,
    setCurrentFilter,
    setMode,
    markNotificationAsRead,
    addNotification,
    clearError,
} from "../features/notifications";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";

export const useNotification = () => {
    console.log('🎣 useNotification hook initialized');
    const dispatch = useDispatch();
    const {
        notifications,
        notification,
        counts,
        currentFilter,
        currentPage,
        totalPages,
        filter,
        mode,
        loading,
        error,
    } = useSelector((state) => state.notification);

    const onPageChange = useCallback(
        (skip) => {
            dispatch(fetchNotifications({ skip, take: 10, filter }));
        },
        [dispatch, filter]
    );

    const setNotificationCallback = useCallback(
        (notification) => dispatch(setNotification(notification)),
        [dispatch]
    );

    const fetchNotificationsCallback = useCallback(
        (params) => dispatch(fetchNotifications(params)),
        [dispatch]
    );

    const fetchNotificationsByFilterCallback = useCallback(
        (filterType, params = {}) => {
            dispatch(setCurrentFilter(filterType));
            return dispatch(fetchNotificationsByFilter({ filter: filterType, ...params }));
        },
        [dispatch]
    );

    const fetchNotificationCountsCallback = useCallback(
        () => dispatch(fetchNotificationCounts()),
        [dispatch]
    );

    const fetchNotificationByIdCallback = useCallback(
        (id) => dispatch(fetchNotificationById(id)),
        [dispatch]
    );

    const updateNotificationCallback = useCallback(
        (payload) => dispatch(updateNotification({ notificationId: payload.notificationId, data: payload })),
        [dispatch]
    );

 
    const setFilterCallback = useCallback(
        (filter) => dispatch(setFilter(filter)),
        [dispatch]
    );

    const setModeCallback = useCallback(
        (mode) => dispatch(setMode(mode)),
        [dispatch]
    );
    const createNotificationCallback = useCallback(
        (data) => dispatch(createNotification(data)),
        [dispatch]
    );
    const setCurrentFilterCallback = useCallback(
        (filterType) => dispatch(setCurrentFilter(filterType)),
        [dispatch]
    );

    const clearErrorCallback = useCallback(
        () => dispatch(clearError()),
        [dispatch]
    );

    const enableConversationCallback = useCallback(
        (notificationId) => dispatch(enableConversation(notificationId)),
        [dispatch]
    );

    const markAllAsReadCallback = useCallback(
        () => dispatch(markAllAsRead()),
        [dispatch]
    );

    const markAsReadCallback = useCallback(
        (notificationId) => {
            // Optimistic update
            dispatch(markNotificationAsRead(notificationId));
            // Server update
            return dispatch(updateNotification({ notificationId, data: {} }));
        },
        [dispatch]
    );

    const addNotificationCallback = useCallback(
        (notificationData) => dispatch(addNotification(notificationData)),
        [dispatch]
    );

    // Utility functions
    const getNotificationType = useCallback((type) => {
        if (!type) return 'system';
        if (type.includes('conversation') || type.includes('message') || type.includes('chat')) return 'message';
        if (type.includes('ticket')) return 'ticket';
        if (type.includes('spare') || type.includes('request')) return 'spare_request';
        if (type.includes('user') || type.includes('account')) return 'user';
        if (type.includes('service') || type.includes('center')) return 'service_center';
        if (type.includes('product') || type.includes('item')) return 'product';
        if (type.includes('inventory') || type.includes('stock')) return 'inventory';
        if (type.includes('system') || type.includes('alert')) return 'system_alert';
        return 'system';
    }, []);

    const formatRelativeTime = useCallback((timestamp) => {
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
    }, []);

    const getTypeLabel = useCallback((type) => {
        switch (type) {
            case 'ticket': return 'Ticket';
            case 'message': return 'Message';
            case 'spare_request': return 'Spare Request';
            case 'user': return 'User';
            case 'service_center': return 'Service Center';
            case 'product': return 'Product';
            case 'inventory': return 'Inventory';
            case 'system_alert': return 'System Alert';
            default: return 'System';
        }
    }, []);

    const handleNotificationNavigation = useCallback((notification, navigate) => {
        const { type, ticketId, ticketCode, entityId } = notification;

        try {
            switch (type) {
                case 'message':
                case 'conversation':
                case 'message_received':
                    if (ticketId) {
                        navigate(`/tickets/${ticketId}#conversation`);
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
                    if (ticketId) {
                        navigate(`/tickets/${ticketId}`);
                    } else if (ticketCode) {
                        const ticketMatch = ticketCode.match(/TKT-\d{4}-(\d{3})/);
                        const id = ticketMatch ? ticketMatch[1] : ticketCode;
                        navigate(`/tickets/${id}`);
                    }
                    break;
                case 'spare_request':
                case 'spare_request_created':
                case 'spare_request_updated':
                    navigate('/spare-requests');
                    break;
                case 'user':
                case 'user_created':
                case 'user_updated':
                    navigate(entityId ? `/users?highlight=${entityId}` : '/users');
                    break;
                case 'service_center':
                case 'service_center_created':
                case 'service_center_updated':
                    navigate(entityId ? `/service-centers?highlight=${entityId}` : '/service-centers');
                    break;
                case 'product':
                case 'product_created':
                case 'product_updated':
                    navigate(entityId ? `/products?highlight=${entityId}` : '/products');
                    break;
                case 'inventory':
                case 'inventory_updated':
                    navigate(entityId ? `/inventory?highlight=${entityId}` : '/inventory');
                    break;
                case 'system_alert':
                case 'system':
                    navigate('/dashboard');
                    break;
                default:
                    if (ticketId) {
                        navigate(`/tickets/${ticketId}`);
                    } else {
                        navigate('/dashboard');
                    }
                    break;
            }
        } catch (error) {
            console.error('Error navigating to notification target:', error);
            navigate('/dashboard');
        }
    }, []);
    // Calculate unread count from notifications
    const unreadCount = notifications.filter(n => !n.seen).length;

    return {
        notifications,
        notification,
        counts,
        currentFilter,
        currentPage,
        totalPages,
        filter,
        loading,
        mode,
        error,
        unreadCount,
        setNotification: setNotificationCallback,
        fetchNotifications: fetchNotificationsCallback,
        fetchNotificationsByFilter: fetchNotificationsByFilterCallback,
        fetchNotificationCounts: fetchNotificationCountsCallback,
        fetchNotificationById: fetchNotificationByIdCallback,
        updateNotification: updateNotificationCallback,
        createNotification: createNotificationCallback,
        enableConversation: enableConversationCallback,
        markAllAsRead: markAllAsReadCallback,
        markAsRead: markAsReadCallback,
        addNotification: addNotificationCallback,
        setFilter: setFilterCallback,
        setCurrentFilter: setCurrentFilterCallback,
        clearError: clearErrorCallback,
        onPageChange,
        setMode: setModeCallback,
        // Utility functions
        getNotificationType,
        formatRelativeTime,
        getTypeLabel,
        handleNotificationNavigation,
    };
};
