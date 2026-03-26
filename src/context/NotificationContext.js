import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { socketService } from "service/socket";
import { api } from "service/api";
import { store } from "service/store";
import { toast } from "sonner";

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

  /**
   * Xử lý click vào notification:
   * 1. Gọi backend resolveTarget để vừa mark-as-read vừa lấy route điều hướng
   * 2. Cập nhật local state (is_read, unreadCount)
   * 3. Navigate đến trang tương ứng (có role prefix)
   */
  const handleNotificationClick = useCallback(async (notification, navigate) => {
    const notifId = notification._id || notification.id;
    const wasUnread = !notification.is_read;

    // Optimistically update UI
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setRecentNotifications((prev) =>
        prev.map((n) => (n._id === notifId || n.id === notifId ? { ...n, is_read: true } : n))
      );
    }

    try {
      const res = await api.notifications.resolveTarget(notifId);

      if (!res.ok) {
        // Handle error cases
        if (res.status === 404) {
          toast.error("Nội dung thông báo này không còn tồn tại hoặc đã bị gỡ bỏ.");
        } else if (res.status === 403) {
          toast.error("Bạn không còn quyền truy cập nội dung thông báo này.");
        }
        return;
      }

      const { target } = res.data.data;
      if (!target || !target.route) return;

      // Determine role prefix based on current user
      const currentUser = store.getCurrentUser();
      const rolePrefix = currentUser?.role === "admin" ? "/admin" : `/${currentUser?.role || "student"}`;

      // Build full route with role prefix
      const fullRoute = `${rolePrefix}${target.route}`;
      navigate(fullRoute);
    } catch (err) {
      console.error("Failed to resolve notification target:", err);
      toast.error("Có lỗi xảy ra khi xử lý thông báo.");
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        recentNotifications,
        isConnected,
        markAsRead,
        markAllAsRead,
        handleNotificationClick,
        fetchRecentNotifications,
        fetchUnreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
