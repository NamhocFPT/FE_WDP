import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "service/store";
import { api } from "service/api";
import { Button, Card, CardContent, Input } from "component/ui";
import { ShieldCheck, LockKeyhole } from "lucide-react";

export default function ForceChangePassword() {
    const navigate = useNavigate();
    const currentUser = store.getCurrentUser();
    
    const [oldP, setOldP] = useState("");
    const [newP, setNewP] = useState("");
    const [cfm, setCfm] = useState("");
    const [msg, setMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!currentUser) {
        navigate("/login", { replace: true });
        return null;
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        setMsg("");

        if (!oldP) return setMsg("Vui lòng nhập mật khẩu hiện tại.");
        if (!newP || newP.length < 6) return setMsg("Mật khẩu mới phải có ít nhất 6 ký tự.");
        if (newP !== cfm) return setMsg("Xác nhận mật khẩu không khớp.");

        setIsLoading(true);
        try {
            const { ok, data } = await api.changePassword(oldP, newP);
            if (!ok || !data.success) {
                return setMsg(data.error?.validationErrors?.[0]?.message || data.message || "Đổi mật khẩu thất bại.");
            }
            
            // Password updated successfully -> Clear flag
            store.updateProfile({ must_change_password: false });
            
            // Navigate to appropriate role dashboard
            navigate(`/${currentUser.role}`, { replace: true });
        } catch (err) {
            setMsg("Lỗi kết nối máy chủ.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

            <div className="w-full max-w-md relative z-10">
                <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl">
                    <CardContent className="p-8">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner">
                                <ShieldCheck className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold flex items-center justify-center gap-2 text-slate-800">
                                Đổi Mật Khẩu <LockKeyhole className="w-5 h-5" />
                            </h2>
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                Để bảo mật tài khoản, vui lòng thay đổi mật khẩu mặc định của bạn trước khi tiếp tục truy cập hệ thống.
                            </p>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Mật khẩu hiện tại</label>
                                <Input
                                    type="password"
                                    value={oldP}
                                    placeholder="••••••••"
                                    onChange={(e) => setOldP(e.target.value)}
                                    className="h-11 px-4 text-sm"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Mật khẩu mới</label>
                                <Input
                                    type="password"
                                    value={newP}
                                    placeholder="Ít nhất 6 ký tự"
                                    onChange={(e) => setNewP(e.target.value)}
                                    className="h-11 px-4 text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Xác nhận mật khẩu</label>
                                <Input
                                    type="password"
                                    value={cfm}
                                    placeholder="Nhập lại mật khẩu mới"
                                    onChange={(e) => setCfm(e.target.value)}
                                    className="h-11 px-4 text-sm"
                                    required
                                />
                            </div>

                            {msg && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                    <p className="text-sm text-red-600 font-medium text-center">{msg}</p>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className="w-full h-11 text-sm font-semibold mt-2 shadow-lg shadow-blue-500/30"
                                disabled={isLoading}
                            >
                                {isLoading ? "Đang xử lý..." : "Cập Nhật & Tiếp Tục"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
