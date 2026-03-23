import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { adminApi } from "service/adminApi";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Badge, Button, Table, Th, Td } from "component/ui";
import { Info, BookOpen, Users, Calendar, ChevronLeft, UserPlus, Upload, Plus, Trash2, Loader2, Edit, Minus } from "lucide-react";
import AssignTeacherModal from "./AssignTeacherModal";
import AddSessionModal from "./AddSessionModal";
import EditSessionModal from "./EditSessionModal";
import AddStudentModal from "./AddStudentModal";
import ImportStudentsModal from "./ImportStudentsModal";
import ConfirmModal from "./ConfirmModal";
import ImportScheduleModal from "./ImportScheduleModal";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ClassDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const location = useLocation();

    // Đọc activeTab từ URL search param (?tab=Overview)
    const queryParams = new URLSearchParams(location.search);
    const activeTab = queryParams.get("tab") || "Overview";

    const [cl, setCl] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isImportStudentsOpen, setIsImportStudentsOpen] = useState(false);
    const [isImportScheduleOpen, setIsImportScheduleOpen] = useState(false);
    const [editSessionGroup, setEditSessionGroup] = useState(null);

    const fetchDetail = useCallback(async () => {
        try {
            const res = await adminApi.getClassDetail(id);
            setCl(res.data.data);
            setLoading(false);
        } catch (err) {
            console.error("Lỗi lấy chi tiết lớp học:", err);
            setLoading(false);
        }
    }, [id]);

    const handleDownloadStudentTemplate = () => {
        const templateData = [
            { "Họ tên": "Nguyễn Văn A", "Email": "nguyenvana@school.edu.vn" },
            { "Họ tên": "Trần Thị B", "Email": "tranthib@school.edu.vn" },
            { "Họ tên": "Lê Văn C", "Email": "levanc@school.edu.vn" }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        ws["!cols"] = [{ wch: 25 }, { wch: 35 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachHocSinh");
        XLSX.writeFile(wb, "Student_Import_Template.xlsx");
    };

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    if (loading) return <div className="p-8 text-center text-slate-500 italic">Đang tải thông tin lớp học...</div>;
    if (!cl) return <div className="p-8 text-center text-red-500 font-bold">Không tìm thấy lớp học.</div>;

    return (
        <div className="space-y-6">
            <PageHeader
                title={cl.name}
                subtitle={cl.course?.name}
                onBack={() => nav("/admin/classes")}
                right={[
                    <Badge key="cap" tone="blue" className="px-4 py-1.5 text-sm shadow-sm border border-blue-200 bg-blue-50/50">
                        <Users className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {cl.enrollments?.length || 0} / {cl.max_capacity || 40} Sinh viên
                    </Badge>
                ]}
            />

            {/* Thanh Tab Navigation cũ đã được chuyển sang Sidebar theo yêu cầu */}

            <div className="mt-4 animate-in fade-in duration-500">
                {activeTab === "Overview" && <OverviewTab cl={cl} onAssignClick={() => setIsAssignModalOpen(true)} />}
                {activeTab === "Teachers" && <TeachersTab cl={cl} onAssignClick={() => setIsAssignModalOpen(true)} onUnassignSuccess={fetchDetail} />}
                {activeTab === "Students" && <StudentsTab cl={cl} onAddStudentClick={() => setIsAddStudentOpen(true)} onImportClick={() => setIsImportStudentsOpen(true)} onUnenrollSuccess={fetchDetail} />}
                {activeTab === "Schedule" && <ScheduleTab
                    cl={cl}
                    onAddSessionClick={() => setIsAddSessionOpen(true)}
                    onImportScheduleClick={() => setIsImportScheduleOpen(true)}
                    onEditSessionClick={(group) => setEditSessionGroup(group)}
                    onDeleteSessionSuccess={fetchDetail}
                />}
            </div>

            <AssignTeacherModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                classId={cl.id}
                currentTeacherId={cl.teacher?.id}
                onSuccess={fetchDetail}
            />

            <AddSessionModal
                isOpen={isAddSessionOpen}
                onClose={() => setIsAddSessionOpen(false)}
                classId={cl.id}
                currentTeacherId={cl.teacher?.id}
                onSuccess={fetchDetail}
            />

            <EditSessionModal
                isOpen={!!editSessionGroup}
                onClose={() => setEditSessionGroup(null)}
                classId={cl.id}
                sessionGroup={editSessionGroup}
                currentTeacherId={cl.teacher?.id}
                onSuccess={() => {
                    setEditSessionGroup(null);
                    fetchDetail();
                }}
            />

            <AddStudentModal
                isOpen={isAddStudentOpen}
                onClose={() => setIsAddStudentOpen(false)}
                classId={cl.id}
                enrolledStudentIds={cl.enrollments?.map(e => e.student?.id).filter(Boolean) || []}
                onSuccess={fetchDetail}
            />

            <ImportStudentsModal
                isOpen={isImportStudentsOpen}
                onClose={() => setIsImportStudentsOpen(false)}
                classId={cl.id}
                onSuccess={fetchDetail}
                onDownloadTemplate={handleDownloadStudentTemplate}
            />

            <ImportScheduleModal
                isOpen={isImportScheduleOpen}
                onClose={() => setIsImportScheduleOpen(false)}
                onSuccess={fetchDetail}
                prefilledClassCode={cl.name}
            />
        </div>
    );
}

const OverviewTab = ({ cl, onAssignClick }) => (
    <div className="grid gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader><CardTitle>Thông tin lớp học</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div><label className="text-slate-400 block font-medium uppercase tracking-tighter text-[10px]">Học kỳ</label><span className="font-bold text-slate-700">{cl.semester}</span></div>
                <div><label className="text-slate-400 block font-medium uppercase tracking-tighter text-[10px]">Sĩ số</label><span className="font-bold text-slate-700">{cl.enrollments?.length || 0}/{cl.max_capacity} sinh viên</span></div>
                <div><label className="text-slate-400 block font-medium uppercase tracking-tighter text-[10px]">Ngày bắt đầu</label><span className="font-bold text-slate-700">{cl.start_date ? new Date(cl.start_date).toLocaleDateString("vi-VN") : "---"}</span></div>
                <div><label className="text-slate-400 block font-medium uppercase tracking-tighter text-[10px]">Ngày kết thúc</label><span className="font-bold text-slate-700">{cl.end_date ? new Date(cl.end_date).toLocaleDateString("vi-VN") : "---"}</span></div>
                <div><label className="text-slate-400 block font-medium uppercase tracking-tighter text-[10px]">Trạng thái</label>
                    <Badge 
                        tone={cl.status === "active" ? "green" : cl.status === "upcoming" ? "blue" : "gray"} 
                        className="font-bold"
                    >
                        {cl.status === "active" ? "Đang hoạt động" : cl.status === "upcoming" ? "Chưa bắt đầu" : cl.status === "closed" ? "Đã kết thúc" : cl.status}
                    </Badge>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex justify-between items-center"><CardTitle>Giáo viên phụ trách</CardTitle><Button variant="outline" size="sm" onClick={onAssignClick}>Thay đổi</Button></CardHeader>
            <CardContent className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black border border-blue-100">
                    {cl.teacher?.full_name?.charAt(0) || "T"}
                </div>
                <div>
                    <div className="font-black text-slate-900">{cl.teacher?.full_name || "Chưa phân công"}</div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Giảng viên chính</div>
                </div>
            </CardContent>
        </Card>
    </div>
);

const TeachersTab = ({ cl, onAssignClick, onUnassignSuccess }) => {
    const [removing, setRemoving] = useState(false);

    const handleUnassign = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn bỏ phân công giáo viên này?")) return;
        setRemoving(true);
        try {
            await adminApi.assignTeacher(cl.id, null);
            toast.success("Đã bỏ phân công thành công!");
            onUnassignSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || "Đã xảy ra lỗi");
        } finally {
            setRemoving(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Danh sách giáo viên</CardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onAssignClick}><UserPlus size={16} className="mr-2" /> Phân công giáo viên</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <thead><tr><Th>Họ tên</Th><Th>Email</Th><Th>Vai trò</Th><Th className="text-right">Hành động</Th></tr></thead>
                    <tbody>
                        {cl.teacher ? (
                            <tr>
                                <Td className="font-bold text-indigo-700">{cl.teacher.full_name}</Td>
                                <Td>{cl.teacher.email}</Td>
                                <Td><Badge tone="blue">Chính</Badge></Td>
                                <Td className="text-right">
                                    <button
                                        onClick={handleUnassign}
                                        disabled={removing}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Bỏ phân công"
                                    >
                                        {removing ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                    </button>
                                </Td>
                            </tr>
                        ) : (
                            <tr>
                                <Td colSpan={4} className="text-center text-slate-500 py-6 italic">Chưa có giáo viên được phân công.</Td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    );
};

const StudentsTab = ({ cl, onAddStudentClick, onImportClick, onUnenrollSuccess }) => {
    const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, studentId: null, studentName: "" });
    const [isUnenrolling, setIsUnenrolling] = useState(false);

    const handleUnenrollClick = (studentId, studentName) => {
        setConfirmModalState({ isOpen: true, studentId, studentName });
    };

    const confirmUnenroll = async () => {
        setIsUnenrolling(true);
        try {
            await adminApi.unenrollStudent(cl.id, confirmModalState.studentId);
            toast.success("Đã hủy đăng ký học sinh thành công!");
            setConfirmModalState({ isOpen: false, studentId: null, studentName: "" });
            if (onUnenrollSuccess) onUnenrollSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi hủy đăng ký học sinh");
        } finally {
            setIsUnenrolling(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex justify-between items-center">
                    <CardTitle>Học sinh đã đăng ký</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onImportClick}><Upload size={16} className="mr-2" /> Nhập Excel</Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onAddStudentClick}><Plus size={16} className="mr-2" /> Thêm học sinh</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {cl.enrollments && cl.enrollments.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-sm font-medium border-b">
                                    <th className="p-3 w-1/4">Họ tên</th>
                                    <th className="p-3 w-1/3">Email</th>
                                    <th className="p-3 w-1/4">MSSV</th>
                                    <th className="p-3 w-1/6 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {cl.enrollments.map((en, index) => (
                                    <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-medium">{en.student?.full_name}</td>
                                        <td className="p-3 text-slate-500">{en.student?.email}</td>
                                        <td className="p-3 text-slate-500">ST{en.user_id.substring(0, 5).toUpperCase()}</td>
                                        <td className="p-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-600 hover:text-red-600"
                                                onClick={() => handleUnenrollClick(en.user_id, en.student?.full_name)}
                                            >
                                                <Minus size={14} className="mr-2" /> Hủy đăng ký
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center text-slate-500 py-8 italic">
                            Chưa có học sinh nào đăng ký lớp này.
                        </div>
                    )}
                </CardContent>
            </Card>

            <ConfirmModal
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({ isOpen: false, studentId: null, studentName: "" })}
                onConfirm={confirmUnenroll}
                title="Xác nhận hủy đăng ký"
                message={<span>Bạn có chắc chắn muốn hủy đăng ký cho học sinh <strong className="text-slate-900">{confirmModalState.studentName}</strong> khỏi lớp học này? Hành động này không thể hoàn tác.</span>}
                confirmText="Xác nhận hủy"
                cancelText="Quay lại"
                isDestructive={true}
                loading={isUnenrolling}
            />
        </>
    );
};

