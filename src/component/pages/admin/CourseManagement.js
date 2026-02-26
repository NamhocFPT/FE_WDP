// src/component/pages/admin/CourseManagement.js
import React, { useMemo, useState, useEffect } from "react";
import { adminApi } from "service/adminApi";
import { Button, Badge, Table, Th, Td } from "component/ui";
import { Plus, Pencil, Trash2, Search, X, Loader2, AlertTriangle } from "lucide-react";

export default function CourseManagement() {
    const [q, setQ] = useState("");
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // States cho Modal Thêm/Sửa
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ 
        code: "", name: "", expected_sessions: "", description: "", status: "active" 
    });

    // States cho Modal Xác nhận xóa mềm (Ẩn đi)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchCourses = async () => {
        try {
            const res = await adminApi.getCourses();
            setCourses(res.data.data);
        } catch (err) { 
            console.error("Lỗi khi tải danh sách:", err); 
        }
    };

    useEffect(() => { fetchCourses(); }, []);

    // Xử lý khi nhấn nút Sửa
    const handleEditClick = (course) => {
        setEditId(course.id);
        setFormData({
            code: course.code,
            name: course.name,
            expected_sessions: course.expected_sessions,
            description: course.description || "",
            status: course.status || "active"
        });
        setIsModalOpen(true);
    };

    // Xử lý khi nhấn nút Xóa (Mở popup xác nhận)
    const handleDeleteClick = (course) => {
        setItemToDelete(course);
        setIsDeleteModalOpen(true);
    };

    // Thực hiện ẩn khóa học (Update is_deleted = true)
    const confirmHide = async () => {
        setLoading(true);
        try {
            // Gọi API update để đánh dấu xóa mềm
            await adminApi.updateCourse(itemToDelete.id, { ...itemToDelete, is_deleted: true });
            await fetchCourses();
            setIsDeleteModalOpen(false);
        } catch (err) {
            alert("Lỗi khi ẩn khóa học!");
        } finally {
            setLoading(false);
        }
    };

    // Xử lý gửi form (Thêm mới hoặc Cập nhật)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editId) {
                await adminApi.updateCourse(editId, formData);
            } else {
                await adminApi.addCourse(formData);
            }
            await fetchCourses();
            setIsModalOpen(false);
            setEditId(null);
            setFormData({ code: "", name: "", expected_sessions: "", description: "", status: "active" });
        } catch (err) { 
            alert("Thao tác thất bại!"); 
        } finally { 
            setLoading(false); 
        }
    };

    // Filter: Tìm kiếm theo text VÀ Chỉ hiện những cái chưa bị xóa (is_deleted !== true)
    const rows = useMemo(() => {
        return courses.filter((c) => {
            const matchesSearch = !q || c.name?.toLowerCase().includes(q.toLowerCase()) || c.code?.toLowerCase().includes(q.toLowerCase());
            const isNotDeleted = !c.is_deleted; 
            return matchesSearch && isNotDeleted;
        });
    }, [q, courses]);

    return (
        <div className="flex flex-col h-full w-full bg-[#f8fafc] p-8 space-y-6">
            {/* Header section */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Course Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage courses and curriculum</p>
                </div>
                <Button className="bg-[#2563eb] text-white px-5 py-2 rounded-lg flex items-center font-semibold shadow-sm" 
                    onClick={() => { setEditId(null); setIsModalOpen(true); }}>
                    <Plus size={18} className="mr-2" /> Add Course
                </Button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 relative shadow-sm">
                <Search className="absolute left-7 top-7 text-slate-400" size={18} />
                <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by code or name..." 
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                />
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1">
                <Table className="w-full">
                    <thead>
                        <tr className="border-b bg-slate-50/50">
                            <Th className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4 px-6 text-left">Course Code</Th>
                            <Th className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4 px-6 text-left">Course Name</Th>
                            <Th className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4 px-6 text-left">Sessions</Th>
                            <Th className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4 px-6 text-left">Status</Th>
                            <Th className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4 px-6 text-center">Actions</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {rows.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                                <Td className="py-4 px-6 text-sm text-slate-600 font-medium">{c.code}</Td>
                                <Td className="py-4 px-6 text-sm text-slate-900 font-semibold">{c.name}</Td>
                                <Td className="py-4 px-6 text-sm text-slate-600">{c.expected_sessions || 0}</Td>
                                <Td className="py-4 px-6">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                        c.status === 'inactive' ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                    }`}>
                                        {c.status || 'active'}
                                    </span>
                                </Td>
                                <Td className="py-4 px-6 text-center">
                                    <div className="flex justify-center gap-4">
                                        <Pencil size={16} className="text-blue-500 cursor-pointer hover:text-blue-700" onClick={() => handleEditClick(c)} />
                                        <Trash2 size={16} className="text-red-500 cursor-pointer hover:text-red-700" onClick={() => handleDeleteClick(c)} />
                                    </div>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* POPUP THÊM/SỬA (Modal) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-lg shadow-xl w-[500px] overflow-hidden">
                        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">{editId ? "Edit Course" : "Add New Course"}</h2>
                            <X className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setIsModalOpen(false)} />
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Code</label>
                                    <input required className="w-full border border-slate-200 p-2 rounded text-sm focus:border-blue-500 outline-none" 
                                        value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Sessions</label>
                                    <input type="number" className="w-full border border-slate-200 p-2 rounded text-sm focus:border-blue-500 outline-none" 
                                        value={formData.expected_sessions} onChange={e => setFormData({...formData, expected_sessions: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Course Name</label>
                                <input required className="w-full border border-slate-200 p-2 rounded text-sm focus:border-blue-500 outline-none" 
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Description</label>
                                <textarea className="w-full border border-slate-200 p-2 rounded text-sm h-20 outline-none focus:border-blue-500" 
                                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Status</label>
                                <select className="w-full border border-slate-200 p-2 rounded text-sm bg-white outline-none focus:border-blue-500 cursor-pointer"
                                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" className="text-xs" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button disabled={loading} type="submit" className="bg-[#2563eb] text-white text-xs px-6 font-semibold">
                                    {loading ? <Loader2 className="animate-spin mr-2" size={14} /> : null} {editId ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN ẨN (Soft Delete Confirmation) */}
            {isDeleteModalOpen && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110]">
        <div className="bg-white rounded-xl shadow-2xl w-[400px] p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            {/* Warning Icon Container */}
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
            </div>
            
            {/* Modal Content - Switched to English */}
            <div>
                <h3 className="text-xl font-bold text-slate-900">Confirm Deletion?</h3>
                <p className="text-sm text-slate-500 mt-2">
                    The course <span className="font-bold text-slate-800">"{itemToDelete?.name}"</span> will be hidden from the list. Are you sure you want to proceed?
                </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
                <button 
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors" 
                    onClick={() => setIsDeleteModalOpen(false)}
                >
                    Cancel
                </button>
                <button 
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    onClick={confirmHide}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : "Confirm"}
                </button>
            </div>
        </div>
    </div>
)}
        </div>
    );
}