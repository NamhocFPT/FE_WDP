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
        <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
                <div className="md:hidden text-sm font-extrabold text-slate-900">SmartEdu</div>

                <div className="hidden flex-1 md:block">
                    <Input placeholder="Search courses, classes..." />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Link to="/profile" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                        {user?.fullName || "Profile"}
                    </Link>
                    <Button variant="outline" onClick={() => navigate("/change-password")}>
                        Change Password
                    </Button>
                    <Button variant="danger" onClick={onLogout}>
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
}