const ScheduleTab = ({ cl, onAddSessionClick, onImportScheduleClick, onEditSessionClick, onDeleteSessionSuccess }) => {
    const [deletingId, setDeletingId] = useState(null);

    const formatTime = (dateStr) => {
        if (!dateStr) return "--:--";
        return new Date(dateStr).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const getDayOfWeek = (dateStr) => {
        if (!dateStr) return "";
        const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        return days[new Date(dateStr).getDay()];
    };

    // Sort sessions by start_time
    const sortedSessions = cl.sessions ? [...cl.sessions].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)) : [];
    
    const handleDelete = async (session) => {
        const dateStr = new Date(session.start_time).toLocaleDateString("vi-VN");
        if (!window.confirm(`Bạn có chắc chắn muốn xóa buổi học ngày ${dateStr} không?`)) return;
        setDeletingId(session.id);
        try {
            await adminApi.deleteSessions(cl.id, [session.id]);
            toast.success("Đã xóa buổi học thành công!");
            onDeleteSessionSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa lịch học");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Lịch học chi tiết</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onImportScheduleClick}><Upload size={16} className="mr-2" /> Nhập Excel</Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onAddSessionClick}><Plus size={16} className="mr-2" /> Thêm buổi học</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <thead>
                            <tr>
                                <Th>Ngày</Th>
                                <Th>Thứ</Th>
                                <Th>Thời gian</Th>
                                <Th>Phòng</Th>
                                <Th>Giáo viên</Th>
                                <Th className="text-right">Thao tác</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSessions.length > 0 ? (
                                sortedSessions.map(s => {
                                    const day = getDayOfWeek(s.start_time);
                                    const dateStr = new Date(s.start_time).toLocaleDateString("vi-VN");
                                    const startTimeStr = formatTime(s.start_time);
                                    const endTimeStr = formatTime(s.end_time);
                                    const timeStr = `${startTimeStr} - ${endTimeStr}`;
                                    const room = s.room || "Chưa rõ";
                                    
                                    const group = {
                                        id: s.id,
                                        sessionIds: [s.id],
                                        day: day,
                                        time: timeStr,
                                        room: room,
                                        teacher: cl.teacher?.full_name || "Chưa phân công",
                                        dateISO: s.start_time.split("T")[0]
                                    };

                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3 text-slate-600 font-semibold">{dateStr}</td>
                                            <td className="p-3 font-bold text-slate-800">{day}</td>
                                            <td className="p-3 text-slate-600 font-medium">{timeStr}</td>
                                            <td className="p-3 text-slate-600">{room}</td>
                                            <td className="p-3 text-slate-600">{cl.teacher?.full_name || "Chưa phân công"}</td>
                                            <td className="p-3 text-right space-x-1">
                                                <button
                                                    onClick={() => onEditSessionClick(group)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa lịch học"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s)}
                                                    disabled={deletingId === s.id}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Xóa lịch học"
                                                >
                                                    {deletingId === s.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center text-slate-500 py-8 italic">Chưa có lịch học nào được thiết lập.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}