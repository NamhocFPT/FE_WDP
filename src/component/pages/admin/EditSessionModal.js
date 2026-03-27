import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "service/adminApi";

export default function EditSessionModal({ isOpen, onClose, classId, sessionGroup, onSuccess, currentTeacherId }) {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        specific_date: "",
        start_time: "",
        end_time: "",
        room: "",
        teacher_id: ""
    });

    useEffect(() => {
        if (!isOpen) return;
        adminApi.getTeachers()
            .then(res => setTeachers(res.data.data))
            .catch(err => console.error("Error fetching teachers:", err));
        
        if (sessionGroup) {
            // "09:00 - 10:30" format handling
            const [start, end] = sessionGroup.time.split(" - ");
            
            // Map Vietnamese day name from table back to English for the select value
            const vnToEnDay = {
                "Chủ Nhật": "Sunday", "Thứ Hai": "Monday", "Thứ Ba": "Tuesday", 
                "Thứ Tư": "Wednesday", "Thứ Năm": "Thursday", "Thứ Sáu": "Friday", "Thứ Bảy": "Saturday"
            };

            setFormData({
                specific_date: sessionGroup.dateISO || "",
                start_time: start || "",
                end_time: end || "",
                room: sessionGroup.room !== "N/A" ? sessionGroup.room : "",
                teacher_id: currentTeacherId || ""
            });
        }
    }, [isOpen, sessionGroup, currentTeacherId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                sessionIds: sessionGroup.sessionIds,
                specific_date: formData.specific_date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                room: formData.room,
                teacher_id: formData.teacher_id || null
            };
            
            if (sessionGroup.sessionIds?.length === 1 && sessionGroup.dateISO) {
                // Single session edit
                const updatedPayload = {
                    start_time: `${formData.specific_date}T${formData.start_time}:00`,
                    end_time: `${formData.specific_date}T${formData.end_time}:00`,
                    room: formData.room,
                    teacher_id: formData.teacher_id || null
                };
                await adminApi.updateSession(classId, sessionGroup.sessionIds[0], updatedPayload);
            } else {
                await adminApi.editSessions(classId, payload);
            }
            toast.success("Cập nhật lịch học thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật buổi học.");
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
                        <h3 className="text-xl font-bold text-slate-900">Chỉnh sửa Lịch học</h3>
                        <p className="text-sm text-slate-500 mt-1">Cập nhật thông tin buổi học</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-5">
                    {/* Specific Date */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">Ngày học cụ thể</label>
                        <input 
                            type="date" required
                            className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            value={formData.specific_date}
                            onChange={(e) => setFormData({...formData, specific_date: e.target.value})}
                        />
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
                        <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">Giáo viên</label>
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
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
