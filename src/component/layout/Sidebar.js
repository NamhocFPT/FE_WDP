// src/component/layout/Sidebar.js
import React from "react";
import { NavLink } from "react-router-dom";
import { store } from "service/store";
import { cn, Badge } from "component/ui";

const navByRole = {
    admin: [
        { to: "/admin", label: "Dashboard" },
        { to: "/admin/users", label: "Users" },
        { to: "/admin/courses", label: "Courses" },
        { to: "/admin/classes", label: "Classes" },
        { to: "/admin/schedule", label: "Schedule" },
        { to: "/admin/reports", label: "Reports" },
    ],
    teacher: [
        { to: "/teacher", label: "Dashboard" },
        { to: "/teacher/schedule", label: "Schedule" },
        { to: "/teacher/materials", label: "Materials" },
        { to: "/teacher/classes", label: "Assignments" }, // Đổi tên từ Assignments -> My Classes
        { to: "/teacher/quizzes", label: "Quizzes" },
        { to: "/teacher/grading", label: "Grading" },
    ],
    student: [
        { to: "/student", label: "Dashboard" },
        { to: "/student/classes", label: "My Classes" },
        { to: "/student/grades", label: "Grades" },
    ],
};

export default function Sidebar() {
    const user = store.getCurrentUser();
    // Đảm bảo roleKey luôn khớp (chuyển về chữ thường)
    const roleKey = user?.role?.toLowerCase();
    const items = navByRole[roleKey] || [];

    return (
        <aside className="sticky top-0 hidden h-screen w-64 border-r border-slate-200 bg-white p-4 md:block">
            <div className="flex items-center justify-between mb-6">
                <div className="text-xl font-extrabold tracking-tight text-slate-900">SmartEdu</div>
                <Badge tone="blue" className="uppercase text-[10px]">{user?.role}</Badge>
            </div>

            <nav className="space-y-1">
                {items.map((it) => (
                    <NavLink
                        key={it.to}
                        to={it.to}
                        // end=true để tránh active Dashboard khi vào các trang con
                        end={it.to === "/admin" || it.to === "/teacher" || it.to === "/student"}
                        className={({ isActive }) =>
                            cn(
                                "block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                                isActive 
                                    ? "bg-slate-900 text-white shadow-md" 
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )
                        }
                    >
                        {it.label}
                    </NavLink>
                ))}
            </nav>

            <div className="absolute bottom-4 left-4 right-4 border-t border-slate-100 pt-4">
                <p className="text-[10px] text-slate-400 font-medium">Hệ thống LMS thông minh v1.0</p>
            </div>
        </aside>
    );
}