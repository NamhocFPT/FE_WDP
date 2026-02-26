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
        { to: "/teacher/assignments", label: "Assignments" },
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
    const items = navByRole[user?.role] || [];

    return (
        <aside className="sticky top-0 hidden h-screen w-64 border-r border-slate-200 bg-white p-4 md:block">
            <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold tracking-tight text-slate-900">SmartEdu</div>
                <Badge tone="blue">{user?.role}</Badge>
            </div>

            <div className="mt-4 space-y-1">
                {items.map((it) => (
                    <NavLink
                        key={it.to}
                        to={it.to}
                        end={it.to === "/admin" || it.to === "/teacher" || it.to === "/student"}
                        className={({ isActive }) =>
                            cn(
                                "block rounded-lg px-3 py-2 text-sm font-semibold",
                                isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                            )
                        }
                    >
                        {it.label}
                    </NavLink>
                ))}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
                Tip: bạn có thể vào <span className="font-semibold">Profile</span> để đổi tên demo.
            </div>
        </aside>
    );
}