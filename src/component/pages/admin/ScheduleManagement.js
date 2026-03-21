import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
    addDays,
    addMonths,
    addWeeks,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    parseISO,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subDays,
    subMonths,
    subWeeks,
} from "date-fns";
import { vi } from "date-fns/locale";
import {
    Badge,
    Button,
    Card,
    CardContent,
    Input,
    Modal,
    PageHeader,
    SearchableSelect,
} from "component/ui";
import {
    BookOpen,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Download,
    Filter,
    MapPin,
    Plus,
    RefreshCcw,
    Upload,
    Users,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "service/adminApi";
import { api } from "service/api";
import { get } from "utils/request";
import ImportScheduleModal from "./ImportScheduleModal";

const CALENDAR_VIEWS = [
    { id: "day", label: "Ngày" },
    { id: "week", label: "Tuần" },
    { id: "month", label: "Tháng" },
];

const FPT_SLOTS = [
    { id: 1, name: "Slot 1" },
    { id: 2, name: "Slot 2" },
    { id: 3, name: "Slot 3" },
    { id: 4, name: "Slot 4" },
    { id: 5, name: "Slot 5" },
    { id: 6, name: "Slot 6" },
];

function getSlotFromTime(dateStr) {
    const time = parseISO(dateStr).getHours() + parseISO(dateStr).getMinutes() / 60;
    if (time < 9.5) return 1;
    if (time < 12.5) return 2;
    if (time < 15.25) return 3;
    if (time < 17.75) return 4;
    if (time < 20.0) return 5;
    return 6;
}

function getDisplayStatus(session) {
    if (session.status === "cancelled") return "cancelled";
    if (session.status === "done" || session.status === "completed") return "completed";
    const now = new Date();
    const start = parseISO(session.start_time);
    const end = parseISO(session.end_time);
    if (end < now) return "scheduled";
    if (start <= now && end >= now) return "ongoing";
    return "upcoming";
}

function getStatusInfo(status) {
    switch (status) {
        case "upcoming":
            return { tone: "blue", label: "Sắp tới", block: "bg-blue-50 border-blue-200" };
        case "ongoing":
            return { tone: "amber", label: "Đang diễn ra", block: "bg-amber-50 border-amber-200" };
        case "completed":
            return { tone: "green", label: "Hoàn thành", block: "bg-emerald-50 border-emerald-200" };
        case "cancelled":
            return { tone: "red", label: "Đã hủy", block: "bg-red-50 border-red-200" };
        default:
            return { tone: "slate", label: "Đã lên lịch", block: "bg-slate-50 border-slate-200" };
    }
}

function SummaryCard({ icon, label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="text-blue-600">{icon}</span>
                {label}
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
        </div>
    );
}

function SessionBlock({ session, onClick, large = false }) {
    const statusInfo = getStatusInfo(session.display_status);
    return (
        <button
            onClick={() => onClick(session)}
            className={`w-full rounded-xl border p-2 text-left transition hover:shadow-sm ${statusInfo.block}`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-700">
                    {format(parseISO(session.start_time), "HH:mm")} - {format(parseISO(session.end_time), "HH:mm")}
                </div>
                <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
            </div>
            <div className={`mt-2 font-bold text-slate-900 ${large ? "text-base" : "text-sm"} truncate`}>
                {session.class?.name}
            </div>
            <div className="mt-1 text-xs text-slate-600 truncate">
                {session.course?.code || session.class?.course?.code || "Chưa có môn"} | {session.room || "Chưa có phòng"}
            </div>
            {large && (session.topic || session.note) ? (
                <div className="mt-2 text-xs text-slate-500 line-clamp-2">{session.topic || session.note}</div>
            ) : null}
        </button>
    );
}

export default function ScheduleManagement() {
    const [viewMode, setViewMode] = useState("week");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([{ label: "Tất cả lớp", value: "" }]);
    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [selectedClassFilterId, setSelectedClassFilterId] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");
    const [courseCodeFilter, setCourseCodeFilter] = useState("");
    const [semesterFilter, setSemesterFilter] = useState("");
    const [roomFilter, setRoomFilter] = useState("");
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isLoadingMeta, setIsLoadingMeta] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [room, setRoom] = useState("");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { dateFrom, dateTo } = useMemo(() => {
        if (viewMode === "day") {
            return { dateFrom: startOfDay(currentDate), dateTo: startOfDay(currentDate) };
        }
        if (viewMode === "month") {
            return { dateFrom: startOfMonth(currentDate), dateTo: endOfMonth(currentDate) };
        }
        return {
            dateFrom: startOfWeek(currentDate, { weekStartsOn: 1 }),
            dateTo: endOfWeek(currentDate, { weekStartsOn: 1 }),
        };
    }, [currentDate, viewMode]);

    const headerDateText = useMemo(() => {
        if (viewMode === "day") {
            return format(currentDate, "dd/MM/yyyy (EEEE)", { locale: vi });
        }
        if (viewMode === "month") {
            return `Tháng ${format(currentDate, "MM/yyyy", { locale: vi })}`;
        }
        return `${format(dateFrom, "dd/MM")} - ${format(dateTo, "dd/MM/yyyy", { locale: vi })}`;
    }, [currentDate, dateFrom, dateTo, viewMode]);

    const fetchTeachers = useCallback(async () => {
        setIsLoadingMeta(true);
        try {
            const res = await adminApi.getTeachers();
            const data = res.data?.data || [];
            const mapped = data.map((teacher) => ({
                value: String(teacher.id),
                label: `${teacher.full_name} - ${teacher.email}`,
                teacher,
            }));
            setTeachers(mapped);
            setSelectedTeacherId((current) => current || mapped[0]?.value || "");
        } catch (error) {
            console.error("Failed to fetch teachers", error);
            toast.error("Không thể tải danh sách giảng viên.");
        } finally {
            setIsLoadingMeta(false);
        }
    }, []);

    const fetchClasses = useCallback(async () => {
        if (!selectedTeacherId) {
            setClasses([{ label: "Tất cả lớp", value: "" }]);
            return;
        }
        try {
            const res = await get(`api/v1/admin/classes?teacher_id=${selectedTeacherId}&limit=100`);
            const classData = res.data || [];
            setClasses([
                { label: "Tất cả lớp", value: "" },
                ...classData.map((item) => ({
                    value: item.id,
                    label: `${item.name} - ${item.course?.code || ""}`.replace(/ - $/, ""),
                    classItem: item,
                })),
            ]);
        } catch (error) {
            console.error("Failed to fetch classes", error);
            setClasses([{ label: "Tất cả lớp", value: "" }]);
        }
    }, [selectedTeacherId]);

    const fetchSchedule = useCallback(async () => {
        if (!selectedTeacherId) {
            setSessions([]);
            return;
        }
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                teacher_id: selectedTeacherId,
                from: format(dateFrom, "yyyy-MM-dd"),
                to: format(dateTo, "yyyy-MM-dd"),
                limit: "500",
            });
            if (selectedClassFilterId) params.append("class_id", selectedClassFilterId);
            if (courseCodeFilter.trim()) params.append("course_code", courseCodeFilter.trim());
            if (semesterFilter.trim()) params.append("semester", semesterFilter.trim());
            if (roomFilter.trim()) params.append("room", roomFilter.trim());

            const res = await get(`api/v1/admin/class-sessions?${params.toString()}`);
            const data = (res.data || []).map((session) => ({
                ...session,
                course: session.class?.course || null,
                display_status: getDisplayStatus(session),
            }));
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch admin schedule", error);
            toast.error("Không thể tải thời khóa biểu.");
            setSessions([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedTeacherId, dateFrom, dateTo, selectedClassFilterId, courseCodeFilter, semesterFilter, roomFilter]);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    useEffect(() => {
        setSelectedClassFilterId("");
        setSelectedClassId("");
        fetchClasses();
    }, [fetchClasses]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const selectedTeacher = useMemo(
        () => teachers.find((item) => item.value === selectedTeacherId)?.teacher || null,
        [teachers, selectedTeacherId]
    );

    const selectedClassOption = useMemo(
        () => classes.find((item) => item.value === selectedClassId)?.classItem || null,
        [classes, selectedClassId]
    );

    const displayDateLimits = useMemo(() => {
        if (!selectedClassOption) return { min: "", max: "" };
        return {
            min: selectedClassOption.start_date ? selectedClassOption.start_date.split("T")[0] : "",
            max: selectedClassOption.end_date ? selectedClassOption.end_date.split("T")[0] : "",
        };
    }, [selectedClassOption]);

    const summary = useMemo(() => {
        const classSet = new Set();
        const roomSet = new Set();
        let upcoming = 0;
        sessions.forEach((session) => {
            if (session.class?.name) classSet.add(session.class.name);
            if (session.room) roomSet.add(session.room);
            if (["upcoming", "ongoing", "scheduled"].includes(session.display_status)) upcoming += 1;
        });
        return {
            totalSessions: sessions.length,
            totalClasses: classSet.size,
            totalRooms: roomSet.size,
            upcoming,
        };
    }, [sessions]);

    const handlePrev = () => {
        if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));
        else if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
        else setCurrentDate(subWeeks(currentDate, 1));
    };

    const handleNext = () => {
        if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));
        else if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
        else setCurrentDate(addWeeks(currentDate, 1));
    };

    const handleToday = () => setCurrentDate(new Date());

    const handleResetFilters = () => {
        setSelectedClassFilterId("");
        setCourseCodeFilter("");
        setSemesterFilter("");
        setRoomFilter("");
    };

    const handleExport = () => {
        if (!sessions.length) {
            toast.error("Không có lịch học để xuất.");
            return;
        }

        const rows = sessions.map((session, index) => ({
            STT: index + 1,
            "Giảng viên": selectedTeacher?.full_name || "",
            Lop: session.class?.name || "",
            Mon: session.course?.code || session.class?.course?.code || "",
            Ngày: format(parseISO(session.start_time), "dd/MM/yyyy"),
            "Bắt đầu": format(parseISO(session.start_time), "HH:mm"),
            "Kết thúc": format(parseISO(session.end_time), "HH:mm"),
            Phòng: session.room || "",
            "Trạng thái": getStatusInfo(session.display_status).label,
            "Chủ đề": session.topic || "",
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "AdminSchedule");
        XLSX.writeFile(wb, `AdminSchedule_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    const handleSubmit = async () => {
        if (!selectedClassId || !selectedDate || !startTime || !endTime || !room.trim()) {
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
            return;
        }

        const startDateTime = new Date(`${selectedDate}T${startTime}:00+07:00`);
        const endDateTime = new Date(`${selectedDate}T${endTime}:00+07:00`);
        if (endDateTime <= startDateTime) {
            toast.error("Giờ kết thúc phải lớn hơn giờ bắt đầu.");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await api.post(`/v1/admin/classes/${selectedClassId}/sessions/manual`, {
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                room: room.trim(),
                note: note.trim() || undefined,
            });
            if (!res.ok) throw new Error(res.data?.message || "Không thể tạo buổi học.");
            toast.success("Tạo buổi học thành công.");
            setIsAddModalOpen(false);
            setSelectedDate("");
            setStartTime("");
            setEndTime("");
            setRoom("");
            setNote("");
            fetchSchedule();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Không thể tạo buổi học.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCalendarGrid = () => {
        if (isLoading) {
            return (
                <div className="flex h-64 items-center justify-center text-slate-500">
                    <RefreshCcw className="mr-2 h-5 w-5 animate-spin" /> Đang tải thời khóa biểu...
                </div>
            );
        }

        if (!sessions.length) {
            return (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-500">
                    Không có lịch học phù hợp trong khoảng hiện tại.
                </div>
            );
        }

        if (viewMode === "week") {
            const days = Array.from({ length: 7 }, (_, index) => addDays(dateFrom, index));
            return (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <div className="grid min-w-[900px] grid-cols-[84px_repeat(7,1fr)] gap-px bg-slate-200">
                        <div className="bg-slate-50" />
                        {days.map((day) => (
                            <div key={day.toISOString()} className="bg-slate-50 py-3 text-center">
                                <div className="text-xs font-semibold uppercase text-slate-500">
                                    {format(day, "EEEE", { locale: vi })}
                                </div>
                                <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? "text-blue-600" : "text-slate-900"}`}>
                                    {format(day, "dd/MM")}
                                </div>
                            </div>
                        ))}

                        {FPT_SLOTS.map((slot) => (
                            <React.Fragment key={slot.id}>
                                <div className="flex items-center justify-center bg-slate-50 px-2 py-4 text-center">
                                    <span className="text-sm font-semibold text-slate-700">{slot.name}</span>
                                </div>
                                {days.map((day) => {
                                    const cellSessions = sessions
                                        .filter((session) => isSameDay(parseISO(session.start_time), day) && getSlotFromTime(session.start_time) === slot.id)
                                        .sort((a, b) => parseISO(a.start_time) - parseISO(b.start_time));
                                    return (
                                        <div key={`${slot.id}-${day.toISOString()}`} className="min-h-[112px] space-y-2 bg-white p-2">
                                            {cellSessions.map((session) => (
                                                <SessionBlock key={session.id} session={session} onClick={setSelectedSession} />
                                            ))}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            );
        }

        if (viewMode === "day") {
            return (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase text-slate-500">
                            {format(dateFrom, "EEEE", { locale: vi })}
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {format(dateFrom, "dd MMMM yyyy", { locale: vi })}
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {FPT_SLOTS.map((slot) => {
                            const slotSessions = sessions
                                .filter((session) => isSameDay(parseISO(session.start_time), dateFrom) && getSlotFromTime(session.start_time) === slot.id)
                                .sort((a, b) => parseISO(a.start_time) - parseISO(b.start_time));
                            if (!slotSessions.length) return null;
                            return (
                                <div key={slot.id} className="grid gap-4 p-4 md:grid-cols-[120px_1fr]">
                                    <div className="rounded-xl bg-slate-50 px-3 py-4 text-center font-semibold text-slate-700">
                                        {slot.name}
                                    </div>
                                    <div className="space-y-3">
                                        {slotSessions.map((session) => (
                                            <SessionBlock key={session.id} session={session} onClick={setSelectedSession} large />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        const grouped = sessions.reduce((acc, session) => {
            const key = format(parseISO(session.start_time), "yyyy-MM-dd");
            acc[key] = acc[key] || [];
            acc[key].push(session);
            return acc;
        }, {});

        return (
            <div className="space-y-4">
                {Object.keys(grouped)
                    .sort()
                    .map((dateKey) => (
                        <Card key={dateKey}>
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800">
                                {format(parseISO(dateKey), "EEEE - dd/MM/yyyy", { locale: vi })}
                            </div>
                            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {grouped[dateKey]
                                    .sort((a, b) => parseISO(a.start_time) - parseISO(b.start_time))
                                    .map((session) => (
                                        <SessionBlock key={session.id} session={session} onClick={setSelectedSession} />
                                    ))}
                            </CardContent>
                        </Card>
                    ))}
            </div>
        );
    };

    const pageActions = (
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsImportModalOpen(true)}>
                <Upload size={16} /> Nhập lịch học
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExport} disabled={!sessions.length}>
                <Download size={16} /> Xuất Excel
            </Button>
            <Button variant="primary" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={16} /> Thêm buổi học
            </Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quản lý lịch học"
                subtitle="Theo dõi lịch dạy theo từng giảng viên dưới dạng thời khóa biểu."
                right={pageActions}
            />

            <Card className="overflow-visible">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Filter size={16} className="text-blue-600" />
                        Bộ lọc lịch học
                    </div>
                </div>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
                        <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Giảng viên</div>
                            <SearchableSelect
                                options={teachers}
                                value={selectedTeacherId}
                                onChange={setSelectedTeacherId}
                                placeholder={isLoadingMeta ? "Đang tải giảng viên..." : "Chọn giảng viên"}
                            />
                        </div>
                        <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Lớp học</div>
                            <SearchableSelect
                                options={classes}
                                value={selectedClassFilterId}
                                onChange={setSelectedClassFilterId}
                                placeholder="Tất cả lớp"
                            />
                        </div>
                        <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Mã môn</div>
                            <Input value={courseCodeFilter} onChange={(event) => setCourseCodeFilter(event.target.value)} placeholder="VD: SWP391" />
                        </div>
                        <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Học kỳ</div>
                            <Input value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)} placeholder="VD: Spring 2026" />
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto]">
                        <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Phòng học</div>
                            <Input value={roomFilter} onChange={(event) => setRoomFilter(event.target.value)} placeholder="VD: P301" />
                        </div>
                        <Button variant="outline" className="self-end gap-2" onClick={fetchSchedule} disabled={isLoading}>
                            <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
                            Làm mới
                        </Button>
                        <Button variant="ghost" className="self-end" onClick={handleResetFilters}>
                            Xóa lọc
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-4">
                <Card className="xl:col-span-1">
                    <CardContent className="space-y-4">
                        <div className="rounded-2xl bg-slate-900 p-4 text-white">
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Teacher focus</div>
                            <div className="mt-2 text-xl font-black">{selectedTeacher?.full_name || "Chưa chọn giảng viên"}</div>
                            <div className="mt-1 text-sm text-slate-300">{selectedTeacher?.email || "Chọn một giảng viên để xem lịch."}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <SummaryCard icon={<Calendar size={16} />} label="Buổi học" value={summary.totalSessions} />
                            <SummaryCard icon={<BookOpen size={16} />} label="Lớp học" value={summary.totalClasses} />
                            <SummaryCard icon={<MapPin size={16} />} label="Phòng" value={summary.totalRooms} />
                            <SummaryCard icon={<Clock3 size={16} />} label="Sắp tới" value={summary.upcoming} />
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Users size={16} className="text-blue-600" />
                                Hướng dẫn nhanh
                            </div>
                            <div className="mt-3 space-y-2 text-sm text-slate-600">
                                <div>1. Chọn một giảng viên để xem lịch dạy.</div>
                                <div>2. Lọc tiếp theo lớp, môn, học kỳ hoặc phòng nếu cần.</div>
                                <div>3. Dùng chế độ ngày, tuần, tháng để xem theo mức độ chi tiết.</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-visible xl:col-span-3">
                    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="px-3" onClick={handlePrev}>
                                <ChevronLeft size={16} />
                            </Button>
                            <div className="min-w-[220px] text-center font-semibold capitalize text-slate-800">
                                {headerDateText}
                            </div>
                            <Button variant="outline" className="px-3" onClick={handleNext}>
                                <ChevronRight size={16} />
                            </Button>
                            <Button variant="outline" onClick={handleToday}>
                                Hôm nay
                            </Button>
                        </div>

                        <div className="flex rounded-lg bg-slate-100 p-1">
                            {CALENDAR_VIEWS.map((mode) => (
                                <button
                                    key={mode.id}
                                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                                        viewMode === mode.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                    onClick={() => setViewMode(mode.id)}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4">{renderCalendarGrid()}</div>
                </Card>
            </div>

            <Modal open={!!selectedSession} onClose={() => setSelectedSession(null)} title="Chi tiết buổi học">
                {selectedSession ? (
                    <div className="space-y-4">
                        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                            <div>
                                <div className="text-sm text-slate-500">Lớp học</div>
                                <div className="font-semibold text-slate-900">{selectedSession.class?.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">Môn học</div>
                                <div className="font-semibold text-slate-900">{selectedSession.course?.code || selectedSession.class?.course?.code}</div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">Thời gian</div>
                                <div className="font-semibold text-slate-900">
                                    {format(parseISO(selectedSession.start_time), "HH:mm dd/MM/yyyy")} - {format(parseISO(selectedSession.end_time), "HH:mm")}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">Phòng học</div>
                                <div className="font-semibold text-slate-900">{selectedSession.room || "Chưa có phòng"}</div>
                            </div>
                        </div>
                        <div>
                            <div className="mb-1 text-sm text-slate-500">Trạng thái</div>
                            <Badge tone={getStatusInfo(selectedSession.display_status).tone}>
                                {getStatusInfo(selectedSession.display_status).label}
                            </Badge>
                        </div>
                        <div>
                            <div className="mb-1 text-sm text-slate-500">Chủ đề / ghi chú</div>
                            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                                {selectedSession.topic || selectedSession.note || "Chưa có nội dung bổ sung."}
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm buổi học mới">
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Lớp học</label>
                        <SearchableSelect options={classes.filter((item) => item.value)} value={selectedClassId} onChange={setSelectedClassId} placeholder="Tìm và chọn lớp học..." />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Giảng viên</label>
                        <Input readOnly value={selectedTeacher?.full_name || "Chọn giảng viên trước"} className="cursor-not-allowed bg-slate-50 text-slate-500" />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Ngày học</label>
                        <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} min={displayDateLimits.min} max={displayDateLimits.max} disabled={!selectedClassId} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Giờ bắt đầu</label>
                            <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Giờ kết thúc</label>
                            <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Phòng học</label>
                        <Input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="VD: P301" />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú</label>
                        <textarea className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" rows="3" value={note} onChange={(event) => setNote(event.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Hủy</Button>
                        <Button variant="primary" className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Đang lưu..." : "Lưu buổi học"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <ImportScheduleModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={fetchSchedule} />
        </div>
    );
}
