// src/component/pages/admin/ClassManagement.js
import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { adminApi } from "service/adminApi"; 
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge } from "component/ui";
import { ChevronRight, Search, Pencil, Users, Ban, Loader2, ToggleLeft } from "lucide-react";
// Import Component Modal
import CreateClassModal from "./CreateClassModal"; 
import EditClassModal from "./EditClassModal";
import { toast } from "sonner";

export default function ClassManagement() {
    const nav = useNavigate();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [q, setQ] = useState(""); 
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 
    const [editClass, setEditClass] = useState(null); 
    // Status Change Modal
    const [statusModalClass, setStatusModalClass] = useState(null);
    const [statusAction, setStatusAction] = useState(""); // "closed" or "cancelled"

    const fetchClasses = async () => {
        try {
            const res = await adminApi.getClasses();
            const activeClasses = res.data.data.filter(cl => !cl.is_deleted);
            setClasses(activeClasses); 
            setLoading(false);
        } catch (err) {
            console.error("Error fetching classes:", err);
            setLoading(false);
        }
    };

    useEffect(() => { fetchClasses(); }, []);

    const filteredClasses = useMemo(() => {
        return classes.filter((cl) => 
            !q || 
            cl.name?.toLowerCase().includes(q.toLowerCase()) || 
            cl.course?.name?.toLowerCase().includes(q.toLowerCase())
        );
    }, [q, classes]);

    if (loading) return <div className="p-8 text-center text-slate-500 italic">Loading classes...</div>;

    return (
        <div className="flex flex-col h-full w-full bg-[#f8fafc] p-8 space-y-6">
            <PageHeader 
                title="Class Management" 
                subtitle="View and manage real-time classes." 
                right={[
                    <Button 
                        key="add" 
                        className="bg-[#0f172a] text-white px-5" 
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Create Class
                    </Button>
                ]} 
            />

            {/* Thanh Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 relative shadow-sm">
                <Search className="absolute left-7 top-7 text-slate-400" size={18} />
                <input 
                    type="text" 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by class code or name..." 
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                />
            </div>

            {/* Bảng dữ liệu */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <Th className="py-5 px-6">Class</Th>
                                    <Th>Course</Th>
                                    <Th>Semester</Th>
                                    <Th>Teacher</Th>
                                    <Th>Enrollment</Th>
                                    <Th>Status</Th>
                                    <Th className="text-center">Actions</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredClasses.map((cl) => (
                                    <tr key={cl.id} className="hover:bg-slate-50 transition-colors">
                                        <Td className="py-5 px-6 font-bold">{cl.name}</Td>
                                        <Td>{cl.course?.name || "N/A"}</Td>
                                        <Td className="italic">{cl.semester || "Spring 2026"}</Td>
                                        <Td>{cl.teacher?.full_name || "Unassigned"}</Td>
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                <Users size={14} />
                                                <span className="font-semibold">{cl.enrollments?.length || 0}</span> / {cl.max_capacity || 40}
                                            </div>
                                        </Td>
                                        <Td>
                                            <Badge tone={cl.status === "active" ? "green" : (cl.status === "upcoming" ? "blue" : (cl.status === "cancelled" ? "red" : "slate"))}>
                                                {cl.status || "active"}
                                            </Badge>
                                        </Td>
                                        <Td className="flex justify-center gap-4 py-5">
                                            <button onClick={() => nav(`/admin/classes/${cl.id}`)}>
                                                <ChevronRight size={18} className="text-blue-600 hover:text-blue-800" />
                                            </button>
                                            <button onClick={() => setEditClass(cl)}>
                                                <Pencil size={18} className="text-slate-400 hover:text-slate-700" />
                                            </button>
                                            <button onClick={() => { setStatusModalClass(cl); setStatusAction(cl.status); }}>
                                                <ToggleLeft size={18} className="text-slate-400 hover:text-indigo-600" title="Change Class Status" />
                                            </button>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* CREATE POPUP */}
            {isCreateModalOpen && (
                <CreateClassModal 
                    onClose={() => setIsCreateModalOpen(false)} 
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        fetchClasses(); 
                    }}
                />
            )}

            {/* EDIT POPUP */}
            {editClass && (
                <EditClassModal 
                    classData={editClass}
                    onClose={() => setEditClass(null)} 
                    onSuccess={() => {
                        setEditClass(null);
                        fetchClasses(); 
                    }}
                />
            )}

            {/* CANCEL/CLOSE CONFIRMATION MODAL */}
            {statusModalClass && createPortal(
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-xl shadow-2xl w-[400px] p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                            <ToggleLeft size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Chi tiết thay đổi trạng thái</h3>
                            <p className="text-sm text-slate-500 mt-2">
                                Bạn đang chuyển lớp <span className="font-bold text-slate-800">"{statusModalClass?.name}"</span> sang trạng thái <span className="font-bold text-indigo-600 uppercase">{statusAction}</span>. Thao tác này có thể ảnh hưởng đến sinh viên.
                            </p>
                            <select 
                                className="w-full mt-4 p-3 border border-slate-200 rounded-lg text-sm bg-slate-50"
                                value={statusAction}
                                onChange={(e) => setStatusAction(e.target.value)}
                            >
                                <option value="active">Active (Đang diễn ra)</option>
                                <option value="upcoming">Upcoming (Sắp tới)</option>
                                <option value="closed">Closed (Đã đóng)</option>
                                <option value="cancelled">Cancelled (Đã hủy)</option>
                            </select>
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                            <button className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors" onClick={() => setStatusModalClass(null)} disabled={actionLoading}>
                                Quay lại
                            </button>
                            <button 
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                onClick={async () => {
                                    setActionLoading(true);
                                    try {
                                        await adminApi.updateClass(statusModalClass.id, { status: statusAction });
                                        toast.success("Đổi trạng thái lớp thành công!");
                                        setStatusModalClass(null);
                                        fetchClasses();
                                    } catch(e) { 
                                        console.error(e);
                                        toast.error(e.response?.data?.message || "Có lỗi xảy ra"); 
                                    } finally { setActionLoading(false); }
                                }}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}