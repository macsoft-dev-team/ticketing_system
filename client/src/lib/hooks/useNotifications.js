
import {
    fetchNotifications,
    fetchNotificationsByFilter,
    fetchNotificationCounts,
    fetchNotificationById,
    createNotification,
    updateNotification,   
    enableConversation,
    setNotification,
    setFilter,
    setCurrentFilter,
    setMode,
    clearError,
} from "../lib/features/notifications";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";

export const useNotification = () => {
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
        setNotification: setNotificationCallback,
        fetchNotifications: fetchNotificationsCallback,
        fetchNotificationsByFilter: fetchNotificationsByFilterCallback,
        fetchNotificationCounts: fetchNotificationCountsCallback,
        fetchNotificationById: fetchNotificationByIdCallback,
        updateNotification: updateNotificationCallback,
        createNotification: createNotificationCallback,
        enableConversation: enableConversationCallback,
        setFilter: setFilterCallback,
        setCurrentFilter: setCurrentFilterCallback,
        clearError: clearErrorCallback,
        onPageChange,
        setMode: setModeCallback,
    };
};
