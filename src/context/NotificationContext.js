import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { socketService } from "service/socket";
import { api } from "service/api";
import { store } from "service/store";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const user = store.getCurrentUser();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.notifications.getUnreadCount();
      if (res.ok) setUnreadCount(res.data.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  const fetchRecentNotifications = useCallback(async () => {
    try {
      const res = await api.notifications.getNotifications({ limit: 10 });
      if (res.ok) setRecentNotifications(res.data.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch recent notifications:", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch initial data
      fetchUnreadCount();
      fetchRecentNotifications();

      // Connect socket
      const socket = socketService.connect();
      if (socket) setIsConnected(true);

      const handleNewNotification = (notification) => {
        setUnreadCount((prev) => prev + 1);
        setRecentNotifications((prev) => [notification, ...prev].slice(0, 10));
        // You can also add sound/toast here if desired
      };

      socketService.on("new_notification", handleNewNotification);

      return () => {
        socketService.off("new_notification", handleNewNotification);
        socketService.disconnect();
        setIsConnected(false);
      };
    }
  }, [user, fetchUnreadCount, fetchRecentNotifications]);

  const markAsRead = async (id) => {
    try {
      const res = await api.notifications.readNotification(id);
      if (res.ok) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setRecentNotifications((prev) =>
          prev.map((n) => (n._id === id || n.id === id ? { ...n, is_read: true } : n))
        );
      }
      return res.ok;
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await api.notifications.readAllNotifications();
      if (res.ok) {
        setUnreadCount(0);
        setRecentNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
      return res.ok;
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        recentNotifications,
        isConnected,
        markAsRead,
        markAllAsRead,
        fetchRecentNotifications,
        fetchUnreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
