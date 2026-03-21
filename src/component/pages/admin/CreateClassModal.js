// src/component/pages/admin/CreateClassModal.js
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminApi } from "service/adminApi";
import { Button } from "component/ui";
import { X } from "lucide-react";
import { toast } from "sonner";

export default function CreateClassModal({ onClose, onSuccess }) {
    // Quản lý danh sách Teachers lấy từ DB
    const [, setMetadata] = useState({ 
        teachers: [], 
    });
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        course_id: "",
        teacher_id: "", // Cần gửi trường này để tránh lỗi NOT NULL
        name: "",
        semester: "Học kỳ 2 - 2026",
        start_date: "",
        end_date: "",
        max_capacity: 30
    });
    const [dateError, setDateError] = useState("");

    useEffect(() => {
        // 1. Lấy danh sách khóa học cho dropdown
        adminApi.getCourses().then(res => {
            if (res.data.success) setCourses(res.data.data.filter(c => !c.is_deleted));
        });

        // 2. Lấy danh sách metadata (bao gồm Teachers) từ Backend
        const fetchMetadata = async () => {
            try {
                const metaRes = await adminApi.getCreateClassMetadata();
                if (metaRes.data.success) {
                    setMetadata({
                        teachers: metaRes.data.data.teachers || [] 
                    });
                }
            } catch (err) {
                console.error("Lỗi lấy metadata teachers:", err);
            }
        };
        fetchMetadata();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setDateError("");
        try {
            if (new Date(formData.end_date) <= new Date(formData.start_date)) {
                setDateError("Ngày kết thúc phải diễn ra sau Ngày bắt đầu. Vui lòng chọn lại.");
                toast.error("Ngày kết thúc phải diễn ra sau Ngày bắt đầu.");
                return;
            }
            await adminApi.addClass(formData); 
            toast.success("Tạo lớp học thành công!");
            onSuccess(); 
        } catch (err) {
            console.error("Lỗi tạo lớp:", err);
            toast.error(err.response?.data?.message || "Không thể tạo lớp học. Vui lòng kiểm tra lại dữ liệu.");
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-900">Tạo Lớp học mới</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition shadow-sm border border-transparent hover:border-slate-200">
                        <X size={20} className="text-slate-400 hover:text-slate-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Course Selection */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Khóa học (*)</label>
                        <select 
                            required
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50 cursor-pointer"
                            onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                        >
                            <option value="">-- Chọn một khóa học --</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Class Name */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Tên Lớp học (*)</label>
                            <input 
                                type="text" placeholder="VD: SE101-A" required
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        {/* Semester */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Học kỳ</label>
                            <select 
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
                                onChange={(e) => setFormData({...formData, semester: e.target.value})}
                            >
                                <option value="Học kỳ 1 - 2026">Học kỳ 1 - 2026</option>
                                <option value="Học kỳ 2 - 2026">Học kỳ 2 - 2026</option>
                                <option value="Học kỳ 1 - 2025">Học kỳ 1 - 2025</option>
                                <option value="Học kỳ 2 - 2025">Học kỳ 2 - 2025</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Ngày bắt đầu (*)</label>
                            <input 
                                type="date" required
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Ngày kết thúc (*)</label>
                            <input 
                                type="date" required
                                className={`w-full p-3 border rounded-lg text-sm outline-none transition-all ${dateError ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-blue-500"}`}
                                onChange={(e) => {
                                    setFormData({...formData, end_date: e.target.value});
                                    setDateError(""); 
                                }}
                            />
                        </div>
                    </div>
                    {dateError && <p className="text-red-500 text-[10px] font-medium -mt-2 italic">{dateError}</p>}
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Sĩ số tối đa</label>
                        <input 
                            type="number" defaultValue={30}
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                            onChange={(e) => setFormData({...formData, max_capacity: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button type="button" variant="outline" className="text-slate-600 hover:bg-slate-50 px-6" onClick={onClose}>
                            Hủy bỏ
                        </Button>
                        <Button type="submit" className="bg-slate-900 text-white px-8 hover:bg-black shadow-lg shadow-slate-200 transition-all">
                            Tạo lớp học
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}