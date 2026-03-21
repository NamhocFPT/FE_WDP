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
import { toast } from "sonner";

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

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    if (loading) return <div className="p-8 text-center text-slate-500 italic">Đang tải thông tin lớp học...</div>;
    if (!cl) return <div className="p-8 text-center text-red-500 font-bold">Không tìm thấy lớp học.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => nav("/admin/classes")} className="p-2 hover:bg-slate-100 rounded-full transition shadow-sm border border-slate-100 bg-white">
                    <ChevronLeft size={20} />
                </button>
                <PageHeader 
                    title={cl.name} 
                    subtitle={cl.course?.name} 
                    right={[<Badge key="cap" tone="indigo" className="px-3 py-1">{cl.enrollments?.length || 0}/40 Sinh viên</Badge>]}
                />
            </div>

            {/* Thanh Tab Navigation cũ đã được chuyển sang Sidebar theo yêu cầu */}
            
            <div className="mt-4 animate-in fade-in duration-500">
                {activeTab === "Overview" && <OverviewTab cl={cl} onAssignClick={() => setIsAssignModalOpen(true)} />}
                {activeTab === "Teachers" && <TeachersTab cl={cl} onAssignClick={() => setIsAssignModalOpen(true)} onUnassignSuccess={fetchDetail} />}
                {activeTab === "Students" && <StudentsTab cl={cl} onAddStudentClick={() => setIsAddStudentOpen(true)} onImportClick={() => setIsImportStudentsOpen(true)} onUnenrollSuccess={fetchDetail} />}
                {activeTab === "Schedule" && <ScheduleTab 
                    cl={cl} 
                    onAddSessionClick={() => setIsAddSessionOpen(true)} 
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
            />
        </div>
    );
}

const OverviewTab = ({ cl, onAssignClick }) => (
    <div className="grid gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader><CardTitle>Thông tin lớp học</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div><label className="text-slate-400 block font-medium">Học kỳ</label><span className="font-bold text-slate-700">{cl.semester}</span></div>
                <div><label className="text-slate-400 block font-medium">Ngày bắt đầu</label><span className="font-bold text-slate-700">{cl.start_date ? new Date(cl.start_date).toLocaleDateString("vi-VN") : "---"}</span></div>
                <div><label className="text-slate-400 block font-medium">Sĩ số</label><span className="font-bold text-slate-700">{cl.enrollments?.length || 0}/{cl.max_capacity} sinh viên</span></div>
                <div><label className="text-slate-400 block font-medium">Trạng thái</label><Badge tone="green">{cl.status === "active" ? "Đang hoạt động" : cl.status}</Badge></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex justify-between items-center"><CardTitle>Giảng viên phụ trách</CardTitle><Button variant="outline" size="sm" onClick={onAssignClick}>Thay đổi</Button></CardHeader>
            <CardContent className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {cl.teacher?.full_name?.charAt(0) || "T"}
                </div>
                <div>
                    <div className="font-bold text-slate-900">{cl.teacher?.full_name || "Chưa phân công"}</div>
                    <div className="text-xs text-slate-500">Giảng viên chính</div>
                </div>
            </CardContent>
        </Card>
    </div>
);

