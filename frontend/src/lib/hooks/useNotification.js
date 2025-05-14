import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  updateNotificationStatus,
  appendNotification,
} from "../features/notificationSlice";
import { useEffect } from "react";

export default function useNotification() {
  const dispatch = useDispatch();
  const {
    notifications,
    loading,
    error,
  } = useSelector((state) => state.notifications);

  const refetch = () => {
    dispatch(fetchNotifications());
  };

  const updateStatus = (id, status) => {
    dispatch(updateNotificationStatus({ id, status }));
  };

  useEffect(() => {
    const handleNotification = (notification) => {
      dispatch(appendNotification(notification));
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
