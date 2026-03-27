// src/component/pages/admin/UpgradeClassModal.js
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminApi } from "service/adminApi";
import { Button } from "component/ui";
import { X, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const suggestNextClassName = (oldName) => {
    if (!oldName) return "";
    return oldName.replace(/\d+/, (match) => parseInt(match, 10) + 1);
};

const suggestNextYear = (semesterStr) => {
    if (!semesterStr) return `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const match = semesterStr.match(/(\d{4})-(\d{4})/);
    if (!match) return `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const start = parseInt(match[1]);
    const end = parseInt(match[2]);
    return `${start + 1}-${end + 1}`;
};

const suggestNextDate = (oldDateStr) => {
    if (!oldDateStr) return "";
    const date = new Date(oldDateStr);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split("T")[0];
};

export default function UpgradeClassModal({ classData, onClose, onSuccess }) {
    const [metadata, setMetadata] = useState({ teachers: [] });
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        name: suggestNextClassName(classData?.name),
        semester: "Học kỳ 1",
        year: suggestNextYear(classData?.semester),
        start_date: suggestNextDate(classData?.start_date),
        end_date: suggestNextDate(classData?.end_date),
        teacher_id: classData?.teacher?.id || "",
        course_id: classData?.course?.id || ""
    });
    const [dateError, setDateError] = useState("");

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch class details to get students
                const classRes = await adminApi.getClassDetail(classData.id);
                if (classRes.data.success) {
                    const enrollments = classRes.data.data.enrollments || [];
                    setStudents(enrollments.map(e => e.student));
                }

                // Fetch courses
                const coursesRes = await adminApi.getCourses();
                if (coursesRes.data.success) {
                    setCourses(coursesRes.data.data.filter(c => !c.is_deleted));
                }

                // Fetch metadata for teachers
                const metaRes = await adminApi.getCreateClassMetadata();
                if (metaRes.data.success) {
                    setMetadata({ teachers: metaRes.data.data.teachers || [] });
                }
            } catch (err) {
                console.error("Lỗi lấy dữ liệu:", err);
                toast.error("Không thể tải thông tin lớp học cũ.");
            } finally {
                setLoading(false);
            }
        };

        if (classData?.id) fetchInitialData();
    }, [classData]);

    const handleRemoveStudent = (studentId) => {
        setStudents(prev => prev.filter(s => s.id !== studentId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setDateError("");
        try {
            if (new Date(formData.end_date) <= new Date(formData.start_date)) {
                setDateError("Ngày kết thúc phải diễn ra sau Ngày bắt đầu.");
                toast.error("Ngày kết thúc phải diễn ra sau Ngày bắt đầu.");
                return;
            }

            const todayN = new Date();
            todayN.setHours(0, 0, 0, 0);
            if (new Date(formData.start_date) < todayN) {
                setDateError("Ngày bắt đầu không được ở quá khứ.");
                toast.error("Ngày bắt đầu không thể ở quá khứ.");
                return;
            }
            
            const [startYear, endYear] = formData.year.split("-");
            const startDateObj = new Date(formData.start_date);
            const endDateObj = new Date(formData.end_date);
            
            if (startDateObj.getFullYear() < parseInt(startYear)) {
                setDateError(`Ngày bắt đầu phải diễn ra trong năm ${startYear} trở đi.`);
                return;
            }
            if (endDateObj.getFullYear() > parseInt(endYear)) {
                setDateError(`Ngày kết thúc phải diễn ra trước hoặc trong năm ${endYear}.`);
                return;
            }

            const submissionData = {
                name: formData.name,
                semester: `${formData.semester} - ${formData.year}`,
                start_date: formData.start_date,
                end_date: formData.end_date,
                course_id: formData.course_id,
                teacher_id: formData.teacher_id || null,
                student_ids: students.map(s => s.id)
            };

            await adminApi.upgradeClass(classData.id, submissionData);
            toast.success("Lên lớp tự động thành công!");
            onSuccess(); 
        } catch (err) {
            console.error("Lỗi lên lớp:", err);
            toast.error(err.response?.data?.message || "Không thể lên lớp. Vui lòng kiểm tra lại.");
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Chuyển lớp / Lên lớp tự động</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Kế thừa danh sách học sinh từ lớp cũ <span className="font-semibold text-slate-700">{classData?.name}</span>.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition shadow-sm border border-transparent hover:border-slate-200">
                        <X size={20} className="text-slate-400 hover:text-slate-600" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500 italic">Đang tải dữ liệu...</div>
                    ) : (
                        <form id="upgrade-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-blue-800 uppercase block mb-2 tracking-wider">Môn học mới (*)</label>
                                        <select 
                                            required
                                            className="w-full p-3 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
                                            value={formData.course_id}
                                            onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                                        >
                                            <option value="">-- Chọn môn học --</option>
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-blue-800 uppercase block mb-2 tracking-wider">Tên Lớp học mới (*)</label>
                                        <input 
                                            type="text" required
                                            className="w-full p-3 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-blue-800 uppercase block mb-2 tracking-wider">Học kỳ / Năm học (*)</label>
                                        <div className="flex gap-2">
                                            <select 
                                                value={formData.semester}
                                                className="w-1/2 p-3 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
                                                onChange={(e) => setFormData({...formData, semester: e.target.value})}
                                            >
                                                <option value="Học kỳ 1">Học kỳ 1</option>
                                                <option value="Học kỳ 2">Học kỳ 2</option>
                                                <option value="Học kỳ 3">Học kỳ 3</option>
                                            </select>
                                            <select 
                                                value={formData.year}
                                                className="w-1/2 p-3 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
                                                onChange={(e) => setFormData({...formData, year: e.target.value})}
                                            >
                                                {Array.from({ length: 6 }, (_, i) => {
                                                    const yr = new Date().getFullYear() + i;
                                                    const op = `${yr}-${yr + 1}`;
                                                    return <option key={op} value={op}>{op}</option>;
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Ngày bắt đầu (*)</label>
                                    <input 
                                        type="date" required
                                        className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Ngày kết thúc (*)</label>
                                    <input 
                                        type="date" required
                                        className={`w-full p-3 border rounded-lg text-sm outline-none transition-all ${dateError ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-blue-500"}`}
                                        value={formData.end_date}
                                        onChange={(e) => {
                                            setFormData({...formData, end_date: e.target.value});
                                            setDateError(""); 
                                        }}
                                    />
                                </div>
                            </div>
                            {dateError && <p className="text-red-500 text-[10px] font-medium mt-1 italic">{dateError}</p>}
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-wider">Giáo viên phụ trách mới</label>
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

                            <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <Users size={18} className="text-indigo-600" />
                                        Danh sách học sinh sẽ được chuyển ({students.length})
                                    </h4>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {students.length === 0 ? (
                                        <div className="p-6 text-center text-slate-500 italic text-sm">
                                            Lớp cũ không có học sinh nào.
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead className="bg-white border-b border-slate-200 sticky top-0">
                                                <tr className="text-left text-slate-500">
                                                    <th className="py-2 px-4 font-medium">Họ tên</th>
                                                    <th className="py-2 px-4 font-medium">Email</th>
                                                    <th className="py-2 px-4 font-medium text-right">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {students.map((s) => (
                                                    <tr key={s.id} className="hover:bg-slate-50">
                                                        <td className="py-2 px-4 font-medium">{s.full_name}</td>
                                                        <td className="py-2 px-4 text-slate-500">{s.email}</td>
                                                        <td className="py-2 px-4 text-right">
                                                            <button 
                                                                type="button"
                                                                onClick={() => handleRemoveStudent(s.id)}
                                                                className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                                                                title="Bỏ chuyển học sinh này"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-white">
                    <Button type="button" variant="outline" className="text-slate-600 hover:bg-slate-50 px-6" onClick={onClose} disabled={loading}>
                        Hủy bỏ
                    </Button>
                    <Button type="submit" form="upgrade-form" className="bg-indigo-600 text-white px-8 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-semibold" disabled={loading}>
                        Tạo lớp học mới
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
