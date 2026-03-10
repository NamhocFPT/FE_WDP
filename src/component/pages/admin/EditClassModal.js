// src/component/pages/Admin/EditClassModal.js
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminApi } from "service/adminApi";
import { Button } from "component/ui";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditClassModal({ classData, onClose, onSuccess }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Khởi tạo form với dữ liệu cũ từ props (initialData)
    const [formData, setFormData] = useState({
        course_id: classData?.course_id || "",
        name: classData?.name || "",
        semester: classData?.semester || "Spring 2026",
        start_date: classData?.start_date || "",
        end_date: classData?.end_date || "",
        max_capacity: classData?.max_capacity || 30
    });
    const [dateError, setDateError] = useState("");

    useEffect(() => {
        // Lấy danh sách khóa học cho dropdown
        adminApi.getCourses().then(res => {
            if (res.data.success) setCourses(res.data.data);
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setDateError("");
        try {
            if (new Date(formData.end_date) <= new Date(formData.start_date)) {
                setDateError("Ngày kết thúc phải diễn ra sau Ngày bắt đầu. Vui lòng chọn lại.");
                toast.error("Ngày kết thúc phải diễn ra sau Ngày bắt đầu. Vui lòng chọn lại.");
                setLoading(false);
                return;
            }
            
            // Gọi API Update thay vì Add
            await adminApi.updateClass(classData.id, formData); 
            toast.success("Cập nhật thông tin lớp học thành công!");
            onSuccess(); // Đóng modal và refresh danh sách
        } catch (err) {
            console.error("Lỗi cập nhật lớp:", err);
            toast.error(err.response?.data?.message || "Không thể cập nhật lớp học. Vui lòng kiểm tra lại dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">Edit Class "{classData?.name}"</h3>
                    <X className="text-slate-400 cursor-pointer hover:text-slate-600" onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Course Selection */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Course</label>
                        <select 
                            required
                            value={formData.course_id}
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50"
                            onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                        >
                            <option value="">Select a course</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Class Name */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Class Name</label>
                            <input 
                                type="text" placeholder="e.g. SE1886" required
                                value={formData.name}
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        {/* Semester */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Semester</label>
                            <select 
                                value={formData.semester}
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
                                value={formData.start_date}
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">End Date</label>
                            <input 
                                type="date" required
                                value={formData.end_date}
                                className={`w-full p-3 border rounded-lg text-sm outline-none transition-all ${dateError ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-blue-500"}`}
                                onChange={(e) => {
                                    setFormData({...formData, end_date: e.target.value});
                                    setDateError("");
                                }}
                            />
                        </div>
                    </div>
                    {dateError && <p className="text-red-500 text-xs font-medium -mt-2">{dateError}</p>}

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Maximum Capacity</label>
                        <input 
                            type="number"
                            value={formData.max_capacity}
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                            onChange={(e) => setFormData({...formData, max_capacity: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button type="button" className="bg-white text-slate-600 border border-slate-200 hover:bg-slate-50" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-[#2563eb] text-white px-8 hover:bg-slate-800 shadow-lg transition-all" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                            Update Class
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
