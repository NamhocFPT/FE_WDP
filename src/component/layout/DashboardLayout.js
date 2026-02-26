// src/component/layout/DashboardLayout.js
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { store } from "service/store";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ requiredRole }) {
    const user = store.getCurrentUser();
    const location = useLocation();

    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (requiredRole && user.role !== requiredRole) return <Navigate to="/forbidden" replace />;

    return (
        <div className="min-h-screen bg-slate-50 w-full">
            {/* bỏ mx-auto + max-w-7xl */}
            <div className="flex w-full">
                <Sidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                    <Navbar />
                    <main className="p-4 sm:p-6 w-full">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}