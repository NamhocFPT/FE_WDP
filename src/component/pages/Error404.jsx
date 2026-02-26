// src/pages/Error404.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Error404() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
            {/* Background: glow blobs */}
            <div className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-44 -right-32 h-[520px] w-[520px] rounded-full bg-cyan-500/20 blur-3xl" />

            {/* Background: subtle grid */}
            <div className="pointer-events-none absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10)_0px,transparent_55%)]" />
            </div>

            <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-14">
                <div className="w-full">
                    {/* Top badge */}
                    <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 backdrop-blur">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
                        404 • Not Found
                    </div>

                    {/* Card */}
                    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl md:grid-cols-2">
                        {/* Left */}
                        <div className="p-8 md:p-12">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                                <span className="text-slate-300">Status:</span>
                                <span className="font-semibold text-white">Missing route</span>
                            </div>

                            <h1 className="mt-5 text-6xl font-extrabold tracking-tight md:text-7xl">
                                <span className="bg-gradient-to-r from-fuchsia-300 via-white to-cyan-300 bg-clip-text text-transparent">
                                    404
                                </span>
                            </h1>

                            <h2 className="mt-3 text-2xl font-semibold text-white">
                                Không tìm thấy trang
                            </h2>

                            <p className="mt-3 text-base leading-relaxed text-slate-300">
                                Trang bạn đang truy cập không tồn tại, có thể đã bị đổi đường dẫn
                                hoặc bị xoá. Bạn có thể quay lại hoặc về trang chủ.
                            </p>

                            {/* Actions */}
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    to="/"
                                    className="group inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0"
                                >
                                    Về trang chủ
                                    <span className="ml-2 inline-block transition group-hover:translate-x-0.5">
                                        →
                                    </span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
                                >
                                    Quay lại
                                </button>

                                <a
                                    href="mailto:support@yourapp.com?subject=404%20Report"
                                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/5 active:translate-y-0"
                                >
                                    Báo lỗi
                                </a>
                            </div>

                            {/* Tips */}
                            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                                <div className="text-xs font-medium text-slate-200">
                                    Gợi ý nhanh
                                </div>
                                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                                    <li>• Kiểm tra lại URL (chữ hoa/thường, dấu /)</li>
                                    <li>• Thử về trang chủ rồi điều hướng lại</li>
                                    <li>• Nếu link từ bên ngoài, có thể đã hết hạn</li>
                                </ul>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="relative border-t border-white/10 p-8 md:border-l md:border-t-0 md:p-12">
                            {/* Mini browser mock */}
                            <div className="rounded-2xl border border-white/10 bg-slate-950/40 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                    <div className="flex gap-2">
                                        <span className="h-3 w-3 rounded-full bg-red-400/80" />
                                        <span className="h-3 w-3 rounded-full bg-yellow-300/80" />
                                        <span className="h-3 w-3 rounded-full bg-green-400/80" />
                                    </div>
                                    <span className="text-xs text-slate-300">/not-found</span>
                                </div>

                                <div className="p-4">
                                    <div className="rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs text-slate-200">
                                        <div className="opacity-70">$ GET /page</div>
                                        <div className="mt-2 text-rose-300">
                                            Error: 404 Not Found
                                        </div>
                                        <div className="mt-2 opacity-70">
                                            Try: <span className="text-slate-100">/</span> or go back
                                        </div>
                                    </div>

                                    {/* Pills */}
                                    <div className="mt-4 grid grid-cols-3 gap-3">
                                        {["Docs", "Home", "Support"].map((t) => (
                                            <div
                                                key={t}
                                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs text-slate-200 transition hover:bg-white/10"
                                            >
                                                {t}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Floating orb */}
                            <div className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-gradient-to-br from-fuchsia-400/20 via-cyan-400/10 to-transparent blur-2xl" />
                            <div className="pointer-events-none absolute -top-8 right-10 h-24 w-24 rounded-full bg-white/5 blur-xl" />

                            {/* Footer note */}
                            <div className="mt-6 text-xs text-slate-400">
                                © {new Date().getFullYear()} • Nếu bạn nghĩ đây là lỗi hệ thống,
                                hãy gửi report.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}