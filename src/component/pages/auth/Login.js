// src/component/pages/auth/Login.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { store } from "service/store";
import { Button, Card, CardContent, Input, Badge } from "component/ui";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState(""); // Xóa admin@smartedu.com mặc định
    const [password, setPassword] = useState(""); // Xóa 123456 mặc định
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false); // Thêm state loading

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Gọi hàm async login từ store
            const user = await store.login(email, password);
            
            // Nếu thành công, chuyển hướng theo role
            navigate(`/${user.role.toLowerCase()}`, { replace: true });
        } catch (err) {
            // Hiển thị lỗi từ backend trả về
            setError(err.message || "Đã xảy ra lỗi hệ thống.");
        } finally {
            setIsLoading(false); // Tắt trạng thái loading
        }
    };

    const quickFill = (role) => {
        const map = {
            admin: "admin@smartedu.com",
            teacher: "teacher@smartedu.com",
            student: "student@smartedu.com",
        };
        setEmail(map[role]);
        setPassword("123456"); // Mật khẩu test chung, bạn có thể sửa lại cho khớp DB
        setError("");
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Nền + blur nhẹ */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-slate-900/10 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
            </div>

            {/* CENTER FULL */}
            <div className="relative flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-5xl">
                    <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-xl backdrop-blur md:grid-cols-2">
                        {/* LEFT BRAND PANEL */}
                        <div className="hidden md:flex flex-col justify-between bg-slate-900 p-8 text-white">
                            <div>
                                <div className="text-sm font-semibold opacity-80">Smart Edu LMS</div>
                                <h1 className="mt-3 text-3xl font-extrabold leading-tight">
                                    Learn. Teach. Manage.
                                    <br />
                                    All in one place.
                                </h1>
                                <p className="mt-3 text-sm opacity-80">
                                    Hệ thống quản lý học tập (LMS).
                                </p>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <Badge tone="blue">Admin</Badge>
                                    <Badge tone="blue">Teacher</Badge>
                                    <Badge tone="blue">Student</Badge>
                                </div>
                            </div>

                            <div className="text-xs opacity-60">
                                © {new Date().getFullYear()} SmartEdu
                            </div>
                        </div>

                        {/* RIGHT LOGIN CARD */}
                        <div className="p-6 sm:p-8">
                            <Card className="border-0 bg-transparent shadow-none">
                                <CardContent className="p-0">
                                    <div className="text-2xl font-extrabold text-slate-900">Sign in</div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        Đăng nhập bằng tài khoản đã cấp.
                                    </div>

                                    {/* quick buttons */}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => quickFill("admin")}
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Admin
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => quickFill("teacher")}
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Teacher
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => quickFill("student")}
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Student
                                        </button>
                                    </div>

                                    <form onSubmit={onSubmit} className="mt-5 space-y-3">
                                        <div>
                                            <div className="mb-1 text-xs font-semibold text-slate-600">Email</div>
                                            <Input
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@smartedu.com"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <div className="mb-1 text-xs font-semibold text-slate-600">Password</div>
                                            <Input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>

                                        {error && (
                                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                                                {error}
                                            </div>
                                        )}

                                        <Button className="w-full" type="submit" disabled={isLoading}>
                                            {isLoading ? "Đang xử lý..." : "Login"}
                                        </Button>

                                        <div className="flex items-center justify-between text-sm">
                                            <Link
                                                to="/forgot-password"
                                                className="font-semibold text-slate-700 hover:text-slate-900"
                                            >
                                                Forgot password?
                                            </Link>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}