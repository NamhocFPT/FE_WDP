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
    const statusInfo = getStatusInfo(session.display_status || getDisplayStatus(session));
    
    let badgeClass = "bg-slate-100 text-slate-600";
    if (statusInfo.tone === "blue") badgeClass = "bg-blue-50 text-blue-600";
    if (statusInfo.tone === "amber") badgeClass = "bg-amber-50 text-amber-600";
    if (statusInfo.tone === "green") badgeClass = "bg-emerald-50 text-emerald-600";
    if (statusInfo.tone === "red") badgeClass = "bg-red-50 text-red-600";

    return (
        <button
            onClick={() => onClick(session)}
            className={`w-full max-w-full rounded-xl p-2 md:p-3 text-left transition hover:bg-slate-100 border border-slate-100 overflow-hidden ${statusInfo.tone === 'blue' ? 'bg-blue-50/30' : 'bg-white'}`}
        >
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-1 mb-1">
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-600 leading-[1.2] shrink-0">
                    {format(parseISO(session.start_time), "HH:mm")} - <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>{format(parseISO(session.end_time), "HH:mm")}
                </div>
                <div className={`text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
                    {statusInfo.label}
                </div>
            </div>
            <div className={`mt-1 font-bold text-slate-900 ${large ? "text-base" : "text-xs sm:text-sm"} truncate w-full`}>
                {session.class?.name}
            </div>
            <div className="mt-0.5 text-[10px] sm:text-xs text-slate-500 truncate w-full">
                {session.course?.code || session.class?.course?.code || "Chưa có môn"} | {session.room || "Chưa có phòng"}
            </div>
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
    const [dateStartFilter, setDateStartFilter] = useState("");
    const [dateEndFilter, setDateEndFilter] = useState("");
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
            const fullList = [{ value: "", label: "Tất cả giáo viên" }, ...mapped];
            setTeachers(fullList);
            setSelectedTeacherId((current) => current || fullList[0].value);
        } catch (error) {
            console.error("Failed to fetch teachers", error);
            toast.error("Không thể tải danh sách giáo viên.");
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
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                from: format(dateFrom, "yyyy-MM-dd"),
                to: format(dateTo, "yyyy-MM-dd"),
                all: "true",
            });
            if (selectedTeacherId) params.append("teacher_id", selectedTeacherId);
            if (selectedClassFilterId) params.append("class_id", selectedClassFilterId);
            if (courseCodeFilter.trim()) params.append("course_code", courseCodeFilter.trim());
            if (semesterFilter.trim()) params.append("semester", semesterFilter.trim());
            if (roomFilter.trim()) params.append("room", roomFilter.trim());

            const res = await get(`api/v1/admin/class-sessions?${params.toString()}`);
            const data = (res.data || [])
                .filter(session => session.status !== "cancelled")
                .map((session) => ({
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

    const uniqueTimeSlots = useMemo(() => {
        const slots = new Set();
        sessions.forEach(s => {
            if (s.start_time && s.end_time) {
                const startFormat = format(parseISO(s.start_time), 'HH:mm');
                const endFormat = format(parseISO(s.end_time), 'HH:mm');
                slots.add(`${startFormat} - ${endFormat}`);
            }
        });

        return Array.from(slots).sort((a, b) => {
            const getHour = (str) => {
                const [start] = str.split('-').map(t => t.trim());
                if (!start || !start.includes(':')) return 0;
                const [h, m] = start.split(':').map(Number);
                return h + (m || 0) / 60;
            };
            return getHour(a) - getHour(b);
        });
    }, [sessions]);

    const morningSlots = uniqueTimeSlots.filter(timeStr => {
        const [start] = timeStr.split('-').map(t => t.trim());
        if (!start || !start.includes(':')) return false;
        const [h] = start.split(':').map(Number);
        return h < 12;
    });

    const afternoonSlots = uniqueTimeSlots.filter(timeStr => {
        const [start] = timeStr.split('-').map(t => t.trim());
        if (!start || !start.includes(':')) return false;
        const [h] = start.split(':').map(Number);
        return h >= 12;
    });

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
        setDateStartFilter("");
        setDateEndFilter("");
    };

    const handleExport = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ all: "true" });
            if (selectedTeacherId) params.append("teacher_id", selectedTeacherId);
            if (selectedClassFilterId) params.append("class_id", selectedClassFilterId);
            if (courseCodeFilter.trim()) params.append("course_code", courseCodeFilter.trim());
            if (semesterFilter.trim()) params.append("semester", semesterFilter.trim());
            if (roomFilter.trim()) params.append("room", roomFilter.trim());
            if (dateStartFilter) params.append("from", dateStartFilter);
            if (dateEndFilter) params.append("to", dateEndFilter);

            const res = await get(`api/v1/admin/class-sessions?${params.toString()}`);
            const resultData = res.data;
            const exportSessions = Array.isArray(resultData) ? resultData : (resultData?.data || []);
            const validSessions = exportSessions.filter(session => session.status !== "cancelled");

            if (!validSessions || validSessions.length === 0) {
                toast.error("Không có lịch học để xuất với bộ lọc hiện tại.");
                return;
            }

            const rows = validSessions.map((session, index) => ({
                STT: index + 1,
                "Giáo viên": session.class?.teacher?.full_name || selectedTeacher?.full_name || "",
                "Lớp": session.class?.name || "",
                "Môn": session.course?.code || session.class?.course?.code || "",
                "Ngày": format(parseISO(session.start_time), "dd/MM/yyyy"),
                "Bắt đầu": format(parseISO(session.start_time), "HH:mm"),
                "Kết thúc": format(parseISO(session.end_time), "HH:mm"),
                "Phòng": session.room || "",
                "Trạng thái": getStatusInfo(getDisplayStatus(session)).label,
                "Chủ đề": session.topic || "",
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "AdminSchedule");
            XLSX.writeFile(wb, `LichHoc_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Lỗi khi kết xuất dữ liệu.");
        } finally {
            setIsLoading(false);
        }
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
                    <RefreshCcw className="h-6 w-6 animate-spin mr-2" /> Đang tải lịch dạy...
                </div>
            );
        }

        if (sessions.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">📅</span>
                    </div>
                    <div className="text-slate-600 font-medium text-center">
                        Không có lịch học trong khoảng<br />thời gian này.
                    </div>
                </div>
            );
        }

        if (viewMode === "week") {
            const days = [];
            for (let i = 0; i < 7; i++) {
                days.push(addDays(dateFrom, i));
            }

            const hasMorningSessionsWeekList = morningSlots.some(timeStr => 
                days.some(day => sessions.some(s => {
                    if (!s.start_time || !s.end_time) return false;
                    const sTime = `${format(parseISO(s.start_time), 'HH:mm')} - ${format(parseISO(s.end_time), 'HH:mm')}`;
                    return isSameDay(parseISO(s.start_time), day) && sTime === timeStr;
                }))
            );

            const hasAfternoonSessionsWeekList = afternoonSlots.some(timeStr => 
                days.some(day => sessions.some(s => {
                    if (!s.start_time || !s.end_time) return false;
                    const sTime = `${format(parseISO(s.start_time), 'HH:mm')} - ${format(parseISO(s.end_time), 'HH:mm')}`;
                    return isSameDay(parseISO(s.start_time), day) && sTime === timeStr;
                }))
            );

            return (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="w-full grid grid-cols-[60px_repeat(7,minmax(0,1fr))] bg-slate-200 gap-px">
                        {/* Empty Top-Left Cell */}
                        <div className="bg-slate-50"></div>

                        {/* Header Row */}
                        {days.map((day, idx) => (
                            <div key={idx} className="bg-slate-50 py-3 text-center">
                                <div className="text-xs font-semibold text-slate-500 uppercase">
                                    {format(day, "EEEE", { locale: vi })}
                                </div>
                                <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-slate-900'}`}>
                                    {format(day, "dd/MM")}
                                </div>
                            </div>
                        ))}

                        {/* Grid Body */}
                        {/* BUỔI SÁNG */}
                        <div className="col-span-8 bg-slate-50/90 border-y border-slate-100 p-2.5 font-black text-rose-600 uppercase tracking-wider text-xs flex items-center gap-2 px-4">
                            <span>☀️ BUỔI SÁNG</span>
                        </div>
                        {!hasMorningSessionsWeekList ? (
                            <div className="col-span-8 p-6 text-center text-slate-500 font-medium text-sm bg-white border-b border-slate-100">Không có lịch học buổi sáng trong tuần này.</div>
                        ) : (
                            morningSlots.map((timeStr, idx) => (
                                <React.Fragment key={idx}>
                                    <div className="bg-slate-50 flex flex-col justify-center items-center py-4 px-2 text-center pointer-events-none">
                                        <span className="text-xs font-bold text-slate-700">{timeStr}</span>
                                    </div>
                                    {days.map((day, dIdx) => {
                                        const cellSessions = sessions.filter(s => {
                                            if (!s.start_time || !s.end_time) return false;
                                            const sTime = `${format(parseISO(s.start_time), 'HH:mm')} - ${format(parseISO(s.end_time), 'HH:mm')}`;
                                            return isSameDay(parseISO(s.start_time), day) && sTime === timeStr;
                                        }).sort((a, b) => parseISO(a.start_time) - parseISO(b.start_time));

                                        return (
                                            <div key={`${idx}-${dIdx}`} className="bg-white min-h-[100px] p-1 space-y-2">
                                                {cellSessions.map(session => (
                                                    <SessionBlock key={session.id} session={session} onClick={setSelectedSession} />
                                                ))}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))
                        )}

                        {/* BUỔI CHIỀU */}
                        <div className="col-span-8 bg-slate-50/90 border-y border-slate-100 p-2.5 font-black text-amber-600 uppercase tracking-wider text-xs flex items-center gap-2 px-4">
                            <span>🌤️ BUỔI CHIỀU</span>
                        </div>
                        {!hasAfternoonSessionsWeekList ? (
                            <div className="col-span-8 p-6 text-center text-slate-500 font-medium text-sm bg-white border-b border-slate-100">Không có lịch học buổi chiều trong tuần này.</div>
                        ) : (
                            afternoonSlots.map((timeStr, idx) => (
                                <React.Fragment key={idx}>
                                    <div className="bg-slate-50 flex flex-col justify-center items-center py-4 px-2 text-center pointer-events-none">
                                        <span className="text-xs font-bold text-slate-700">{timeStr}</span>
                                    </div>
                                    {days.map((day, dIdx) => {
                                        const cellSessions = sessions.filter(s => {
                                            if (!s.start_time || !s.end_time) return false;
                                            const sTime = `${format(parseISO(s.start_time), 'HH:mm')} - ${format(parseISO(s.end_time), 'HH:mm')}`;
                                            return isSameDay(parseISO(s.start_time), day) && sTime === timeStr;
                                        }).sort((a, b) => parseISO(a.start_time) - parseISO(b.start_time));

                                        return (
                                            <div key={`${idx}-${dIdx}`} className="bg-white min-h-[100px] p-1 space-y-2">
                                                {cellSessions.map(session => (
                                                    <SessionBlock key={session.id} session={session} onClick={setSelectedSession} />
                                                ))}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))
                        )}
                    </div>
                </div>
            );
        }

        if (viewMode === "day") {
            const daySessionsCount = sessions.filter(s => isSameDay(parseISO(s.start_time), dateFrom)).length;

            return (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden min-h-[400px]">
                    <div className="bg-slate-50 py-3 px-4 border-b border-slate-200">
                        <div className="text-sm font-semibold text-slate-500 uppercase">
                            {format(dateFrom, "EEEE", { locale: vi })}
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {format(dateFrom, "dd MMMM yyyy", { locale: vi })}
                        </div>
                    </div>
                    <div className="p-4 max-w-3xl">
                        {daySessionsCount === 0 ? (
                            <div className="text-center text-slate-500 py-10">Không có lịch trong ngày này.</div>
                        ) : (
                            <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col divide-y divide-slate-200">
                                {/* BUỔI SÁNG */}
                                <div className="bg-slate-50/80 px-4 py-2 font-black text-rose-600 text-xs flex items-center gap-1.5 border-b border-slate-200">☀️ BUỔI SÁNG</div>
                                {sessions.filter(s => isSameDay(parseISO(s.start_time), dateFrom) && parseISO(s.start_time).getHours() < 12).length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-sm">Không có lịch học buổi sáng.</div>
                                ) : (
                                    morningSlots.map((timeStr, idx) => {
                                        const slotSessions = sessions.filter(s => {
                                            const sTime = `${format(parseISO(s.start_time), 'HH:mm')} - ${format(parseISO(s.end_time), 'HH:mm')}`;
                                            return isSameDay(parseISO(s.start_time), dateFrom) && sTime === timeStr;
                                        });
                                        if (slotSessions.length === 0) return null;
                                        return (
                                            <div key={idx} className="flex flex-col md:flex-row bg-white">
                                                <div className="w-full md:w-32 shrink-0 bg-slate-50/30 p-4 font-bold text-slate-700 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
                                                    <div className="text-sm">{timeStr}</div>
                                                </div>
                                                <div className="flex-1 p-4 space-y-3">
                                                    {slotSessions.map(session => (
                                                        <SessionBlock key={session.id} session={session} onClick={setSelectedSession} large />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {/* BUỔI CHIỀU */}
                                <div className="bg-slate-50/80 px-4 py-2 font-black text-amber-600 text-xs flex items-center gap-1.5 border-y border-slate-200">🌤️ BUỔI CHIỀU</div>
                                {sessions.filter(s => isSameDay(parseISO(s.start_time), dateFrom) && parseISO(s.start_time).getHours() >= 12).length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-sm">Không có lịch học buổi chiều.</div>
                                ) : (
                                    afternoonSlots.map((timeStr, idx) => {
                                        const slotSessions = sessions.filter(s => {
                                            const sTime = `${format(parseISO(s.start_time), 'HH:mm')} - ${format(parseISO(s.end_time), 'HH:mm')}`;
                                            return isSameDay(parseISO(s.start_time), dateFrom) && sTime === timeStr;
                                        });
                                        if (slotSessions.length === 0) return null;
                                        return (
                                            <div key={idx} className="flex flex-col md:flex-row bg-white">
                                                <div className="w-full md:w-32 shrink-0 bg-slate-50/30 p-4 font-bold text-slate-700 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
                                                    <div className="text-sm">{timeStr}</div>
                                                </div>
                                                <div className="flex-1 p-4 space-y-3">
                                                    {slotSessions.map(session => (
                                                        <SessionBlock key={session.id} session={session} onClick={setSelectedSession} large />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        if (viewMode === "month") {
            const grouped = sessions.reduce((acc, curr) => {
                const dateKey = format(parseISO(curr.start_time), 'yyyy-MM-dd');
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(curr);
                return acc;
            }, {});

            return (
                <div className="space-y-4 max-w-4xl">
                    {Object.keys(grouped).sort().map(dateKey => (
                        <Card key={dateKey}>
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-slate-800 flex gap-2 items-center">
                                <div className="bg-blue-100 text-blue-700 rounded-md px-2 py-1 text-sm">{format(parseISO(dateKey), "dd/MM")}</div>
                                {format(parseISO(dateKey), "EEEE", { locale: vi })}
                            </div>
                            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {grouped[dateKey].sort((a, b) => parseISO(a.start_time) - parseISO(b.start_time)).map(session => (
                                    <SessionBlock key={session.id} session={session} onClick={setSelectedSession} />
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            );
        }

        return null;
    };

    const pageActions = (
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsImportModalOpen(true)}>
                <Upload size={16} /> Nhập lịch học
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isLoading}>
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
                subtitle="Theo dõi lịch dạy theo từng giáo viên dưới dạng thời khóa biểu."
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
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Giáo viên</div>
                            <SearchableSelect
                                options={teachers}
                                value={selectedTeacherId}
                                onChange={setSelectedTeacherId}
                                placeholder={isLoadingMeta ? "Đang tải giáo viên..." : "Chọn giáo viên"}
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

                    <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_auto_auto]">
                        <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Phòng học</div>
                            <Input value={roomFilter} onChange={(event) => setRoomFilter(event.target.value)} placeholder="VD: P301" />
                        </div>
                        <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Từ ngày (Export)</div>
                            <Input type="date" value={dateStartFilter} onChange={(event) => setDateStartFilter(event.target.value)} />
                        </div>
                        <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Đến ngày (Export)</div>
                            <Input type="date" value={dateEndFilter} onChange={(event) => setDateEndFilter(event.target.value)} />
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
                            <div className="mt-2 text-xl font-black">{selectedTeacher?.full_name || "Chưa chọn giáo viên"}</div>
                            <div className="mt-1 text-sm text-slate-300">{selectedTeacher?.email || "Chọn một giáo viên để xem lịch."}</div>
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
                                <div>1. Chọn một giáo viên để xem lịch dạy.</div>
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
                                <div className="text-sm text-slate-500">Giáo viên</div>
                                <div className="font-semibold text-slate-900">{selectedSession.class?.teacher?.full_name || selectedSession.teacher?.full_name || selectedTeacher?.full_name || "Chưa phân công"}</div>
                            </div>
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
                        <label className="mb-1 block text-sm font-medium text-slate-700">Giáo viên</label>
                        <Input readOnly value={selectedTeacher?.full_name || "Chọn giáo viên trước"} className="cursor-not-allowed bg-slate-50 text-slate-500" />
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
