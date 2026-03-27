import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
  const refetchTimerRef = useRef(null);
  
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
      fetchUnreadCount();
      fetchRecentNotifications();

      const socket = socketService.connect();
      if (socket) setIsConnected(true);

      const handleNewNotification = (notification) => {
        setUnreadCount((prev) => prev + 1);
        setRecentNotifications((prev) => [notification, ...prev].slice(0, 10));

        // Socket-pushed notifications don't have DB id yet.
        // Refetch after a short delay so we get proper IDs for navigation.
        if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
        refetchTimerRef.current = setTimeout(() => {
          fetchRecentNotifications();
        }, 800);
      };

      socketService.on("new_notification", handleNewNotification);

      return () => {
        socketService.off("new_notification", handleNewNotification);
        socketService.disconnect();
        setIsConnected(false);
        if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
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
   * Click handler cho notification:
   * - Đánh dấu đã đọc (fire-and-forget, không chặn navigation)
   * - Điều hướng theo ref_type:
   *   + SESSION → /schedule (instant, client-side)
   *   + GRADE → /grades hoặc /grading (instant, client-side)
   *   + STREAM_POST, STREAM_COMMENT, ASSESSMENT → gọi resolve API để lấy class_id
   *   + SYSTEM → chỉ mark-as-read, không điều hướng
   */
  const handleNotificationClick = useCallback(async (notification, navigate) => {
    const notifId = notification._id || notification.id;
    const wasUnread = !notification.is_read;

    // 1. Optimistically update UI
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setRecentNotifications((prev) =>
        prev.map((n) => {
          const nId = n._id || n.id;
          return nId && nId === notifId ? { ...n, is_read: true } : n;
        })
      );
    }

    // 2. Determine role prefix
    const currentUser = store.getCurrentUser();
    const rolePrefix = currentUser?.role === "admin" ? "/admin" : `/${currentUser?.role || "student"}`;
    const refType = notification.ref_type;

    // 3. Handle types that can navigate instantly (no server lookup needed)
    if (refType === "SESSION") {
      // Mark as read in background
      if (notifId && wasUnread) {
        api.notifications.readNotification(notifId).catch(() => {});
      }
      navigate(`${rolePrefix}/schedule`);
      return;
    }

    if (refType === "GRADE") {
      if (notifId && wasUnread) {
        api.notifications.readNotification(notifId).catch(() => {});
      }
      if (currentUser?.role === "student") {
        navigate(`${rolePrefix}/grades`);
      } else {
        navigate(`${rolePrefix}/grading`);
      }
      return;
    }

    // 4. Handle types that need class_id from server (STREAM_POST, STREAM_COMMENT, ASSESSMENT)
    if (["STREAM_POST", "STREAM_COMMENT", "ASSESSMENT"].includes(refType) && notifId) {
      try {
        const res = await api.notifications.resolveTarget(notifId);

        if (res.ok && res.data?.data?.target?.route) {
          navigate(`${rolePrefix}${res.data.data.target.route}`);
          return;
        }

        // Error handling
        if (res.status === 404) {
          toast.error("Nội dung thông báo này không còn tồn tại hoặc đã bị gỡ bỏ.");
        } else if (res.status === 403) {
          toast.error("Bạn không còn quyền truy cập nội dung thông báo này.");
        }
      } catch (err) {
        console.error("Failed to resolve notification target:", err);
        toast.error("Có lỗi xảy ra khi xử lý thông báo.");
      }
      return;
    }

    // 5. For STREAM types without ID (from socket, ID not yet available):
    //    mark as read skipped (no ID), just show a toast
    if (["STREAM_POST", "STREAM_COMMENT", "ASSESSMENT"].includes(refType) && !notifId) {
      toast.info("Đang tải thông báo, vui lòng thử lại sau giây lát.");
      // Trigger a refetch so next click will have the ID
      fetchRecentNotifications();
      return;
    }

    // 6. SYSTEM or unknown types – just mark as read, no navigation
    if (notifId && wasUnread) {
      api.notifications.readNotification(notifId).catch(() => {});
    }
  }, [fetchRecentNotifications]);

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
