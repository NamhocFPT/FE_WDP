import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "service/adminApi";

export default function AddSessionModal({ isOpen, onClose, classId, onSuccess, currentTeacherId }) {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        day_of_week: "",
        start_time: "",
        end_time: "",
        room: "",
        teacher_id: currentTeacherId || ""
    });

    useEffect(() => {
        if (!isOpen) return;
        adminApi.getTeachers()
            .then(res => setTeachers(res.data.data))
            .catch(err => console.error("Error fetching teachers:", err));
        
        // Reset form data when opened
        setFormData({
            day_of_week: "",
            start_time: "",
            end_time: "",
            room: "",
            teacher_id: currentTeacherId || ""
        });
    }, [isOpen, currentTeacherId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                day_of_week: formData.day_of_week,
                start_time: formData.start_time,
                end_time: formData.end_time,
                room: formData.room,
                teacher_id: formData.teacher_id || null
            };
            
            await adminApi.addSession(classId, payload);
            toast.success("Thêm buổi học thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Lỗi khi thêm buổi học.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-start p-6 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Thêm buổi học</h3>
                        <p className="text-sm text-slate-500 mt-1">Tạo lịch học định kỳ mới cho lớp học</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-5">
                    {/* Day of Week */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">Thứ trong tuần</label>
                        <select 
                            required
                            className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                            value={formData.day_of_week}
                            onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}
                        >
                            <option value="" disabled>Chọn thứ</option>
                            <option value="Monday">Thứ Hai</option>
                            <option value="Tuesday">Thứ Ba</option>
                            <option value="Wednesday">Thứ Tư</option>
                            <option value="Thursday">Thứ Năm</option>
                            <option value="Friday">Thứ Sáu</option>
                            <option value="Saturday">Thứ Bảy</option>
                            <option value="Sunday">Chủ Nhật</option>
                        </select>
                    </div>

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">Giờ bắt đầu</label>
                            <input 
                                type="time" required
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.start_time}
                                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">Giờ kết thúc</label>
                            <input 
                                type="time" required
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.end_time}
                                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Room */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">Phòng học</label>
                        <input 
                            type="text" required placeholder="Ví dụ: P301, DE102..."
                            className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={formData.room}
                            onChange={(e) => setFormData({...formData, room: e.target.value})}
                        />
                    </div>

                    {/* Teacher */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">Giảng viên</label>
                        <select 
                            className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                            value={formData.teacher_id}
                            onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                        >
                            <option value="">Chưa phân công</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                            ))}
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium transition-all"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            Thêm buổi học
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
