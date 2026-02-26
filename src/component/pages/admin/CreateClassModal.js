// src/component/pages/admin/CreateClassModal.js
import React, { useState, useEffect } from "react";
import { adminApi } from "service/adminApi";
import { Button } from "component/ui";
import { X, UserCheck } from "lucide-react";

export default function CreateClassModal({ onClose, onSuccess }) {
    // Quản lý danh sách Teachers lấy từ DB
    const [metadata, setMetadata] = useState({ 
        teachers: [], 
    });
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        course_id: "",
        teacher_id: "", // Cần gửi trường này để tránh lỗi NOT NULL
        name: "",
        semester: "Spring 2026",
        start_date: "",
        end_date: "",
        max_capacity: 40
    });

    useEffect(() => {
        // 1. Lấy danh sách khóa học cho dropdown
        adminApi.getCourses().then(res => {
            if (res.data.success) setCourses(res.data.data);
        });

        // 2. Lấy danh sách metadata (bao gồm Teachers) từ Backend
        const fetchMetadata = async () => {
            try {
                const metaRes = await adminApi.getCreateClassMetadata();
            console.log("Dữ liệu Teacher từ Server:", metaRes.data); // Kiểm tra ở tab Console F12
            
            if (metaRes.data.success) {
                setMetadata({
                    // Phải đảm bảo key này khớp với dữ liệu Backend trả về (thường là 'teachers')
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
        try {
            // Gửi đầy đủ thông tin bao gồm cả teacher_id
            await adminApi.addClass(formData); 
            onSuccess(); // Đóng modal và refresh danh sách
        } catch (err) {
            console.error("Lỗi tạo lớp:", err);
            alert("Không thể tạo lớp học. Vui lòng kiểm tra lại dữ liệu.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">Create New Class</h3>
                    <X className="text-slate-400 cursor-pointer hover:text-slate-600" onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Course Selection */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Course</label>
                        <select 
                            required
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50"
                            onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                        >
                            <option value="">Select a course</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Teacher Selection - Đã thêm logic nạp data */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Primary Teacher</label>
                        <div className="relative">
                            <select 
                                required
                                className="w-full p-2.5 pl-10 border border-blue-100 rounded-lg text-sm bg-blue-50/30 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                            >
                                <option value="">Assign a teacher</option>
                                {metadata.teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.full_name}</option>
                                ))}
                            </select>
                            <UserCheck className="absolute left-3 top-2.5 text-blue-500" size={16} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Class Name */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Class Name</label>
                            <input 
                                type="text" placeholder="e.g. CS101-A" required
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        {/* Semester */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Semester</label>
                            <select 
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                onChange={(e) => setFormData({...formData, semester: e.target.value})}
                            >
                                <option value="Spring 2026">Spring 2026</option>
                                <option value="Fall 2025">Fall 2025</option>
                                <option value="Summer 2026">Summer 2026</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Start Date</label>
                            <input 
                                type="date" required
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">End Date</label>
                            <input 
                                type="date" required
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Maximum Capacity</label>
                        <input 
                            type="number" defaultValue={40}
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                            onChange={(e) => setFormData({...formData, max_capacity: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button type="button" className="bg-white text-slate-600 border border-slate-200 hover:bg-slate-50" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-[#0f172a] text-white px-8 hover:bg-slate-800 shadow-lg transition-all">
                            Create Class
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}