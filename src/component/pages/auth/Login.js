// src/component/pages/auth/Login.js
import React, { useState } from "react";
import { useGoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from "react-router-dom";
import { store } from "service/store";
import { api } from "service/api";
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
            const { ok, data } = await api.login(email, password);
            if (!ok || !data.success) {
                return setError(data.message || "Sai tài khoản/mật khẩu.");
            }

            store.setAuth(data.data.token, data.data.user);
            const user = store.getCurrentUser();
            
            if (user.must_change_password) {
                navigate("/force-change-password", { replace: true });
            } else {
                navigate(`/${user.role}`, { replace: true });
            }
        } catch (err) {
            setError("Lỗi kết nối server.");
        } finally {
            setIsLoading(false);
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

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            setError("");
            try {
                const { ok, data } = await api.googleLogin(tokenResponse.access_token);
                if (!ok || !data.success) {
                    return setError(data.message || "Đăng nhập Google thất bại.");
                }

                store.setAuth(data.data.token, data.data.user);
                const user = store.getCurrentUser();
                
                if (user.must_change_password) {
                    navigate("/force-change-password", { replace: true });
                } else {
                    navigate(`/${user.role}`, { replace: true });
                }
            } catch (err) {
                setError("Lỗi kết nối server.");
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => setError("Lỗi đăng nhập Google."),
    });

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

                                    <div className="mt-6 flex flex-col gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full flex items-center justify-center gap-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 h-11"
                                            onClick={() => loginWithGoogle()}
                                            disabled={isLoading}
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                            </svg>
                                            Đăng nhập bằng Google
                                        </Button>

                                        <div className="relative flex items-center py-2">
                                            <div className="flex-grow border-t border-slate-200"></div>
                                            <span className="flex-shrink-0 mx-4 text-xs font-semibold text-slate-400 tracking-wider">HOẶC BẰNG EMAIL</span>
                                            <div className="flex-grow border-t border-slate-200"></div>
                                        </div>
                                    </div>

                                    <form onSubmit={onSubmit} className="mt-2 space-y-3">
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

                            {/* mobile hint */}
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:hidden">
                                <div className="font-semibold text-slate-900">Demo accounts</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Badge tone="blue">admin@smartedu.com</Badge>
                                    <Badge tone="blue">teacher@smartedu.com</Badge>
                                    <Badge tone="blue">student@smartedu.com</Badge>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">Password: bất kỳ (không rỗng)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}