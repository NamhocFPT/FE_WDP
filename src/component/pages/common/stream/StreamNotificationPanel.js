import React, { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useNotification } from "context/NotificationContext";
import { Bell, Clock, ChevronDown, CheckCircle2 } from "lucide-react";
import { api } from "service/api";

export default function StreamNotificationPanel() {
  const { recentNotifications, markAsRead, markAllAsRead } = useNotification();
  const navigate = useNavigate();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [extraNotifications, setExtraNotifications] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Hiển thị tối đa 10 thông báo nếu chưa expand, nếu expand hiển thị tất cả
  const displayNotifications = isExpanded 
    ? [...recentNotifications, ...extraNotifications]
    : recentNotifications.slice(0, 6);

  const fetchMoreNotifications = async () => {
    setIsLoadingMore(true);
    try {
      // Bỏ qua số lượng đã có trong recentNotifications
      const offset = recentNotifications.length;
      const res = await api.notifications.getNotifications({ 
        limit: 15,
        page: Math.floor(offset / 15) + 2 // Giả sử limit là 15 cho API
      });
      
      if (res.ok) {
        const newNotifs = res.data.data.notifications || res.data.data.items || [];
        // Lọc các thông báo đã có trong recentNotifications
        const uniqueNewNotifs = newNotifs.filter(
          newNotif => !recentNotifications.some(existing => (existing._id || existing.id) === (newNotif._id || newNotif.id))
        );
        setExtraNotifications(prev => {
           const merged = [...prev, ...uniqueNewNotifs];
           // Ensure local uniqueness too
           const unique = [];
           const ids = new Set();
           for (const item of merged) {
             const id = item._id || item.id;
             if (!ids.has(id)) {
               ids.add(id);
               unique.push(item);
             }
           }
           return unique;
        });
      }
    } catch (error) {
      console.error("Failed to fetch more notifications:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleExpand = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      fetchMoreNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification._id || notification.id);
      
      // Update local state for extra notifications if it was from there
      setExtraNotifications(prev => 
        prev.map(n => 
          (n._id || n.id) === (notification._id || notification.id) 
            ? { ...n, is_read: true } 
            : n
        )
      );
    }

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
        // Do nothing for system or unknown types if they don't have a route
        break;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6 flex flex-col h-[calc(100vh-100px)]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4 text-blue-500" />
          Thông báo mới
        </h3>
        <button 
          onClick={() => markAllAsRead()}
          className="text-slate-400 hover:text-blue-600 transition-colors"
          title="Đánh dấu tất cả đã đọc"
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>
      </div>

      <div className={`divide-y divide-slate-100 overflow-y-auto custom-scrollbar flex-1`}>
        {displayNotifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500 flex flex-col items-center">
            <Bell className="h-8 w-8 text-slate-200 mb-2" />
            Không có thông báo nào.
          </div>
        ) : (
          displayNotifications.map((notif) => (
            <div
              key={notif._id || notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 flex gap-3 ${
                !notif.is_read ? "bg-blue-50/20" : ""
              }`}
            >
              <div className="mt-1 flex-shrink-0">
                {!notif.is_read ? (
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1"></div>
                ) : (
                  <div className="h-2 w-2 rounded-full bg-transparent mt-1"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 pb-1">
                <h4 className={`text-[13px] leading-tight mb-1 truncate ${!notif.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                  {notif.title}
                </h4>
                {(notif.body || notif.message) && (
                  <p className={`text-[12px] line-clamp-2 leading-relaxed mb-1.5 ${!notif.is_read ? 'text-slate-600' : 'text-slate-500'}`}>
                    {notif.body || notif.message}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="h-3 w-3" />
                  {(notif.sent_at || notif.created_at) ? format(new Date(notif.sent_at || notif.created_at), "HH:mm, dd/MM", { locale: vi }) : "N/A"}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoadingMore && (
           <div className="p-4 flex justify-center">
             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
           </div>
        )}
      </div>

      {!isExpanded && recentNotifications.length >= 10 ? (
        <button
          onClick={handleExpand}
          className="w-full p-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 border-t border-slate-100 bg-white flex-shrink-0 mt-auto"
        >
          Xem thêm các thông báo <ChevronDown className="h-3 w-3" />
        </button>
      ) : (
        <div className="mt-auto bg-white flex-shrink-0"></div>
      )}
    </div>
  );
}
