import React, { useState } from "react";
import { Bell, Check, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "context/NotificationContext";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function NotificationBell() {
  const {
    unreadCount,
    recentNotifications,
    markAllAsRead,
    handleNotificationClick,
  } = useNotification();
  
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  const onNotificationClick = async (notification) => {
    setIsOpen(false);
    await handleNotificationClick(notification, navigate);
  };

  const handleSeeAll = () => {
    setIsOpen(false);
    navigate("/notifications");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:bg-slate-100 mr-2 border border-slate-200">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white transform translate-x-1/4 -translate-y-1/4 ring-2 ring-white">
              {displayCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="z-50 w-80 rounded-md border border-slate-200 bg-white p-0 shadow-lg outline-none max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <span className="font-semibold text-slate-800">Thông báo</span>
          {unreadCount > 0 && (
            <button
              onClick={async () => await markAllAsRead()}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto max-h-[300px]">
          {recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              Không có thông báo nào.
            </div>
          ) : (
            recentNotifications.map((notif) => (
              <div
                key={notif._id || notif.id}
                onClick={() => onNotificationClick(notif)}
                className={`flex flex-col gap-1 p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                  !notif.is_read ? "bg-blue-50/50" : ""
                }`}
              >
                <div className={`text-sm ${!notif.is_read ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                  {notif.title}
                </div>
                {(notif.body || notif.message) && (
                  <div className={`text-xs ${!notif.is_read ? "text-slate-700" : "text-slate-500"} line-clamp-2 whitespace-pre-line`}>
                    {notif.body || notif.message}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                  <Clock className="h-3 w-3" />
                  {(notif.sent_at || notif.created_at) ? formatDistanceToNow(new Date(notif.sent_at || notif.created_at), { addSuffix: true, locale: vi }) : "Vừa xong"}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-2 border-t border-slate-100">
          <button
            onClick={handleSeeAll}
            className="w-full rounded-sm py-2 text-sm font-medium text-blue-600 hover:bg-slate-50 transition-colors"
          >
            Xem tất cả thông báo
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
