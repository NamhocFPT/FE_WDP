import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { store } from "service/store";
import { cn } from "component/ui";
import { navByRole } from "./navigation";
import { LayoutGrid, Users, BookOpen, Calendar, PieChart, FileText, Bookmark, GraduationCap, Bell, ChevronDown, ChevronRight, Newspaper } from "lucide-react";

export default function Sidebar() {
    const user = store.getCurrentUser();
    const location = useLocation();
    const { id: paramId, classId: paramClassId } = useParams();

    const classIdMatch = location.pathname.match(/\/(?:teacher|student|admin)\/classes\/([a-zA-Z0-9_-]+)/);
    const classIdFromPath = classIdMatch ? classIdMatch[1] : null;

    const classId = paramClassId || paramId || classIdFromPath;
    const roleKey = user?.role?.toLowerCase();
    const navItems = navByRole[roleKey] || [];

    const isAdminClassDetail = location.pathname.includes("/admin/classes/") && classId;
    const isTeacherClassDetail = (location.pathname.includes("/teacher/classes/") || location.pathname.includes("/teacher/grading/")) && classId;
    const isStudentClassDetail = location.pathname.includes("/student/classes/") && classId;

    // State for collapsible menus
    const [expandedItems, setExpandedItems] = useState({ "Bài tập": true });

    const toggleExpand = (label) => {
        setExpandedItems(prev => ({ ...prev, [label]: !prev[label] }));
    };

    let items = [];
    let title = "";

    const iconMap = {
        "Tổng quan": <LayoutGrid size={18} />,
        "Giáo viên": <Users size={18} />,
        "Học sinh": <Users size={18} />,
        "Lịch học": <Calendar size={18} />,
        "Bài tập / Dự án": <FileText size={18} />,
        "Học liệu": <Bookmark size={18} />,
        "Bảng điểm": <GraduationCap size={18} />,
        "Điểm danh": <LayoutGrid size={18} />,
        "Danh sách lớp": <BookOpen size={18} />,
        "Tóm tắt": <PieChart size={18} />,
        "Trắc nghiệm": <FileText size={18} />,
        "Tự luận": <FileText size={18} />,
        "Kết quả": <GraduationCap size={18} />,
        "Tài liệu học tập": <Bookmark size={18} />,
        "Thông báo": <Bell size={18} />,
        "Bảng tin": <Newspaper size={18} />
    };

    if (isAdminClassDetail) {
        title = "Chi tiết lớp học";
        items = [
            { to: `/admin/classes/${classId}?tab=Overview`, label: "Tổng quan", id: "Overview" },
            { to: `/admin/classes/${classId}?tab=Teachers`, label: "Giáo viên", id: "Teachers" },
            { to: `/admin/classes/${classId}?tab=Students`, label: "Học sinh", id: "Students" },
            { to: `/admin/classes/${classId}?tab=Schedule`, label: "Lịch học", id: "Schedule" },
        ];
    } else if (isTeacherClassDetail) {
        title = "Quản lý lớp học";
        items = [
            { to: `/teacher/classes/${classId}`, label: "Tổng quan", end: true },
            { to: `/teacher/classes/${classId}/stream`, label: "Bảng tin" },
            {
                label: "Bài tập",
                icon: <FileText size={18} />,
                children: [
                    { to: `/teacher/classes/${classId}/assignments?type=quiz`, label: "Trắc nghiệm" },
                    { to: `/teacher/classes/${classId}/assignments?type=essay`, label: "Tự luận" },
                ]
            },
            { to: `/teacher/classes/${classId}/materials`, label: "Học liệu" },
            { to: `/teacher/classes/${classId}/gradebook`, label: "Bảng điểm" },
        ];
    } else if (isStudentClassDetail) {
        title = "Chi tiết lớp học";
        items = [
            { to: `/student/classes/${classId}?tab=stream`, label: "Bảng tin", id: "stream" },
            { to: `/student/classes/${classId}?tab=overview`, label: "Tổng quan", id: "overview" },
            { to: `/student/classes/${classId}?tab=materials`, label: "Học liệu", id: "materials" },
            {
                label: "Bài tập",
                icon: <FileText size={18} />,
                children: [
                    { to: `/student/classes/${classId}?tab=quizzes`, label: "Trắc nghiệm", id: "quizzes" },
                    { to: `/student/classes/${classId}?tab=assignments`, label: "Tự luận", id: "assignments" },
                ]
            },
            { to: `/student/classes/${classId}?tab=announcements`, label: "Thông báo", id: "announcements" },
            { to: `/student/classes/${classId}/grades`, label: "Bảng điểm", id: "grades" },
        ];
    } else {
        const activeMainTab = navItems.find(item => location.pathname.startsWith(item.to));
        if (!activeMainTab || !activeMainTab.children || activeMainTab.children.length === 0) {
            return null;
        }
        title = activeMainTab.label;
        items = activeMainTab.children;
    }

    return (
        <aside className="hidden h-[calc(100vh-64px)] w-64 flex-shrink-0 border-r border-slate-100 bg-white p-6 md:block overflow-y-auto animate-in slide-in-from-left-4 duration-500">
            <div className="mb-8">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 py-1 bg-slate-50 rounded-md inline-block">
                    {title}
                </div>
            </div>

            <nav className="space-y-1">
                {items.map((it, idx) => {
                    if (it.children) {
                        const isAnyChildActive = it.children.some(child =>
                            (isStudentClassDetail && child.id && location.search.includes(`tab=${child.id}`)) ||
                            (!isStudentClassDetail && (location.pathname + location.search).includes(child.to))
                        );
                        const isExpanded = expandedItems[it.label];

                        return (
                            <div key={idx} className="space-y-1">
                                <button
                                    onClick={() => toggleExpand(it.label)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-all duration-200 rounded-xl hover:bg-slate-50",
                                        isAnyChildActive ? "text-blue-600" : "text-slate-400 hover:text-slate-900"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {it.icon || iconMap[it.label] || <LayoutGrid size={18} />}
                                        <span className="uppercase tracking-wider">{it.label}</span>
                                    </div>
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>

                                {isExpanded && (
                                    <div className="ml-4 border-l-2 border-slate-100 pl-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                        {it.children.map((child, cidx) => (
                                            <NavLink
                                                key={cidx}
                                                to={child.to}
                                                className={({ isActive }) => {
                                                    const isTabActive = (isAdminClassDetail || isStudentClassDetail)
                                                        ? (child.id && (location.search.includes(`tab=${child.id}`) || location.pathname.endsWith(`/${child.id}`)))
                                                        : (child.to.includes('?') ? (location.pathname + location.search === child.to) : isActive);
                                                    return cn(
                                                        "flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200",
                                                        isTabActive
                                                            ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 rounded-l-none translate-x-1"
                                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-none border-none"
                                                    );
                                                }}
                                            >
                                                {child.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <NavLink
                            key={idx}
                            to={it.to}
                            end={it.end}
                            className={({ isActive }) => {
                                const isTabActive = (isAdminClassDetail || isStudentClassDetail)
                                    ? (it.id && location.search.includes(`tab=${it.id}`))
                                    : (location.pathname + location.search === it.to || (it.to?.indexOf('?') === -1 && isActive));
                                return cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200",
                                    isTabActive
                                        ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 rounded-l-none translate-x-1"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-none border-none"
                                );
                            }}
                        >
                            {it.icon || iconMap[it.label] || <LayoutGrid size={18} />}
                            {it.label}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}