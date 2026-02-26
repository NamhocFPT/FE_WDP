// src/component/pages/auth/Login.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { store } from "service/store";
import { Button, Card, CardContent, Input, Badge } from "component/ui";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("admin@smartedu.com");
    const [password, setPassword] = useState("123456");
    const [error, setError] = useState("");

    const onSubmit = (e) => {
        e.preventDefault();
        setError("");

        const user = store.login(email, password);
        if (!user) return setError("Sai tài khoản/mật khẩu (demo: đúng email + password không rỗng).");

        navigate(`/${user.role}`, { replace: true });
    };

    const quickFill = (role) => {
        const map = {
            admin: "admin@smartedu.com",
            teacher: "teacher@smartedu.com",
            student: "student@smartedu.com",
        };
        setEmail(map[role]);
        setPassword("123456");
        setError("");
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* nền + blur nhẹ */}
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
                                    Template UI cho Admin / Teacher / Student (demo).
                                </p>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <Badge tone="blue">admin@smartedu.com</Badge>
                                    <Badge tone="blue">teacher@smartedu.com</Badge>
                                    <Badge tone="blue">student@smartedu.com</Badge>
                                </div>
                                <p className="mt-3 text-xs opacity-70">
                                    Password: nhập gì cũng được (miễn không rỗng).
                                </p>
                            </div>

                            <div className="text-xs opacity-60">
                                © {new Date().getFullYear()} SmartEdu • Demo UI
                            </div>
                        </div>

                        {/* RIGHT LOGIN CARD */}
                        <div className="p-6 sm:p-8">
                            <Card className="border-0 bg-transparent shadow-none">
                                <CardContent className="p-0">
                                    <div className="text-2xl font-extrabold text-slate-900">Sign in</div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        Chọn role demo hoặc nhập email để đăng nhập.
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
                                            />
                                        </div>

                                        <div>
                                            <div className="mb-1 text-xs font-semibold text-slate-600">Password</div>
                                            <Input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        {error ? (
                                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                                                {error}
                                            </div>
                                        ) : null}

                                        <Button className="w-full" type="submit">
                                            Login
                                        </Button>

                                        <div className="flex items-center justify-between text-sm">
                                            <Link
                                                to="/forgot-password"
                                                className="font-semibold text-slate-700 hover:text-slate-900"
                                            >
                                                Forgot password?
                                            </Link>
                                            <span className="text-xs text-slate-500">Demo only</span>
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