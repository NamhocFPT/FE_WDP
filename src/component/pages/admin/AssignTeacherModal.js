import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { adminApi } from "service/adminApi";
import { X, Search, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AssignTeacherModal({ isOpen, onClose, classId, currentTeacherId, onSuccess }) {
    const [teachers, setTeachers] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedTeacher, setSelectedTeacher] = useState(currentTeacherId || null);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setSelectedTeacher(currentTeacherId || null);
        adminApi.getTeachers()
            .then(res => {
                setTeachers(res.data.data);
            })
            .catch(err => toast.error("Không thể tải danh sách giảng viên"))
            .finally(() => setLoading(false));
    }, [isOpen, currentTeacherId]);

    const filteredTeachers = useMemo(() => {
        if (!search) return teachers;
        const lowSearch = search.toLowerCase();
        return teachers.filter(t =>
            t.full_name?.toLowerCase().includes(lowSearch) ||
            t.email?.toLowerCase().includes(lowSearch)
        );
    }, [teachers, search]);

    const handleAssign = async () => {
        if (!selectedTeacher) {
            toast.error("Vui lòng chọn một giảng viên!");
            return;
        }

        setAssigning(true);
        try {
            await adminApi.assignTeacher(classId, selectedTeacher);
            toast.success("Phân công Giảng viên thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi phân công.");
        } finally {
            setAssigning(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Phân công Giảng viên</h3>
                        <p className="text-sm text-slate-500 mt-1">Chọn hoặc tìm kiếm giảng viên phù hợp cho lớp học</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 mt-4">
                        {loading ? (
                            <div className="py-8 text-center text-slate-500 flex flex-col items-center">
                                <Loader2 className="animate-spin mb-2" size={24} />
                                Đang tải danh sách...
                            </div>
                        ) : filteredTeachers.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Không tìm thấy giảng viên nào phù hợp.
                            </div>
                        ) : (
                            filteredTeachers.map(teacher => (
                                <div
                                    key={teacher.id}
                                    onClick={() => setSelectedTeacher(teacher.id)}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTeacher === teacher.id
                                            ? "border-blue-600 bg-blue-50"
                                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                                            {teacher.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{teacher.full_name}</div>
                                            <div className="text-sm text-slate-500">{teacher.email}</div>
                                        </div>
                                    </div>

                                    {selectedTeacher === teacher.id && (
                                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                                            <UserCheck size={14} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
                    <button
                        type="button"
                        className="px-6 py-2.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                        onClick={onClose}
                        disabled={assigning}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        onClick={handleAssign}
                        disabled={assigning || !selectedTeacher || selectedTeacher === currentTeacherId}
                    >
                        {assigning && <Loader2 className="animate-spin" size={16} />}
                        Lưu phân công
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
