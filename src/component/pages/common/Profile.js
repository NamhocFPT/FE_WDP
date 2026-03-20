import React, { useState, useEffect } from "react";
import { store } from "service/store";
import { api } from "service/api";
import { PageHeader, Card, CardContent, Input, Button } from "component/ui";
import { User, Shield, CheckCircle2 } from "lucide-react";

export default function Profile() {
    const u = store.getCurrentUser();
    
    const [activeTab, setActiveTab] = useState("personal");
    
    // Profile State
    const [fullName, setFullName] = useState(u?.fullName || "");
    const [email, setEmail] = useState(u?.email || "");
    const [profileSaved, setProfileSaved] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Password State
    const [oldP, setOldP] = useState("");
    const [newP, setNewP] = useState("");
    const [cfm, setCfm] = useState("");
    const [pwdMsg, setPwdMsg] = useState("");
    const [pwdSuccess, setPwdSuccess] = useState(false);
    const [isSavingPwd, setIsSavingPwd] = useState(false);

    useEffect(() => {
        api.getProfile().then(({ ok, data }) => {
            if (ok && data.success) {
                const profile = data.data;
                setFullName(profile.full_name || "");
                setEmail(profile.email || "");
                const currentUser = store.getCurrentUser();
                store.setAuth(store.getToken(), { ...currentUser, ...profile });
            }
        }).catch(() => { });
    }, []);

    const onSaveProfile = async () => {
        setProfileError("");
        setProfileSaved(false);
        setIsSavingProfile(true);
        try {
            const { ok, data } = await api.updateProfile({ full_name: fullName });
            if (!ok || !data.success) {
                setProfileError(data.error?.validationErrors?.[0]?.message || data.message || "Không thể cập nhật hồ sơ.");
            } else {
                setProfileSaved(true);
                setTimeout(() => setProfileSaved(false), 3000);
                const currentUser = store.getCurrentUser();
                store.setAuth(store.getToken(), { ...currentUser, ...data.data });
            }
        } catch (err) {
            setProfileError("Lỗi kết nối máy chủ.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const onChangePassword = async (e) => {
        e.preventDefault();
        setPwdMsg("");
        setPwdSuccess(false);

        if (!oldP) return setPwdMsg("Vui lòng nhập mật khẩu cũ.");
        if (!newP || newP.length < 6) return setPwdMsg("Mật khẩu mới phải có ít nhất 6 ký tự.");
        if (newP !== cfm) return setPwdMsg("Xác nhận mật khẩu không khớp.");

        setIsSavingPwd(true);
        try {
            const { ok, data } = await api.changePassword(oldP, newP);
            if (!ok || !data.success) {
                setPwdMsg(data.error?.validationErrors?.[0]?.message || data.message || "Đổi mật khẩu thất bại.");
            } else {
                setPwdSuccess(true);
                setPwdMsg("Đổi mật khẩu thành công!");
                setOldP("");
                setNewP("");
                setCfm("");
                setTimeout(() => setPwdSuccess(false), 3000);
            }
        } catch {
            setPwdMsg("Lỗi kết nối máy chủ.");
        } finally {
            setIsSavingPwd(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <PageHeader 
                title="Cài đặt tài khoản" 
                subtitle="Quản lý thông tin cá nhân và bảo mật tài khoản của bạn." 
            />

            <div className="mt-8 flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="md:w-64 shrink-0">
                    <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        <button
                            onClick={() => setActiveTab("personal")}
                            className={`flex justify-start items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                                activeTab === "personal" 
                                ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100" 
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <User className="w-5 h-5" />
                            Thông tin cá nhân
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`flex justify-start items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                                activeTab === "security" 
                                ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100" 
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <Shield className="w-5 h-5" />
                            Bảo mật & Mật khẩu
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    {activeTab === "personal" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                                <CardContent className="p-6 sm:p-8">
                                    <div className="mb-6 border-b border-slate-100 pb-5">
                                        <h3 className="text-lg font-bold text-slate-900">Thông tin cá nhân</h3>
                                        <p className="text-sm text-slate-500 mt-1">Cập nhật tên hiển thị và email liên hệ của bạn.</p>
                                    </div>

                                    <div className="space-y-6 max-w-lg">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và Tên</label>
                                            <Input 
                                                value={fullName} 
                                                onChange={(e) => setFullName(e.target.value)} 
                                                className="h-11"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                                            <Input 
                                                value={email} 
                                                disabled 
                                                className="bg-slate-50 text-slate-500 h-11"
                                                title="Không thể thay đổi email"
                                            />
                                        </div>

                                        {profileError && (
                                            <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                                {profileError}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                                            <Button 
                                                onClick={onSaveProfile} 
                                                className="h-11 px-6 font-semibold"
                                                disabled={isSavingProfile}
                                            >
                                                {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                                            </Button>
                                            {profileSaved && (
                                                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 animate-in fade-in zoom-in duration-300">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Đã lưu thành công
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                                <CardContent className="p-6 sm:p-8">
                                    <div className="mb-6 border-b border-slate-100 pb-5">
                                        <h3 className="text-lg font-bold text-slate-900">Đổi mật khẩu</h3>
                                        <p className="text-sm text-slate-500 mt-1">Đảm bảo tài khoản của bạn đang sử dụng một mật khẩu dài, ngẫu nhiên để an toàn.</p>
                                    </div>

                                    <form onSubmit={onChangePassword} className="space-y-5 max-w-lg">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
                                            <Input 
                                                type="password" 
                                                value={oldP} 
                                                onChange={(e) => setOldP(e.target.value)} 
                                                className="h-11"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu mới</label>
                                            <Input 
                                                type="password" 
                                                value={newP} 
                                                onChange={(e) => setNewP(e.target.value)} 
                                                placeholder="Ít nhất 6 ký tự"
                                                className="h-11"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
                                            <Input 
                                                type="password" 
                                                value={cfm} 
                                                onChange={(e) => setCfm(e.target.value)} 
                                                className="h-11"
                                            />
                                        </div>

                                        {pwdMsg && (
                                            <div className={`text-sm font-medium p-3 rounded-lg border ${pwdSuccess ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                                                {pwdSuccess && <CheckCircle2 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />}
                                                {pwdMsg}
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-slate-100">
                                            <Button 
                                                type="submit" 
                                                className="h-11 px-6 font-semibold"
                                                disabled={isSavingPwd}
                                            >
                                                {isSavingPwd ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}