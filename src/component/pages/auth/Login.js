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

    // (quickFill removed)

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

    const [view, setView] = useState("login"); // 'login', 'forgot', 'otp', 'reset'
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const { ok, data } = await api.forgotPassword(email);
            if (!ok || !data.success) {
                return setError(data.message || "Tài khoản không tồn tại trên hệ thống.");
            }
            setView("otp");
        } catch (err) {
            setError("Lỗi kết nối server.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        setError("");
        if (otp.length !== 6) return setError("Mã OTP gồm 6 chữ số.");
        setView("reset");
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const { ok, data } = await api.resetPassword({ email, otp, newPassword });
            if (!ok || !data.success) {
                return setError(data.message || "Không thể đặt lại mật khẩu.");
            }
            alert("Đổi mật khẩu thành công! Vui lòng Đăng nhập lại.");
            setView("login");
            setPassword("");
            setOtp("");
            setNewPassword("");
        } catch (err) {
            setError("Lỗi kết nối server.");
        } finally {
            setIsLoading(false);
        }
    };

    if (view === "login") {
        return (
            <div className="bg-white min-h-screen flex flex-col font-sans">
                <style>{`
                    .bg-dots {
                        background-color: #001a40;
                        background-image: radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 40%),
                                          radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.05) 0%, transparent 40%);
                        position: relative;
                        overflow: hidden;
                    }
                    .circle-shape {
                        position: absolute;
                        border-radius: 50%;
                        border: 40px solid rgba(255, 255, 255, 0.03);
                    }
                    .circle-1 { width: 600px; height: 600px; top: -100px; left: -200px; }
                    .circle-2 { width: 400px; height: 400px; bottom: -50px; right: -100px; }
                    .circle-3 { width: 300px; height: 300px; top: 20%; right: 10%; border-width: 20px; }
                    .material-symbols-outlined {
                        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    }
                `}</style>

                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>

                <main className="flex-grow flex flex-col lg:flex-row">
                    {/* Brand Side (Left) */}
                    <div className="lg:w-1/2 bg-dots min-h-[40vh] lg:min-h-screen flex flex-col justify-center px-8 lg:px-20 relative text-white">
                        <div className="circle-shape circle-1"></div>
                        <div className="circle-shape circle-2"></div>
                        <div className="circle-shape circle-3"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-16">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#001a40] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                                </div>
                                <span className="font-headline text-2xl font-extrabold tracking-tight">SmartEdu</span>
                            </div>
                            <h1 className="font-headline text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
                                Đăng nhập vào<br/>tài khoản của bạn
                            </h1>
                            <p className="text-white/70 text-lg lg:text-xl max-w-md font-medium">
                                Nâng tầm tri thức cho thế hệ tương lai!
                            </p>
                        </div>
                    </div>

                    {/* Form Side (Right) */}
                    <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-20 bg-slate-50">
                        <div className="w-full max-w-[480px]">
                            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 lg:p-12">
                                <form onSubmit={onSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-slate-600" htmlFor="email">Email hoặc Tên đăng nhập</label>
                                        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 px-4 py-3 rounded-lg transition-all text-slate-800 placeholder:text-slate-400" id="email" placeholder="nhap@smartedu.edu.vn" type="text" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-slate-600" htmlFor="password">Mật khẩu</label>
                                        <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 px-4 py-3 rounded-lg transition-all text-slate-800 placeholder:text-slate-400" id="password" placeholder="••••••••••••" type="password" required />
                                    </div>

                                    {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">{error}</div>}

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500/20" id="remember" type="checkbox" />
                                            <span className="text-sm text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Ghi nhớ tôi</span>
                                        </label>
                                        <button type="button" onClick={() => { setView("forgot"); setError(""); }} className="text-sm font-semibold text-blue-600 hover:underline">Quên mật khẩu?</button>
                                    </div>

                                    <button className="w-full bg-[#0056B3] text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-[#001a40] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20" type="submit" disabled={isLoading}>
                                        {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                                    </button>
                                </form>

                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-100"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase tracking-widest text-slate-400 font-bold">
                                        <span className="px-4 bg-white">Hoặc</span>
                                    </div>
                                </div>

                                <button onClick={() => loginWithGoogle()} className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3.5 px-6 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                    </svg>
                                    Đăng nhập bằng Google
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="w-full border-t border-slate-200 bg-white py-6 px-8 flex-shrink-0">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-base font-bold text-[#0056B3]">SmartEdu</span>
                            <span className="text-slate-400 text-sm">© {new Date().getFullYear()} SmartEdu.</span>
                        </div>
                    </div>
                </footer>
            </div>
        );
    }

    return (
        <div className="bg-login-gradient font-body text-white min-h-screen flex flex-col relative overflow-hidden font-sans">
            <style>{`
                .bg-login-gradient {
                    background: linear-gradient(135deg, #001a40 0%, #003f87 100%);
                }
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
            `}</style>

            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>

            <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] border-[60px] border-blue-400/10 rounded-full -z-10"></div>
            <div className="fixed bottom-[-20%] right-[-5%] w-[70%] h-[70%] border-[80px] border-blue-800/20 rounded-full -z-10"></div>

            <main className="flex-grow flex items-center justify-center px-6 py-12">
                <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-12 lg:gap-24">
                    
                    {/* Left Brand Side */}
                    <div className="w-full md:w-1/2 text-left space-y-8">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <div className="w-4 h-4 bg-white rounded-full"></div>
                            </div>
                            <span className="text-3xl font-bold tracking-tight text-white font-headline">SmartEdu</span>
                        </div>
                        <div className="space-y-4">
                            <h1 className="font-headline text-4xl lg:text-5xl font-bold text-white leading-tight">
                                {view === "forgot" && "Lấy lại quyền truy cập tài khoản"}
                                {view === "otp" && "Xác thực tài khoản"}
                                {view === "reset" && "Tạo mật khẩu cá nhân"}
                            </h1>
                            <p className="text-blue-100/80 text-lg max-w-md">
                                {view === "forgot" && "Chúng tôi sẽ giúp bạn khôi phục mật khẩu để tiếp tục hành trình học tập."}
                                {view === "otp" && "Vui lòng nhập mã bảo mật chúng tôi vừa gửi đến Email của bạn."}
                                {view === "reset" && "Mật khẩu mới của bạn cần có độ bảo mật cao hơn."}
                            </p>
                        </div>
                    </div>

                    {/* Right Card Side */}
                    <div className="w-full md:w-[480px]">
                        <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-2xl text-slate-800">
                             
                             {view === "forgot" && (
                                 <form onSubmit={handleForgotPassword} className="space-y-6">
                                     <div>
                                         <h2 className="text-2xl font-bold text-[#001a40] mb-2">Quên mật khẩu?</h2>
                                         <p className="text-slate-500 text-sm">Nhập địa chỉ email của bạn để nhận mã OTP đặt lại mật khẩu.</p>
                                     </div>
                                     <div className="space-y-2">
                                         <label className="block text-sm font-medium text-slate-600">Địa chỉ Email</label>
                                         <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 outline-none placeholder:text-slate-400" placeholder="name@school.edu" type="email" required />
                                     </div>
                                     {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">{error}</div>}
                                     <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                                         <button type="button" onClick={() => { setView("login"); setError(""); }} className="text-sm font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                                              <span className="material-symbols-outlined text-lg">arrow_back</span> Quay lại Đăng nhập
                                         </button>
                                         <button className="w-full sm:w-auto bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 active:scale-95 shadow-lg" type="submit" disabled={isLoading}>{isLoading ? "Đang gửi..." : "Gửi mã OTP"}</button>
                                     </div>
                                 </form>
                             )}

                             {view === "otp" && (
                                 <form onSubmit={handleVerifyOtp} className="space-y-6">
                                     <div>
                                         <h2 className="text-2xl font-bold text-[#001a40] mb-2">Xác thực OTP</h2>
                                         <p className="text-sm text-slate-500">Mã bảo mật đã được gửi về email: <b>{email}</b></p>
                                     </div>
                                     <div className="space-y-2">
                                         <label className="block text-sm font-medium text-slate-600">Mã OTP (6 số)</label>
                                         <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 text-center text-xl font-bold outline-none" placeholder="000000" type="text" required />
                                     </div>
                                     {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">{error}</div>}
                                     <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                                         <button type="button" onClick={() => { setView("forgot"); setError(""); }} className="text-sm font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                                              <span className="material-symbols-outlined text-lg">arrow_back</span> Nhập lại Email
                                         </button>
                                         <button className="w-full sm:w-auto bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700" type="submit">Xác thực</button>
                                     </div>
                                 </form>
                             )}

                             {view === "reset" && (
                                 <form onSubmit={handleResetPassword} className="space-y-6">
                                     <div>
                                         <h2 className="text-2xl font-bold text-[#001a40] mb-2">Đặt lại mật khẩu</h2>
                                         <p className="text-sm text-slate-500">Hoàn tất đặt mật khẩu mới.</p>
                                     </div>
                                     <div className="space-y-2">
                                         <label className="block text-sm font-medium text-slate-600">Mật khẩu mới</label>
                                         <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="••••••••••••" required />
                                     </div>
                                     {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">{error}</div>}
                                     <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 active:scale-95 shadow-lg" type="submit" disabled={isLoading}>{isLoading ? "Đang xử lý..." : "Đăng nhập lại"}</button>
                                 </form>
                             )}

                             <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                                 <p className="text-xs text-slate-400 leading-relaxed">Gặp khó khăn? Kiểm tra Spam hoặc liên hệ <a className="text-blue-600 font-medium hover:underline" href="#">IT</a>.</p>
                             </div>
                         </div>
                     </div>
                </div>
            </main>

            <footer className="w-full py-8 px-6 flex-shrink-0">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-blue-200/50 text-xs">© {new Date().getFullYear()} SmartEdu. All Rights Reserved.</p>
                    <nav className="flex gap-6">
                        <a className="text-blue-200/50 hover:text-white text-xs transition-colors" href="#">Terms of Service</a>
                        <a className="text-blue-200/50 hover:text-white text-xs transition-colors" href="#">Privacy Policy</a>
                        <a className="text-blue-200/50 hover:text-white text-xs transition-colors" href="#">Help Center</a>
                    </nav>
                </div>
            </footer>
        </div>
    );
}