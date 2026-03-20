import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { api } from "service/api";
import { useNavigate } from "react-router-dom";
import { useNotification } from "context/NotificationContext";
import { Clock, CheckCircle2, ChevronLeft, ChevronRight, Bell } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUnreadOnly, setIsUnreadOnly] = useState(false);

  const navigate = useNavigate();
  const { markAsRead, markAllAsRead } = useNotification();

  const fetchNotifications = async (currentPage, unreadOnly) => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
      };
      if (unreadOnly) {
        params.is_read = false;
      }
      const res = await api.notifications.getNotifications(params);
      if (res.ok) {
        setNotifications(res.data.data.notifications || res.data.data.items || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch notifications page:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page, isUnreadOnly);
  }, [page, isUnreadOnly]);

  const handleFilterChange = (checked) => {
    setIsUnreadOnly(checked);
    setPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      // Refresh list locally
      fetchNotifications(page, isUnreadOnly);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification._id || notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === (notification._id || notification.id)
            ? { ...n, is_read: true }
            : n
        )
      );
    }

    // Navigate logic based on ref_type
    const id = notification.ref_id;
    switch (notification.ref_type) {
      case "SESSION":
        navigate(`/schedule/${id}`);
        break;
      case "ASSESSMENT":
        navigate(`/assessments/${id}`);
        break;
      case "GRADE":
        navigate(`/grades/${id}`);
        break;
      case "SYSTEM":
      default:
        break;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Tất cả thông báo
          </h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý và cập nhật thông tin mới nhất.</p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              checked={isUnreadOnly}
              onChange={(e) => handleFilterChange(e.target.checked)}
            />
            Chỉ xem chưa đọc
          </label>

          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <Bell className="h-12 w-12 text-slate-200 mb-3" />
            <p>Không tìm thấy thông báo nào.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id || notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 sm:p-6 transition-colors cursor-pointer hover:bg-slate-50 flex flex-col sm:flex-row gap-4 sm:items-center justify-between ${
                !notif.is_read ? "bg-blue-50/30" : ""
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  {!notif.is_read && (
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600 flex-shrink-0"></span>
                  )}
                  <h3 className={`text-base ${!notif.is_read ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                    {notif.title}
                  </h3>
                </div>
                {(notif.body || notif.message) && (
                  <p className={`text-sm ml-[22px] whitespace-pre-line ${!notif.is_read ? "text-slate-700" : "text-slate-500"}`}>
                    {notif.body || notif.message}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-400 sm:ml-4 whitespace-nowrap">
                <Clock className="h-3.5 w-3.5" />
                {(notif.sent_at || notif.created_at) ? format(new Date(notif.sent_at || notif.created_at), "HH:mm, dd/MM/yyyy", { locale: vi }) : "N/A"}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Trang <span className="font-semibold text-slate-900">{page}</span> / <span className="font-semibold">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
