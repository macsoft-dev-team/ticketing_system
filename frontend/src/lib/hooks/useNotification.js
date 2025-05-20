import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  updateNotificationStatus,
  appendNotification,
} from "../features/notificationSlice";
import { useEffect } from "react";
import socket from "../socket/socket";
import { useNotificationSound } from "../../components/notification/useNotificationSound";

export default function useNotification() {
  const dispatch = useDispatch();
  const playSound = useNotificationSound();
  const { notifications, loading, error } = useSelector(
    (state) => state.notification
  );
  const { user } = useSelector((state) => state.auth);
  const refetch = () => {
    dispatch(fetchNotifications());
  };

  const updateStatus = (id, status) => {
    dispatch(updateNotificationStatus({ id, status }));
  };

  useEffect(() => {
    const handleNotification = (notification) => {
      console.log(user.id, "notification.userId");
      const _notificationForUser = notification.find(
        (n) => n.userId === user.id
      );
      if (_notificationForUser) {
        console.log("_notificationForUser", _notificationForUser);
        if (user.id === _notificationForUser.userId) {
          playSound();
          if (_notificationForUser) {
            dispatch(appendNotification(_notificationForUser));
          }
        }
      }
   
    };

    // Assuming you have a socket connection set up
    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [dispatch]);

  useEffect(() => {
    refetch();
  }, []);

  return {
    notifications,
    loading,
    error,
    refetch,
    updateStatus,
  };
}
