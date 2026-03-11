// src/component/layout/DashboardLayout.js
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { store } from "service/store";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ requiredRole }) {
    const user = store.getCurrentUser();
    const location = useLocation();

    // 1. Nếu chưa đăng nhập -> về trang login
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    
    // 2. Kiểm tra quyền truy cập (Case-insensitive)
    if (requiredRole && user.role?.toUpperCase() !== requiredRole.toUpperCase()) {
        return <Navigate to="/forbidden" replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="flex">
                {/* Sidebar cố định bên trái */}
                <Sidebar />
                
                <div className="flex min-w-0 flex-1 flex-col">
                    {/* Navbar cố định phía trên */}
                    <Navbar />
                    
                    {/* Nội dung trang thay đổi theo route */}
                    <main className="p-4 sm:p-6 lg:p-8">
                        <div className="mx-auto max-w-6xl">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}