// src/component/pages/admin/EditClassModal.js
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminApi } from "service/adminApi";
import { Button } from "component/ui";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditClassModal({ classData, onClose, onSuccess }) {
    const [metadata, setMetadata] = useState({ teachers: [] });
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Parse combined semester string back to separate values
    const [semesterVal, yearVal] = classData?.semester ? classData.semester.split(" - ") : ["Học kỳ 1", "2025-2026"];
    
    const [formData, setFormData] = useState({
        course_id: classData?.course_id || "",
        teacher_id: classData?.teacher_id || "", // Fetch teacher accurately
        name: classData?.name || "",
        semester: semesterVal || "Học kỳ 1",
        year: yearVal || "2025-2026",
        start_date: classData?.start_date || "",
        end_date: classData?.end_date || "",
        max_capacity: classData?.max_capacity || 30
    });
    const [dateError, setDateError] = useState("");

    useEffect(() => {
        adminApi.getCourses().then(res => {
            if (res.data.success) setCourses(res.data.data.filter(c => !c.is_deleted));
        });

        const fetchMetadata = async () => {
            try {
                const metaRes = await adminApi.getCreateClassMetadata();
                if (metaRes.data.success) {
                    setMetadata({ teachers: metaRes.data.data.teachers || [] });
                }
            } catch (err) { console.error("Lỗi lấy metadata teachers:", err); }
        };
        fetchMetadata();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setDateError("");
        try {
            if (new Date(formData.end_date) <= new Date(formData.start_date)) {
                setDateError("Ngày kết thúc phải diễn ra sau Ngày bắt đầu. Vui lòng chọn lại.");
                toast.error("Ngày kết thúc phải diễn ra sau Ngày bắt đầu.");
                setLoading(false);
                return;
            }

            // Academic Year Validation
            const [startYear, endYear] = formData.year.split("-");
            const startDateObj = new Date(formData.start_date);
            const endDateObj = new Date(formData.end_date);
            
            if (startDateObj.getFullYear() < parseInt(startYear)) {
                setDateError(`Ngày bắt đầu phải diễn ra trong năm ${startYear} trở đi.`);
                toast.error(`Ngày bắt đầu không thể trước năm ${startYear}`);
                setLoading(false);
                return;
            }
            if (endDateObj.getFullYear() > parseInt(endYear)) {
                setDateError(`Ngày kết thúc phải diễn ra trước hoặc trong năm ${endYear}.`);
                toast.error(`Ngày kết thúc không thể sau năm ${endYear}`);
                setLoading(false);
                return;
            }
            
            // Combine fully 
            const submissionData = {
                ...formData,
                semester: `${formData.semester} - ${formData.year}`
            };
            delete submissionData.year;

            await adminApi.updateClass(classData.id, submissionData); 
            toast.success("Cập nhật thông tin lớp học thành công!");
            onSuccess(); 
        } catch (err) {
            console.error("Lỗi cập nhật lớp:", err);
            toast.error(err.response?.data?.message || "Không thể cập nhật lớp học. Vui lòng kiểm tra lại dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-900">Chỉnh sửa lớp "{classData?.name}"</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition shadow-sm border border-transparent hover:border-slate-200">
                        <X size={20} className="text-slate-400 hover:text-slate-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Course Selection */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Môn học (*)</label>
                        <select 
                            required
                            value={formData.course_id}
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50 cursor-pointer"
                            onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                        >
                            <option value="">-- Chọn một môn học --</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Class Name */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Tên lớp học (*)</label>
                            <input 
                                type="text" placeholder="VD: SE1886" required
                                value={formData.name}
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        {/* Semester / Year */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Học kỳ / Năm học (*)</label>
                            <div className="flex gap-2">
                                <select 
                                    value={formData.semester}
                                    className="w-1/2 p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
                                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                                >
                                    <option value="Học kỳ 1">Học kỳ 1</option>
                                    <option value="Học kỳ 2">Học kỳ 2</option>
                                    <option value="Học kỳ 3">Học kỳ 3</option>
                                </select>
                                <select 
                                    value={formData.year}
                                    className="w-1/2 p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
                                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                                >
                                    {Array.from({ length: 6 }, (_, i) => {
                                        const yr = new Date().getFullYear() - 1 + i;
                                        const op = `${yr}-${yr + 1}`;
                                        return <option key={op} value={op}>{op}</option>;
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Ngày bắt đầu (*)</label>
                            <input 
                                type="date" required
                                value={formData.start_date}
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Ngày kết thúc (*)</label>
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
                    {dateError && <p className="text-red-500 text-[10px] font-medium -mt-2 italic">{dateError}</p>}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Sĩ số tối đa</label>
                            <input 
                                type="number"
                                value={formData.max_capacity}
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                onChange={(e) => setFormData({...formData, max_capacity: e.target.value})}
                            />
                        </div>
                        {/* Teacher Selection */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Giáo viên phụ trách</label>
                            <select 
                                value={formData.teacher_id}
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
                                onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                            >
                                <option value="">-- Chưa phân công --</option>
                                {metadata.teachers?.map(t => (
                                    <option key={t.id} value={t.id}>{t.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button type="button" variant="outline" className="text-slate-600 hover:bg-slate-50 px-6" onClick={onClose} disabled={loading}>
                            Hủy bỏ
                        </Button>
                        <Button type="submit" className="bg-slate-900 text-white px-8 hover:bg-black shadow-lg shadow-slate-200 transition-all font-semibold" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                            Cập nhật lớp học
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
