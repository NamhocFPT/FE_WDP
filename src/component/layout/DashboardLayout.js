// src/component/layout/DashboardLayout.js
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { store } from "service/store";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { NotificationProvider } from "context/NotificationContext";

export default function DashboardLayout({ requiredRole }) {
  const user = store.getCurrentUser();
  const location = useLocation();

  // 1. Nếu chưa đăng nhập -> về trang login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // 2. Kiểm tra quyền truy cập (case-insensitive)
  if (
    requiredRole &&
    user.role?.toUpperCase() !== requiredRole.toUpperCase()
  ) {
    return <Navigate to="/forbidden" replace />;
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-[#f8fafc] w-full flex flex-col overflow-hidden">
        {/* Navbar on Top - Full Width */}
        <Navbar />

        <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] items-stretch">
          {/* Sidebar below Navbar */}
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 w-full animate-in fade-in duration-500 h-full">
            <div className="mx-auto max-w-[1700px] w-full min-h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}