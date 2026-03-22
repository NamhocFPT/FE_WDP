import React, { useState, useEffect } from "react";
import { store } from "service/store";
import { api } from "service/api";
import { PageHeader, Card, CardContent, Input, Button, Textarea } from "component/ui";
import { User, Shield, CheckCircle2, Camera, Mail, Phone, FileText, Loader2, Trash2 } from "lucide-react";

export default function Profile() {
    const u = store.getCurrentUser();
    
    const [activeTab, setActiveTab] = useState("personal");
    
    // Profile State
    const [fullName, setFullName] = useState(u?.fullName || "");
    const [email, setEmail] = useState(u?.email || "");
    const [phone, setPhone] = useState(u?.phone || "");
    const [bio, setBio] = useState(u?.bio || "");
    const [avatarUrl, setAvatarUrl] = useState(u?.avatarUrl || "");
    const [profileSaved, setProfileSaved] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

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
                setPhone(profile.phone || "");
                setBio(profile.bio || "");
                setAvatarUrl(profile.avatar_url || "");
                const currentUser = store.getCurrentUser();
                store.setAuth(store.getToken(), { 
                    ...currentUser, 
                    fullName: profile.full_name,
                    email: profile.email,
                    phone: profile.phone,
                    bio: profile.bio,
                    avatarUrl: profile.avatar_url,
                    role: profile.role
                });
            }
        }).catch(() => { });
    }, []);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simple validation
        if (!file.type.startsWith('image/')) {
            setProfileError("Vui lòng chọn file ảnh.");
            return;
        }

        setIsUploading(true);
        setProfileError("");

        try {
            const formData = new FormData();
            formData.append("files", file);

            const { ok, data } = await api.post("/upload", formData);
            if (ok && data.success && data.data?.[0]?.file_url) {
                const newAvatarUrl = data.data[0].file_url;
                setAvatarUrl(newAvatarUrl);
                // Also update profile immediately or wait for save? 
                // Let's just update the URL in state and it will be saved when user clicks "Lưu thay đổi"
            } else {
                setProfileError("Không thể tải ảnh lên Cloudinary.");
            }
        } catch (err) {
            setProfileError("Lỗi khi tải ảnh lên.");
        } finally {
            setIsUploading(false);
        }
    };

    const onSaveProfile = async () => {
        setProfileError("");
        setProfileSaved(false);
        setIsSavingProfile(true);
        try {
            const updates = { 
                full_name: fullName,
                phone: phone,
                bio: bio,
                avatar_url: avatarUrl
            };
            const { ok, data } = await api.updateProfile(updates);
            if (!ok || !data.success) {
                setProfileError(data.error?.validationErrors?.[0]?.message || data.message || "Không thể cập nhật hồ sơ.");
            } else {
                setProfileSaved(true);
                setTimeout(() => setProfileSaved(false), 3000);
                const currentUser = store.getCurrentUser();
                store.setAuth(store.getToken(), { 
                    ...currentUser, 
                    fullName: data.data.full_name,
                    email: data.data.email,
                    phone: data.data.phone,
                    bio: data.data.bio,
                    avatarUrl: data.data.avatar_url
                });
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
            <PageHeader 
                title="Cài đặt tài khoản" 
                subtitle="Quản lý thông tin hồ sơ và bảo mật của bạn để tối ưu trải nghiệm học tập." 
            />

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Sidebar Navigation */}
                <aside className="lg:col-span-3 space-y-2">
                    <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar scroll-smooth">
                        <button
                            onClick={() => setActiveTab("personal")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                                activeTab === "personal" 
                                ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            <User className="w-5 h-5" />
                            Hồ sơ cá nhân
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                                activeTab === "security" 
                                ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            <Shield className="w-5 h-5" />
                            Mật khẩu & Bảo mật
                        </button>
                    </nav>

                    <div className="hidden lg:block pt-8 px-4 opacity-50 select-none">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Tình trạng tài khoản</p>
                        <div className="mt-2 flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase">Đã xác thực</span>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
                    {activeTab === "personal" && (
                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                            {/* Header Section with Profile Background / Avatar */}
                            <div className="relative h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                            
                            <div className="px-6 md:px-10 pb-10">
                                {/* Avatar Upload Area */}
                                <div className="relative -mt-16 mb-8 flex flex-col md:flex-row md:items-end gap-6">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white ring-1 ring-slate-100">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover select-none" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                                    <User className="w-12 h-12" />
                                                </div>
                                            )}
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 p-2.5 bg-white border border-slate-200 rounded-2xl shadow-lg cursor-pointer hover:bg-slate-50 transition-all hover:scale-110 group-hover:bg-slate-900 group-hover:border-slate-800 group-hover:text-white group-active:scale-95 z-10">
                                            <Camera className="w-5 h-5" />
                                            <input type="file" onChange={handleAvatarUpload} className="hidden" accept="image/*" disabled={isUploading} />
                                        </label>
                                    </div>

                                    <div className="flex-1 space-y-1 py-1">
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{fullName || "Thành viên SmartEdu"}</h2>
                                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
                                                <Mail className="w-3.5 h-3.5" />
                                                {email}
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                                                <Shield className="w-3.5 h-3.5" />
                                                {u?.role === "ADMIN" ? "Quản trị viên" : u?.role === "TEACHER" ? "Giảng viên" : "Học viên"}
                                            </div>
                                        </div>
                                    </div>

                                    {avatarUrl && (
                                        <button 
                                            onClick={() => setAvatarUrl("")}
                                            className="hidden md:flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Gỡ ảnh
                                        </button>
                                    )}
                                </div>

                                {/* Form Sections */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-xs uppercase tracking-[0.2em] font-black text-slate-400">Thông tin cơ bản</h4>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                        HỌ VÀ TÊN
                                                    </label>
                                                    <Input 
                                                        value={fullName} 
                                                        onChange={(e) => setFullName(e.target.value)} 
                                                        className="h-12 border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-xl"
                                                        placeholder="Nhập tên của bạn..."
                                                    />
                                                </div>

                                                <div>
                                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                        SỐ ĐIỆN THOẠI
                                                    </label>
                                                    <Input 
                                                        value={phone} 
                                                        onChange={(e) => setPhone(e.target.value)} 
                                                        className="h-12 border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-xl"
                                                        placeholder="09xx xxx xxx"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-xs uppercase tracking-[0.2em] font-black text-slate-400">Giới thiệu</h4>
                                            
                                            <div>
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                    TIỂU SỬ
                                                </label>
                                                <Textarea 
                                                    value={bio} 
                                                    onChange={(e) => setBio(e.target.value)} 
                                                    className="min-h-[148px] border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-2xl resize-none p-4"
                                                    placeholder="Chia sẻ đôi chút về bản thân bạn..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="flex-1">
                                        {profileError && (
                                            <p className="text-sm font-bold text-red-500 animate-in fade-in slide-in-from-left-2">{profileError}</p>
                                        )}
                                        {profileSaved && (
                                            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 animate-in fade-in zoom-in">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Hồ sơ đã được lưu thành công!
                                            </div>
                                        )}
                                    </div>
                                    
                                    <Button 
                                        onClick={onSaveProfile} 
                                        className="w-full sm:w-auto h-12 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-70"
                                        disabled={isSavingProfile || isUploading}
                                    >
                                        {isSavingProfile ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ĐANG LƯU
                                            </>
                                        ) : "CẬP NHẬT HỒ SƠ"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 px-6 md:px-10 py-10">
                            <div className="mb-10 max-w-xl">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Mật khẩu & Bảo mật</h3>
                                <p className="text-slate-500 mt-2 font-medium">Bảo vệ tài khoản của bạn bằng cách sử dụng mật khẩu mạnh và thường xuyên thay đổi.</p>
                            </div>

                            <form onSubmit={onChangePassword} className="space-y-8 max-w-lg">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Mật khẩu hiện tại</label>
                                        <Input 
                                            type="password" 
                                            value={oldP} 
                                            onChange={(e) => setOldP(e.target.value)} 
                                            className="h-12 border-slate-200 focus:ring-blue-500 rounded-xl"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    
                                    <div className="h-px bg-slate-100"></div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Mật khẩu mới</label>
                                        <Input 
                                            type="password" 
                                            value={newP} 
                                            onChange={(e) => setNewP(e.target.value)} 
                                            placeholder="Tối thiểu 6 ký tự"
                                            className="h-12 border-slate-200 focus:ring-blue-500 rounded-xl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Xác nhận mật khẩu</label>
                                        <Input 
                                            type="password" 
                                            value={cfm} 
                                            onChange={(e) => setCfm(e.target.value)} 
                                            className="h-12 border-slate-200 focus:ring-blue-500 rounded-xl"
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                    </div>
                                </div>

                                {pwdMsg && (
                                    <div className={`text-sm font-bold p-4 rounded-2xl border ${pwdSuccess ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100 animate-in shake-in'}`}>
                                        <div className="flex items-center gap-2">
                                            {pwdSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                            {pwdMsg}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6">
                                    <Button 
                                        type="submit" 
                                        className="w-full sm:w-auto h-12 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200 transition-all active:scale-95"
                                        disabled={isSavingPwd}
                                    >
                                        {isSavingPwd ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ĐANG XỬ LÝ
                                            </>
                                        ) : "ĐỔI MẬT KHẨU"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}