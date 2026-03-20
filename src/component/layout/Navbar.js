import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { store } from "service/store";
import { Button, Input } from "component/ui";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
    const user = store.getCurrentUser();
    const navigate = useNavigate();

    const onLogout = async () => {
        await store.logout();
        navigate("/login", { replace: true });
    };

    return (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
                <div className="md:hidden text-sm font-extrabold text-slate-900">SmartEdu</div>

                <div className="hidden flex-1 md:block max-w-md">
                    <Input placeholder="Tìm kiếm khóa học, lớp học..." />
                </div>

                <div className="ml-auto flex items-center gap-4">
                    <NotificationBell />

                    <Link to="/profile" className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-slate-200">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                            {(user?.full_name || user?.fullName || "A").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col items-start hidden sm:flex pr-2">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user?.full_name || user?.fullName}</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{user?.role}</span>
                        </div>
                    </Link>
                    
                    <div className="h-8 w-px bg-slate-200 ml-1 mr-1"></div>

                    <Button variant="danger" size="sm" onClick={onLogout}>
                        Đăng xuất
                    </Button>
                </div>
            </div>
        </header>
    );
}