const TeachersTab = ({ cl, onAssignClick, onUnassignSuccess }) => {
    const [removing, setRemoving] = useState(false);

    const handleUnassign = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn bỏ phân công giảng viên này?")) return;
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
                <CardTitle>Danh sách giảng viên</CardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onAssignClick}><UserPlus size={16} className="mr-2"/> Phân công giảng viên</Button>
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
                                <Td colSpan={4} className="text-center text-slate-500 py-6 italic">Chưa có giảng viên được phân công.</Td>
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
            toast.success("Đã hủy đăng ký sinh viên thành công!");
            setConfirmModalState({ isOpen: false, studentId: null, studentName: "" });
            if (onUnenrollSuccess) onUnenrollSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi hủy đăng ký sinh viên");
        } finally {
            setIsUnenrolling(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex justify-between items-center">
                <CardTitle>Sinh viên đã đăng ký</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onImportClick}><Upload size={16} className="mr-2"/> Nhập Excel</Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onAddStudentClick}><Plus size={16} className="mr-2"/> Thêm sinh viên</Button>
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
                                    <td className="p-3 text-slate-500">ST{en.user_id.substring(0,5).toUpperCase()}</td>
                                    <td className="p-3 text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-slate-600 hover:text-red-600"
                                            onClick={() => handleUnenrollClick(en.user_id, en.student?.full_name)}
                                        >
                                            <Minus size={14} className="mr-2"/> Hủy đăng ký
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center text-slate-500 py-8 italic">
                        Chưa có sinh viên nào đăng ký lớp này.
                    </div>
                )}
            </CardContent>
        </Card>

        <ConfirmModal
            isOpen={confirmModalState.isOpen}
            onClose={() => setConfirmModalState({ isOpen: false, studentId: null, studentName: "" })}
            onConfirm={confirmUnenroll}
            title="Xác nhận hủy đăng ký"
            message={<span>Bạn có chắc chắn muốn hủy đăng ký cho sinh viên <strong className="text-slate-900">{confirmModalState.studentName}</strong> khỏi lớp học này? Hành động này không thể hoàn tác.</span>}
            confirmText="Xác nhận hủy"
            cancelText="Quay lại"
            isDestructive={true}
            loading={isUnenrolling}
        />
        </>
    );
};

const ScheduleTab = ({ cl, onAddSessionClick, onEditSessionClick, onDeleteSessionSuccess }) => {
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

    // Group sessions by Schedule Pattern (Day + Time + Room)
    const groupedSchedules = [];
    if (cl.sessions && cl.sessions.length > 0) {
        const groups = {};
        cl.sessions.forEach(s => {
            const day = getDayOfWeek(s.start_time);
            const startTimeStr = formatTime(s.start_time);
            const endTimeStr = formatTime(s.end_time);
            const room = s.room || "Chưa rõ";
            
            const key = `${day}-${startTimeStr}-${endTimeStr}-${room}`;
            if (!groups[key]) {
                groups[key] = {
                    id: s.id,
                    sessionIds: [],
                    day: day,
                    time: `${startTimeStr} - ${endTimeStr}`,
                    room: room,
                    teacher: cl.teacher?.full_name || "Chưa phân công"
                };
            }
            groups[key].sessionIds.push(s.id);
        });
        groupedSchedules.push(...Object.values(groups));
    }

    const handleDelete = async (group) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tất cả buổi học thuộc lịch này không?")) return;
        setDeletingId(group.id);
        try {
            await adminApi.deleteSessions(cl.id, group.sessionIds);
            toast.success("Đã xóa lịch học thành công!");
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
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onAddSessionClick}><Plus size={16} className="mr-2"/> Thêm buổi học</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <thead>
                        <tr>
                            <Th>Thứ</Th>
                            <Th>Thời gian</Th>
                            <Th>Phòng</Th>
                            <Th>Giảng viên</Th>
                            <Th className="text-right">Thao tác</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedSchedules.length > 0 ? (
                            groupedSchedules.map(group => (
                                <tr key={group.id}>
                                    <Td className="font-bold text-slate-900">{group.day}</Td>
                                    <Td className="text-slate-600 font-medium">{group.time}</Td>
                                    <Td>{group.room}</Td>
                                    <Td>{group.teacher}</Td>
                                    <Td className="text-right space-x-2">
                                        <button 
                                            onClick={() => onEditSessionClick(group)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Sửa lịch học"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(group)}
                                            disabled={deletingId === group.id}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Xóa lịch học"
                                        >
                                            {deletingId === group.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                        </button>
                                    </Td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <Td colSpan={5} className="text-center text-slate-500 py-6 italic">Chưa có lịch học nào được thiết lập.</Td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    );
};