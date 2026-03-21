// src/component/pages/admin/ClassManagement.js
import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { adminApi } from "service/adminApi"; 
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge } from "component/ui";
import { ChevronRight, Search, Pencil, Users, Loader2, ToggleLeft, Download } from "lucide-react";
// Import Component Modal
import CreateClassModal from "./CreateClassModal"; 
import EditClassModal from "./EditClassModal";
import ImportClassModal from "./ImportClassModal";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ClassManagement() {
    const nav = useNavigate();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [q, setQ] = useState(""); 
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editClass, setEditClass] = useState(null); 
    const [statusFilter, setStatusFilter] = useState("all"); // Lọc theo trạng thái
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
            console.error("Lỗi khi tải danh sách lớp học:", err);
            setLoading(false);
        }
    };

    useEffect(() => { fetchClasses(); }, []);

    const filteredClasses = useMemo(() => {
        let result = classes;
        if (statusFilter !== "all") {
            result = result.filter(cl => cl.status === statusFilter);
        }
        if (q) {
            result = result.filter(cl => 
                cl.name?.toLowerCase().includes(q.toLowerCase()) || 
                cl.course?.name?.toLowerCase().includes(q.toLowerCase())
            );
        }
        return result;
    }, [q, statusFilter, classes]);

    // File Excel Template Download
    const handleDownloadTemplate = () => {
        const templateData = [
            { "Mã môn": "TOAN10", "Học kỳ": "Học kỳ 1", "Tên lớp": "10A1", "Ngày bắt đầu": "2026-09-05", "Ngày kết thúc": "2027-01-15", "Sĩ số tối đa": 40, "Email giáo viên": "giaovien@school.edu.vn" },
            { "Mã môn": "VAN11", "Học kỳ": "Học kỳ 1", "Tên lớp": "11B2", "Ngày bắt đầu": "2026-09-05", "Ngày kết thúc": "2027-01-15", "Sĩ số tối đa": 35, "Email giáo viên": "" }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        ws["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template_Class");
        XLSX.writeFile(wb, "Template_Import_LopHoc.xlsx");
    };

    const handleExportData = () => {
        const exportData = filteredClasses.map(cl => ({
            "Tên lớp": cl.name,
            "Môn học": cl.course?.name || "",
            "Học kỳ": cl.semester?.name || "",
            "Giáo viên": cl.teacher?.full_name || "Chưa phân công",
            "Sĩ số": `${cl.enrollment_count || 0}/${cl.max_students || 0}`,
            "Trạng thái": cl.status === "active" ? "Đang diễn ra" : (cl.status === "upcoming" ? "Sắp tới" : (cl.status === "closed" ? "Đã đóng" : "Đã hủy"))
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        ws["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_Lop_Hoc");
        XLSX.writeFile(wb, "Danh_sach_Lop_Hoc.xlsx");
    };

    if (loading) return <div className="p-8 text-center text-slate-500 italic">Đang tải danh sách lớp học...</div>;

    return (
        <div className="flex flex-col h-full w-full bg-[#f8fafc] p-8 space-y-6">
            <PageHeader 
                title="Quản lý Lớp học" 
                subtitle="Xem và quản lý danh sách lớp học thời gian thực." 
                right={[
                    <Button 
                        key="export" 
                        variant="outline"
                        className="border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                        onClick={handleExportData}
                    >
                        <Download className="h-4 w-4 mr-1.5" /> Xuất Excel
                    </Button>,
                    <Button 
                        key="template" 
                        variant="outline"
                        className="border-slate-300 text-slate-700 bg-white"
                        onClick={handleDownloadTemplate}
                    >
                        Tải về File mẫu
                    </Button>,
                    <Button 
                        key="import" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setIsImportModalOpen(true)}
                    >
                        Import danh sách
                    </Button>,
                    <Button 
                        key="add" 
                        className="bg-[#0f172a] text-white px-5" 
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        + Tạo Lớp học
                    </Button>
                ]} 
            />

            {/* Thanh Search & Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 relative shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={q} 
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Tìm kiếm theo mã hoặc tên lớp..." 
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="w-full sm:w-64">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all bg-white"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang diễn ra</option>
                        <option value="upcoming">Sắp tới</option>
                        <option value="closed">Đã đóng</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>
            </div>

            {/* Bảng dữ liệu */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <Th className="py-5 px-6">Lớp học</Th>
                                    <Th>Môn học</Th>
                                    <Th>Học kỳ</Th>
                                    <Th>Giáo viên</Th>
                                    <Th>Sĩ số</Th>
                                    <Th>Trạng thái</Th>
                                    <Th className="text-center">Thao tác</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredClasses.map((cl) => (
                                    <tr key={cl.id} className="hover:bg-slate-50 transition-colors">
                                        <Td className="py-5 px-6 font-bold">{cl.name}</Td>
                                        <Td>{cl.course?.name || "N/A"}</Td>
                                        <Td className="italic">{cl.semester || "Kỳ học 2026"}</Td>
                                        <Td>{cl.teacher?.full_name || "Chưa phân công"}</Td>
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                <Users size={14} />
                                                <span className="font-semibold">{cl.enrollments?.length || 0}</span> / {cl.max_capacity || 40}
                                            </div>
                                        </Td>
                                        <Td>
                                            <Badge tone={cl.status === "active" ? "green" : (cl.status === "upcoming" ? "blue" : (cl.status === "cancelled" ? "red" : "slate"))}>
                                                {cl.status === "active" ? "Đang diễn ra" : (cl.status === "upcoming" ? "Sắp tới" : (cl.status === "cancelled" ? "Đã hủy" : "Đã đóng"))}
                                            </Badge>
                                        </Td>
                                        <Td className="flex justify-center gap-4 py-5">
                                            <button onClick={() => nav(`/admin/classes/${cl.id}`)}>
                                                <ChevronRight size={18} className="text-blue-600 hover:text-blue-800" title="Xem chi tiết" />
                                            </button>
                                            <button onClick={() => setEditClass(cl)}>
                                                <Pencil size={18} className="text-slate-400 hover:text-slate-700" title="Sửa" />
                                            </button>
                                            <button onClick={() => { setStatusModalClass(cl); setStatusAction(cl.status); }}>
                                                <ToggleLeft size={18} className="text-slate-400 hover:text-indigo-600" title="Đổi trạng thái" />
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

            {/* IMPORT MODAL */}
            <ImportClassModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    fetchClasses();
                }}
                onDownloadTemplate={handleDownloadTemplate}
            />

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
                                Bạn đang chuyển lớp <span className="font-bold text-slate-800">"{statusModalClass?.name}"</span> sang trạng thái mới. Thao tác này có thể ảnh hưởng đến học sinh.
                            </p>
                            <select 
                                className="w-full mt-4 p-3 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:border-indigo-500"
                                value={statusAction}
                                onChange={(e) => setStatusAction(e.target.value)}
                            >
                                <option value="active">Đang diễn ra (Active)</option>
                                <option value="upcoming">Sắp tới (Upcoming)</option>
                                <option value="closed">Đã đóng (Closed)</option>
                                <option value="cancelled">Đã hủy (Cancelled)</option>
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