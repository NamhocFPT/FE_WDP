import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    const [activeTab, setActiveTab] = useState("Overview");
    const [cl, setCl] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isImportStudentsOpen, setIsImportStudentsOpen] = useState(false);
    const [editSessionGroup, setEditSessionGroup] = useState(null);

    const fetchDetail = async () => {
        try {
            const res = await adminApi.getClassDetail(id);
            setCl(res.data.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching class detail:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading class information...</div>;
    if (!cl) return <div className="p-8 text-center text-red-500">Class not found.</div>;

    const tabs = [
        { id: "Overview", icon: <Info size={16}/> },
        { id: "Teachers", icon: <BookOpen size={16}/> },
        { id: "Students", icon: <Users size={16}/> },
        { id: "Schedule", icon: <Calendar size={16}/> }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => nav("/admin/classes")} className="p-2 hover:bg-slate-100 rounded-full transition">
                    <ChevronLeft size={24} />
                </button>
                <PageHeader 
                    title={cl.name} 
                    subtitle={cl.course?.name} 
                    right={[<Badge key="cap" tone="indigo">{cl.enrollments?.length || 0}/40 Students</Badge>]}
                />
            </div>

            {/* Tab Navigation chuẩn Figma */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {tab.icon} {tab.id}
                    </button>
                ))}
            </div>

            <div className="mt-4">
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
                onSuccess={fetchDetail}
            />
            
            <EditSessionModal
                isOpen={!!editSessionGroup}
                onClose={() => setEditSessionGroup(null)}
                classId={cl.id}
                sessionGroup={editSessionGroup}
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

// --- Định nghĩa các Tab Component để sửa lỗi 'is not defined' ---

const OverviewTab = ({ cl, onAssignClick }) => (
    <div className="grid gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader><CardTitle>Class Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm italic">
                <div><label className="text-slate-400 block not-italic font-medium">Semester</label><span className="font-bold">{cl.semester}</span></div>
                <div><label className="text-slate-400 block not-italic font-medium">Start Date</label><span className="font-bold">{cl.start_date}</span></div>
                <div><label className="text-slate-400 block not-italic font-medium">Capacity</label><span className="font-bold">{cl.max_capacity} students</span></div>
                <div><label className="text-slate-400 block not-italic font-medium">Status</label><Badge tone="green">{cl.status}</Badge></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex justify-between items-center"><CardTitle>Main Teacher</CardTitle><Button variant="outline" size="sm" onClick={onAssignClick}>Change</Button></CardHeader>
            <CardContent className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {cl.teacher?.full_name?.charAt(0) || "T"}
                </div>
                <div>
                    <div className="font-bold text-slate-900">{cl.teacher?.full_name || "Unassigned"}</div>
                    <div className="text-xs text-slate-500">Primary Instructor</div>
                </div>
            </CardContent>
        </Card>
    </div>
);

const TeachersTab = ({ cl, onAssignClick, onUnassignSuccess }) => {
    const [removing, setRemoving] = useState(false);

    const handleUnassign = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn gỡ phân công giảng viên này?")) return;
        setRemoving(true);
        try {
            await adminApi.assignTeacher(cl.id, null);
            toast.success("Gỡ phân công thành công!");
            onUnassignSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setRemoving(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Assigned Teachers</CardTitle>
                <Button size="sm" className="bg-blue-600" onClick={onAssignClick}><UserPlus size={16} className="mr-2"/> Assign Teacher</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <thead><tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th className="text-right">Action</Th></tr></thead>
                    <tbody>
                        {cl.teacher ? (
                            <tr>
                                <Td className="font-bold">{cl.teacher.full_name}</Td>
                                <Td>{cl.teacher.email}</Td>
                                <Td><Badge tone="blue">Primary</Badge></Td>
                                <Td className="text-right">
                                    <button 
                                        onClick={handleUnassign} 
                                        disabled={removing}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Gỡ phân công (Unassign)"
                                    >
                                        {removing ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                    </button>
                                </Td>
                            </tr>
                        ) : (
                            <tr>
                                <Td colSpan={4} className="text-center text-slate-500 py-6">Chưa có giảng viên được phân công.</Td>
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
            toast.success("Xóa học viên thành công!");
            setConfirmModalState({ isOpen: false, studentId: null, studentName: "" });
            if (onUnenrollSuccess) onUnenrollSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa học viên");
        } finally {
            setIsUnenrolling(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex justify-between items-center">
                <CardTitle>Enrolled Students</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onImportClick}><Upload size={16} className="mr-2"/> Import</Button>
                    <Button size="sm" className="bg-blue-600" onClick={onAddStudentClick}><Plus size={16} className="mr-2"/> Add Student</Button>
                </div>
            </CardHeader>
            <CardContent>
                {cl.enrollments && cl.enrollments.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm font-medium border-b">
                                <th className="p-3 w-1/4">Name</th>
                                <th className="p-3 w-1/3">Email</th>
                                <th className="p-3 w-1/4">Student ID</th>
                                <th className="p-3 w-1/6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {cl.enrollments.map((en, index) => (
                                <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-medium">{en.student?.full_name}</td>
                                    <td className="p-3 text-slate-500">{en.student?.email}</td>
                                    <td className="p-3 text-slate-500">ST100{index}</td>
                                    <td className="p-3 text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-slate-600 hover:text-red-600"
                                            onClick={() => handleUnenrollClick(en.user_id, en.student?.full_name)}
                                        >
                                            <Minus size={14} className="mr-2"/> Unenroll
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center text-slate-500 py-8">
                        Chưa có học sinh trong lớp.
                    </div>
                )}
            </CardContent>
        </Card>

        <ConfirmModal
            isOpen={confirmModalState.isOpen}
            onClose={() => setConfirmModalState({ isOpen: false, studentId: null, studentName: "" })}
            onConfirm={confirmUnenroll}
            title="Xác nhận Xóa Học Viên"
            message={<span>Bạn có chắc chắn muốn xóa học viên <strong className="text-slate-900">{confirmModalState.studentName}</strong> khỏi lớp này không? Hành động này không thể hoàn tác.</span>}
            confirmText="Xác nhận Xóa"
            cancelText="Hủy bỏ"
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
        return new Date(dateStr).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const getDayOfWeek = (dateStr) => {
        if (!dateStr) return "";
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
            const room = s.room || "N/A";
            
            const key = `${day}-${startTimeStr}-${endTimeStr}-${room}`;
            if (!groups[key]) {
                groups[key] = {
                    id: s.id, // ID of the first session in this group for key rendering
                    sessionIds: [], // Keep track of all IDs in this group
                    day: day,
                    time: `${startTimeStr} - ${endTimeStr}`,
                    room: room,
                    teacher: cl.teacher?.full_name || "Unassigned"
                };
            }
            groups[key].sessionIds.push(s.id);
        });
        groupedSchedules.push(...Object.values(groups));
    }

    const handleDelete = async (group) => {
        if (!window.confirm("Bác có chắc chắn muốn xóa toàn bộ các buổi học thuộc lịch trình này không?")) return;
        setDeletingId(group.id);
        try {
            await adminApi.deleteSessions(cl.id, group.sessionIds);
            toast.success("Schedule deleted successfully!");
            onDeleteSessionSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete schedule");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Class Sessions</CardTitle>
                <Button size="sm" className="bg-blue-600" onClick={onAddSessionClick}><Plus size={16} className="mr-2"/> Add Session</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <thead>
                        <tr>
                            <Th>Day</Th>
                            <Th>Time</Th>
                            <Th>Room</Th>
                            <Th>Teacher</Th>
                            <Th className="text-right">Actions</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedSchedules.length > 0 ? (
                            groupedSchedules.map(group => (
                                <tr key={group.id}>
                                    <Td className="font-bold">{group.day}</Td>
                                    <Td>{group.time}</Td>
                                    <Td>{group.room}</Td>
                                    <Td>{group.teacher}</Td>
                                    <Td className="text-right space-x-2">
                                        <button 
                                            onClick={() => onEditSessionClick(group)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Schedule"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(group)}
                                            disabled={deletingId === group.id}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Delete Schedule"
                                        >
                                            {deletingId === group.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                        </button>
                                    </Td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <Td colSpan={5} className="text-center text-slate-500 py-6">No sessions scheduled.</Td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    );
};