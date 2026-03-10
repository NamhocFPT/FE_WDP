// src/component/layout/Navbar.js
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { store } from "service/store";
import { Button, Input } from "component/ui";

export default function Navbar() {
    const user = store.getCurrentUser();
    const navigate = useNavigate();

    const onLogout = () => {
        store.logout();
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
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-bold text-slate-900">{user?.full_name || user?.fullName}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{user?.role}</span>
                    </div>
                    
                    <div className="h-8 w-px bg-slate-200"></div>

                    <Button variant="danger" size="sm" onClick={onLogout}>
                        Đăng xuất
                    </Button>
                </div>
            </div>
        </header>
    );
}