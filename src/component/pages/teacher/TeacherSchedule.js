import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    format,
    startOfWeek,
    endOfWeek,
    addDays,
    subDays,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    isSameDay,
    isSameMonth,
    parseISO,
    startOfDay,
    getDay
} from "date-fns";
import { vi } from "date-fns/locale";
import { PageHeader, Card, CardContent, Badge, Modal, Button, SearchableSelect, Input } from "component/ui";
import { get } from "utils/request";
import { api } from "service/api";
import { Clock, CheckCircle2, AlertTriangle, XCircle, Search, RefreshCcw, FileText, ImageIcon, LinkIcon, FileIcon as FileDoc, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CALENDAR_VIEWS = [
    { id: "day", label: "Ngày" },
    { id: "week", label: "Tuần" },
    { id: "month", label: "Tháng" },
];

function getStatusInfo(status) {
    switch (status) {
        case "upcoming":
            return {
                bg: "bg-[#E3F2FD]",
                border: "border-l-[4px] border-[#1976D2]",
                text: "text-slate-800",
                icon: null,
                label: "Sắp tới",
            };
        case "ongoing":
            return {
                bg: "bg-[#BBDEFB]",
                border: "border-l-[4px] border-[#1976D2] ring-1 ring-[#1976D2]/20",
                text: "text-blue-900 font-medium",
                icon: <Clock className="w-3 h-3 text-blue-600 animate-pulse inline-block mr-1" />,
                label: "Đang diễn ra",
            };
        case "completed":
            return {
                bg: "bg-[#E8F5E9]",
                border: "border-l-[4px] border-[#388E3C]",
                text: "text-slate-800",
                icon: <CheckCircle2 className="w-3 h-3 text-[#388E3C] inline-block mr-1" />,
                label: "Đã xong",
            };
        case "missing_attendance":
            return {
                bg: "bg-[#FFF3E0]",
                border: "border-l-[4px] border-[#F57C00]",
                text: "text-slate-800",
                icon: <AlertTriangle className="w-3 h-3 text-[#F57C00] inline-block mr-1" />,
                label: "Chưa điểm danh",
            };
        case "cancelled":
            return {
                bg: "bg-[#F5F5F5]",
                border: "border-l-[4px] border-slate-400",
                text: "text-slate-500 line-through opacity-70",
                icon: <XCircle className="w-3 h-3 text-slate-500 inline-block mr-1" />,
                label: "Đã hủy",
            };
        default:
            return {
                bg: "bg-white",
                border: "border-l-[4px] border-slate-200",
                text: "text-slate-700",
                icon: null,
                label: "Không rõ",
            };
    }
}

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

// Fallback mock data in case API fails
const MOCK_SESSIONS = [
    {
        id: "s1",
        start_time: "2026-03-10T07:30:00",
        end_time: "2026-03-10T09:00:00",
        class: { name: "SE1886" },
        course: { code: "CSD201" },
        room: "Phòng 202, Tòa A",
        display_status: "upcoming",
        is_cancelled: false,
        attendance_summary: { total: 30, present: 28, absent: 1, late: 1, excused: 0, not_taken: false },
        students: [
            { id: 1, name: "Nguyễn Văn A", attendance: { status: "present", note: "" } },
            { id: 2, name: "Trần Thị B", attendance: { status: "absent", note: "Nghỉ ốm" } },
            { id: 3, name: "Lê Văn C", attendance: { status: "late", note: "Trễ 10p" } },
            { id: 4, name: "Phạm D", attendance: null },
        ],
        materials: [{ title: "Chương 5 - Linked List", type: "pdf", file_url: "#" }],
    },
    {
        id: "s2",
        start_time: "2026-03-11T13:00:00",
        end_time: "2026-03-11T14:30:00",
        class: { name: "SE1886" },
        course: { code: "PRJ301" },
        room: "Phòng 305, Tòa A",
        display_status: "ongoing",
        is_cancelled: false,
        attendance_summary: { not_taken: true },
        students: [],
        materials: [],
    },
    {
        id: "s3",
        start_time: "2026-03-12T07:30:00",
        end_time: "2026-03-12T09:00:00",
        class: { name: "SE1889" },
        course: { code: "SWP391" },
        room: "Phòng 401, Tòa B",
        display_status: "completed",
        is_cancelled: false,
        attendance_summary: { total: 30, present: 30, absent: 0, late: 0, excused: 0, not_taken: false },
        students: [],
        materials: [],
    },
    {
        id: "s4",
        start_time: "2026-03-13T09:15:00",
        end_time: "2026-03-13T10:45:00",
        class: { name: "SA1234" },
        course: { code: "MAE101" },
        room: "Phòng 102, Tòa C",
        display_status: "missing_attendance",
        is_cancelled: false,
        attendance_summary: { not_taken: true },
        students: [],
        materials: [],
    },
    {
        id: "s5",
        start_time: "2026-03-14T13:00:00",
        end_time: "2026-03-14T14:30:00",
        class: { name: "SA1234" },
        course: { code: "MAE101" },
        room: "Phòng 102, Tòa C",
        display_status: "cancelled",
        is_cancelled: true,
        cancelled_at: "2026-03-08T10:00:00",
        cancelled_reason: "Nghỉ lễ",
        attendance_summary: { not_taken: true },
        students: [],
        materials: [],
    },
];

export default function TeacherSchedule() {
    const [viewMode, setViewMode] = useState("week"); // day | week | month
    const [currentDate, setCurrentDate] = useState(new Date()); // Fetch based on today
    
    const [classes, setClasses] = useState([{ label: "Tất cả lớp", value: "" }]);
    const [selectedClassId, setSelectedClassId] = useState("");
    
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [selectedSession, setSelectedSession] = useState(null);
    const [cancelledSession, setCancelledSession] = useState(null); // For Cancelled Popup
    const [detailTab, setDetailTab] = useState("attendance"); // attendance | documents

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadMode, setUploadMode] = useState("file"); // file | link
    const [selectedFile, setSelectedFile] = useState(null);
    const [linkUrl, setLinkUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

    // Derived Date Range
    const { dateFrom, dateTo } = useMemo(() => {
        let from, to;
        switch (viewMode) {
            case "day":
                from = startOfDay(currentDate);
                to = startOfDay(currentDate);
                break;
            case "week":
                from = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
                to = endOfWeek(currentDate, { weekStartsOn: 1 });
                break;
            case "month":
                from = startOfMonth(currentDate);
                to = endOfMonth(currentDate);
                break;
            default:
                from = new Date();
                to = new Date();
        }
        return { dateFrom: from, dateTo: to };
    }, [currentDate, viewMode]);

    const headerDateText = useMemo(() => {
        if (viewMode === "day") {
            return format(currentDate, "dd/MM/yyyy (EEEE)", { locale: vi });
        } else if (viewMode === "week") {
            return `${format(dateFrom, "dd/MM")} - ${format(dateTo, "dd/MM/yyyy", { locale: vi })}`;
        } else if (viewMode === "month") {
            return `Tháng ${format(currentDate, "MM/yyyy", { locale: vi })}`;
        }
        return "";
    }, [currentDate, viewMode, dateFrom, dateTo]);

    // Fetch Data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Uncomment the real API calls when backend is ready
            const [classesRes, scheduleRes] = await Promise.all([
                get("api/teacher/schedule/classes"),
                get(`api/teacher/schedule?from=${format(dateFrom, 'yyyy-MM-dd')}&to=${format(dateTo, 'yyyy-MM-dd')}${selectedClassId ? `&class_id=${selectedClassId}` : ''}`)
            ]);
            
            // Backend trả về dạng { message: "OK", data: [...] }
            // Utils request "get" trả thẳng object này. Vậy class list nằm ở classesRes.data 
            // và schedule nằm ở scheduleRes.data
            
            const classesData = classesRes.data || [];
            const mappedClasses = classesData.map(c => ({ 
                label: c.class_name || c.name || c.class_id, 
                value: c.class_id || c.id 
            }));
            
            setClasses([{label: "Tất cả lớp", value: ""}, ...mappedClasses]);
            
            // Adjust data mapping for the schedule blocks
            const apiSessions = scheduleRes.data || [];
            
            // Filter sessions inside current view range to avoid spilling (just in case API returns loose dates)
            const filteredApiSessions = apiSessions.filter(s => {
                const d = parseISO(s.start_time);
                if (viewMode === "day") return isSameDay(d, currentDate);
                if (viewMode === "week") return d >= dateFrom && d <= dateTo;
                if (viewMode === "month") return isSameMonth(d, currentDate);
                return true;
            });
            
            setSessions(filteredApiSessions);
            setIsLoading(false);
            
        } catch (error) {
            console.error("Failed to fetch schedule data", error);
            setIsLoading(false);
        }
    }, [dateFrom, dateTo, selectedClassId, viewMode, currentDate]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFrom, dateTo, selectedClassId]);

    // Navigation Handlers
    const handlePrev = () => {
        if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));
        else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
        else if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNext = () => {
        if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));
        else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
        else if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleSlotClick = async (sessionParam) => {
        try {
            const res = await get(`api/teacher/schedule/${sessionParam.id}`);
            // Backend trả về { message: "OK", data: { ... session detail ... } }
            const sessionData = res.data;

            if (sessionData && sessionData.is_cancelled) {
                setCancelledSession(sessionData);
            } else {
                setSelectedSession(sessionData);
                setDetailTab("attendance"); // reset tab
                // Tự động load tài liệu luôn cho session này
                fetchSessionMaterials(sessionData);
            }
        } catch (error) {
            console.error("Failed to fetch session detail", error);
        }
    };

    const fetchSessionMaterials = async (sessionData) => {
        if (!sessionData) return;
        const classId = sessionData.class?.id || sessionData.class_id;
        if (!classId) return;

        setIsLoadingMaterials(true);
        try {
            const res = await api.get(`/teacher/classes/${classId}/materials`);
            if (res.ok && res.data?.data) {
                const data = res.data.data;
                const generalMaterials = data.general || [];
                
                // Tìm session materials khớp với session_id hiện tại
                const matchingSessionGroup = (data.by_session || []).find(
                    group => group.session?.id === sessionData.id
                );
                const sessionMaterials = matchingSessionGroup?.materials || [];

                setSelectedSession(prev => ({
                    ...prev,
                    generalMaterials,
                    sessionMaterials,
                    materialsCount: generalMaterials.length + sessionMaterials.length
                }));
            }
        } catch (error) {
            console.error("Failed to fetch materials", error);
        } finally {
            setIsLoadingMaterials(false);
        }
    };

    // Upload Handlers
    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
        setUploadMode("file");
        setSelectedFile(null);
        setLinkUrl("");
        setTitle("");
        setDescription("");
    };

    const handleUpload = async () => {
        if (!selectedSession) return;
        const classId = selectedSession.class.id || selectedSession.class_id;
        
        if (uploadMode === "file") {
            if (!selectedFile) return toast.error("Vui lòng chọn file");
            
            const formData = new FormData();
            formData.append("file", selectedFile);
            if (title.trim()) formData.append("title", title.trim());
            if (description.trim()) formData.append("description", description.trim());
            formData.append("session_id", selectedSession.id); // Ép buộc chỉ upload cho session này

            try {
                setIsUploading(true);
                const res = await api.post(`/teacher/classes/${classId}/materials`, formData);
                if (res.ok) {
                    toast.success("Tải lên tài liệu thành công!");
                    closeUploadModal();
                    // Refetch materials
                    fetchSessionMaterials(selectedSession); 
                } else {
                    toast.error(res.data?.message || "Tải lên thất bại");
                }
            } catch (error) {
                toast.error("Đã xảy ra lỗi khi tải lên. Vui lòng thử lại.");
            } finally {
                setIsUploading(false);
            }
            
        } else {
            if (!linkUrl.trim()) return toast.error("Vui lòng nhập đường dẫn URL");
            if (!title.trim()) return toast.error("Vui lòng nhập tên tài liệu");

            try {
                setIsUploading(true);
                const res = await api.post(`/teacher/classes/${classId}/materials`, {
                    title: title.trim(),
                    url: linkUrl.trim(),
                    description: description?.trim() || null,
                    session_id: selectedSession.id
                });
                
                if (res.ok) {
                    toast.success("Thêm liên kết thành công!");
                    closeUploadModal();
                    fetchSessionMaterials(selectedSession);
                } else {
                    toast.error(res.data?.message || "Thêm liên kết thất bại");
                }
            } catch (error) {
                toast.error("Đã xảy ra lỗi khi tải lên. Vui lòng thử lại.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    // Rendering Helpers
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
                        Không có lịch giảng dạy trong khoảng<br/>thời gian này.
                    </div>
                </div>
            );
        }

        if (viewMode === "week") {
            const days = [];
            for (let i = 0; i < 7; i++) {
                days.push(addDays(dateFrom, i));
            }

            return (
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                    <div className="min-w-[800px] grid grid-cols-[80px_repeat(7,1fr)] bg-slate-200 gap-px">
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
                        {FPT_SLOTS.map(slot => (
                            <React.Fragment key={slot.id}>
                                {/* Slot Label Cell */}
                                <div className="bg-slate-50 flex flex-col justify-center items-center py-4 px-2 text-center pointer-events-none">
                                    <span className="text-sm font-semibold text-slate-700">{slot.name}</span>
                                </div>
                                
                                {/* Slot Cells for Each Day */}
                                {days.map((day, dIdx) => {
                                    const cellSessions = sessions.filter(s => {
                                        return isSameDay(parseISO(s.start_time), day) && getSlotFromTime(s.start_time) === slot.id;
                                    }).sort((a,b) => parseISO(a.start_time) - parseISO(b.start_time));
                                    
                                    return (
                                        <div key={`${slot.id}-${dIdx}`} className="bg-white min-h-[100px] p-1 space-y-2">
                                            {cellSessions.map(session => (
                                                <SessionBlock key={session.id} session={session} onClick={() => handleSlotClick(session)} />
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
                                {FPT_SLOTS.map(slot => {
                                    const slotSessions = sessions.filter(s => {
                                        return isSameDay(parseISO(s.start_time), dateFrom) && getSlotFromTime(s.start_time) === slot.id;
                                    }).sort((a,b) => parseISO(a.start_time) - parseISO(b.start_time));
                                    
                                    if (slotSessions.length === 0) return null;

                                    return (
                                        <div key={slot.id} className="flex flex-col md:flex-row bg-white">
                                            <div className="w-full md:w-32 shrink-0 bg-slate-50 p-4 font-semibold text-slate-700 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
                                                {slot.name}
                                            </div>
                                            <div className="flex-1 p-4 space-y-3">
                                                {slotSessions.map(session => (
                                                    <SessionBlock key={session.id} session={session} onClick={() => handleSlotClick(session)} large />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        if (viewMode === "month") {
            // A simple list grouped by date for month view
            const grouped = sessions.reduce((acc, curr) => {
                const dateKey = format(parseISO(curr.start_time), 'yyyy-MM-dd');
                if(!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(curr);
                return acc;
            }, {});

            return (
                <div className="space-y-4 max-w-4xl">
                    {Object.keys(grouped).sort().map(dateKey => (
                        <Card key={dateKey}>
                             <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-slate-800 flex gap-2 items-center">
                                 <div className="bg-blue-100 text-blue-700 rounded-md px-2 py-1 text-sm">{format(parseISO(dateKey), "dd/MM")}</div>
                                 {format(parseISO(dateKey), "EEEE", {locale: vi})}
                             </div>
                             <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {grouped[dateKey].sort((a,b) => parseISO(a.start_time) - parseISO(b.start_time)).map(session => (
                                      <SessionBlock key={session.id} session={session} onClick={() => handleSlotClick(session)} />
                                  ))}
                             </div>
                        </Card>
                    ))}
                </div>
            )
        }

        return null;
    };

    const getMaterialIconInfo = (type) => {
        const typeStr = (type || "").toLowerCase();
        if (typeStr.includes('pdf')) {
            return { icon: <FileText size={20} />, bg: 'bg-red-50 text-red-600', border: 'border-red-100', label: 'PDF' };
        }
        if (typeStr.includes('word') || typeStr.includes('doc')) {
            return { icon: <FileDoc size={20} />, bg: 'bg-blue-50 text-blue-600', border: 'border-blue-100', label: 'DOC' };
        }
        if (typeStr.includes('excel') || typeStr.includes('sheet') || typeStr.includes('xls')) {
            return { icon: <FileDoc size={20} />, bg: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100', label: 'SPREADSHEET' };
        }
        if (typeStr.includes('powerpoint') || typeStr.includes('ppt')) {
            return { icon: <FileDoc size={20} />, bg: 'bg-orange-50 text-orange-600', border: 'border-orange-100', label: 'PRESENTATION' };
        }
        if (typeStr.includes('image') || typeStr.includes('jpg') || typeStr.includes('png')) {
            return { icon: <ImageIcon size={20} />, bg: 'bg-purple-50 text-purple-600', border: 'border-purple-100', label: 'IMAGE' };
        }
        if (typeStr.includes('link') || typeStr.includes('url')) {
            return { icon: <LinkIcon size={20} />, bg: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100', label: 'LINK' };
        }
        return { icon: <FileText size={20} />, bg: 'bg-slate-50 text-slate-600', border: 'border-slate-200', label: 'FILE' };
    };

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            <PageHeader title="Lịch giảng dạy" subtitle="Quản lý lịch dạy và điểm danh, tài liệu học tập" />

            <Card className="rounded-xl overflow-visible shadow-sm">
                <div className="px-4 py-3 border-b border-slate-200 bg-white rounded-t-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Filter */}
                    <div className="w-full md:w-64">
                         <SearchableSelect 
                            options={classes} 
                            value={selectedClassId} 
                            onChange={(val) => setSelectedClassId(val)}
                            placeholder="Lọc theo lớp..."
                         />
                    </div>

                    {/* Center: Navigation */}
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" className="px-3" onClick={handlePrev}>◀</Button>
                        <div className="font-semibold text-slate-800 min-w-[180px] text-center capitalize">
                            {headerDateText}
                        </div>
                         <Button variant="outline" className="px-3" onClick={handleNext}>▶</Button>
                         <Button variant="outline" onClick={handleToday} className="ml-2">Hôm nay</Button>
                    </div>

                    {/* Right: View Mode Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {CALENDAR_VIEWS.map((mode) => (
                            <button
                                key={mode.id}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                    viewMode === mode.id
                                        ? "bg-white shadow-sm text-slate-900"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                                onClick={() => setViewMode(mode.id)}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 min-h-[400px]">
                    {renderCalendarGrid()}
                </div>
            </Card>

            {/* Modal: Class Detail */}
            <Modal open={!!selectedSession} title="Chi tiết buổi học" onClose={() => setSelectedSession(null)}>
                {selectedSession && (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
                            <div>
                                <div className="text-sm text-slate-500">Lớp học</div>
                                <div className="font-semibold text-slate-900">
                                    🏫 {selectedSession.class.name}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">Môn học</div>
                                <div className="font-semibold text-slate-900">
                                    📚 {selectedSession.course.code}
                                </div>
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                                 <Clock className="w-4 h-4 text-slate-400" />
                                 <span className="font-medium text-slate-800">
                                     {format(parseISO(selectedSession.start_time), 'HH:mm')} - {format(parseISO(selectedSession.end_time), 'HH:mm')}
                                 </span>
                                 <span className="text-slate-400">|</span>
                                 <span className="text-slate-600">📍 {selectedSession.room}</span>
                                 {selectedSession.display_status === 'ongoing' && (
                                     <Badge tone="blue" className="ml-auto animate-pulse">Đang diễn ra</Badge>
                                 )}
                            </div>
                        </div>

                         {/* Tabs for details */}
                         <div className="border-b border-slate-200">
                            <nav className="-mb-px flex gap-6" aria-label="Tabs">
                                <button
                                    onClick={() => setDetailTab("attendance")}
                                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        detailTab === "attendance"
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                    }`}
                                >
                                    👥 Sinh viên & Điểm danh
                                </button>
                                <button
                                    onClick={() => setDetailTab("documents")}
                                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        detailTab === "documents"
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                    }`}
                                >
                                    📎 Tài liệu ({selectedSession.materialsCount || 0})
                                </button>
                            </nav>
                        </div>

                        {/* Attendance Tab */}
                        {detailTab === "attendance" && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200 text-sm">
                                    <div className="font-medium text-slate-700">
                                        Tổng: {selectedSession.attendance_summary?.total || 0}
                                    </div>
                                    <div className="flex gap-3 text-slate-600">
                                        <span className="text-emerald-600 font-medium">✓ {selectedSession.attendance_summary?.present || 0}</span>
                                        <span className="text-red-600 font-medium">✕ {selectedSession.attendance_summary?.absent || 0}</span>
                                        <span className="text-amber-600 font-medium">⏰ {selectedSession.attendance_summary?.late || 0}</span>
                                    </div>
                                </div>
                                
                                {selectedSession.attendance_summary?.not_taken && (
                                    <div className="bg-orange-50 text-orange-800 p-3 rounded-lg border border-orange-200 text-sm flex items-center justify-between">
                                        <span>Buổi học này chưa được điểm danh.</span>
                                        <Button variant="primary" className="bg-orange-600 hover:bg-orange-700">Điểm danh ngay</Button>
                                    </div>
                                )}

                                {selectedSession.students && selectedSession.students.length > 0 && (
                                     <div className="max-h-[250px] overflow-auto border border-slate-200 rounded-lg">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-3 py-2">#</th>
                                                    <th className="px-3 py-2">Họ tên</th>
                                                    <th className="px-3 py-2">Trạng thái</th>
                                                    <th className="px-3 py-2 w-1/3">Ghi chú</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedSession.students.map((student, idx) => (
                                                    <tr key={student.id} className="hover:bg-slate-50">
                                                        <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                                                        <td className="px-3 py-2 font-medium text-slate-900">{student.name}</td>
                                                        <td className="px-3 py-2">
                                                            {!student.attendance ? (
                                                                <span className="text-slate-400">—</span>
                                                            ) : student.attendance.status === "present" ? (
                                                                <span className="text-emerald-600 font-medium">✓ Có mặt</span>
                                                            ) : student.attendance.status === "absent" ? (
                                                                <span className="text-red-600 font-medium">✕ Vắng mặt</span>
                                                            ) : (
                                                                <span className="text-amber-600 font-medium">⏰ Muộn</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-500 truncate max-w-[120px]" title={student.attendance?.note}>
                                                            {student.attendance?.note || ''}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                     </div>
                                )}
                            </div>
                        )}

                        {/* Documents Tab */}
                        {detailTab === "documents" && (
                            <div className="space-y-6">
                                {isLoadingMaterials ? (
                                    <div className="flex h-32 items-center justify-center text-slate-500">
                                        <RefreshCcw className="h-5 w-5 animate-spin mr-2" /> Đang tải tài liệu...
                                    </div>
                                ) : (
                                    <>
                                        {/* Session Materials */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-semibold text-slate-800 text-sm">Tài liệu buổi học này</h3>
                                        <Button size="sm" variant="outline" onClick={() => setIsUploadModalOpen(true)} className="gap-2">
                                            <Upload size={14} /> Tải lên
                                        </Button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {selectedSession.sessionMaterials && selectedSession.sessionMaterials.length > 0 ? (
                                            selectedSession.sessionMaterials.map((mat, i) => {
                                                const iconInfo = getMaterialIconInfo(mat.file_type || mat.type);
                                                return (
                                                <a href={mat.file_url || mat.url} target="_blank" rel="noreferrer" key={i} className={`flex items-center justify-between p-3 bg-white border ${iconInfo.border} hover:border-slate-300 hover:shadow-sm rounded-xl transition-all group`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-lg ${iconInfo.bg} flex flex-col items-center justify-center font-bold text-[10px] uppercase gap-1 shrink-0`}>
                                                            {iconInfo.label}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{mat.title}</div>
                                                            {mat.description && <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{mat.description}</div>}
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Mở</Button>
                                                </a>
                                            )})
                                        ) : (
                                            <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-sm">
                                                Chưa có tài liệu riêng cho buổi học này.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* General Materials */}
                                {selectedSession.generalMaterials && selectedSession.generalMaterials.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-slate-800 text-sm mb-3 pt-4 border-t border-slate-100">Tài liệu chung của lớp</h3>
                                        <div className="space-y-2">
                                            {selectedSession.generalMaterials.map((mat, i) => {
                                                const iconInfo = getMaterialIconInfo(mat.file_type || mat.type);
                                                return (
                                                <a href={mat.file_url || mat.url} target="_blank" rel="noreferrer" key={i} className={`flex items-center justify-between p-3 bg-slate-50/50 border ${iconInfo.border} hover:bg-white hover:border-slate-300 hover:shadow-sm rounded-xl transition-all group`}>
                                                    <div className="flex items-center gap-4 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <div className={`w-10 h-10 rounded-lg ${iconInfo.bg} flex flex-col items-center justify-center font-bold text-[9px] uppercase gap-1 shrink-0`}>
                                                            {iconInfo.label}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">{mat.title}</div>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Mở</Button>
                                                </a>
                                            )})}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Upload File Modal */}
            <Modal open={isUploadModalOpen} title="Tải lên tài liệu buổi học" onClose={closeUploadModal} size="md">
                <div className="space-y-4">
                    {/* Upload Mode Selector */}
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                        <button 
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${uploadMode === "file" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
                            onClick={() => setUploadMode("file")}
                        >
                            File từ máy tính
                        </button>
                        <button 
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${uploadMode === "link" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
                            onClick={() => setUploadMode("link")}
                        >
                            Link chia sẻ (URL)
                        </button>
                    </div>

                    {uploadMode === "file" ? (
                        <>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Tên tài liệu (Không bắt buộc)</label>
                                <Input placeholder="Nhập tên hiển thị thay thế..." value={title} onChange={e => setTitle(e.target.value)} />
                                <div className="text-xs text-slate-500">Nếu để trống, tên file sẽ được dùng làm tiêu đề.</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">File tài liệu <span className="text-red-500">*</span></label>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        id="file-upload" 
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setSelectedFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                        {selectedFile ? (
                                            <>
                                                <FileDoc className="w-10 h-10 text-blue-500 mb-2" />
                                                <span className="font-medium text-slate-800 truncate max-w-[250px]">{selectedFile.name}</span>
                                                <span className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                                                <span className="font-medium text-blue-600 mb-1">Bấm để chọn file</span>
                                                <span className="text-xs text-slate-500">Hỗ trợ PDF, DOCX, XLSX, PPTX, JPG (Tối đa 100MB)</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Tiêu đề liên kết <span className="text-red-500">*</span></label>
                                <Input placeholder="Ví dụ: Video bài giảng Youtube" value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Đường dẫn URL <span className="text-red-500">*</span></label>
                                <Input placeholder="https://..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Mô tả thêm (Không bắt buộc)</label>
                        <textarea 
                            className="w-full rounded-lg border border-slate-200 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[80px]"
                            placeholder="Ghi chú về tài liệu này..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm mb-4 border border-blue-100">
                        <span className="font-medium">Lưu ý:</span> Tài liệu này sẽ chỉ được gắn vào buổi học hiện tại thay vì toàn bộ khóa học.
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={closeUploadModal}>Thoát</Button>
                        <Button 
                            variant="primary" 
                            onClick={handleUpload}
                            disabled={isUploading || (uploadMode === "file" && !selectedFile) || (uploadMode === "link" && (!linkUrl.trim() || !title.trim()))}
                        >
                            {isUploading ? (
                                <><RefreshCcw className="w-4 h-4 animate-spin mr-2 inline" /> Đang xử lý...</>
                            ) : "Xác nhận tải lên"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Cancelled Exception */}
            <Modal open={!!cancelledSession} title="⚠️ Buổi học đã bị hủy" onClose={() => setCancelledSession(null)}>
                {cancelledSession && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 text-sm leading-relaxed">
                            Buổi học <strong>{cancelledSession.class.name}</strong> - <strong>{cancelledSession.course.code}</strong> đã bị hủy bởi Quản trị viên vào ngày <strong>{format(parseISO(cancelledSession.cancelled_at), 'dd/MM/yyyy')}</strong>.
                            <br/><br/>
                            Lý do: <span className="text-red-600 font-medium">{cancelledSession.cancelled_reason || "Không có lý do cụ thể"}</span>
                            <br/><br/>
                            <em className="text-slate-500">Bạn không thể thao tác trên buổi học này.</em>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button variant="primary" onClick={() => setCancelledSession(null)}>Đã hiểu</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

// Sub-component for a single calendar block
function SessionBlock({ session, onClick, large = false }) {
    const styleInfo = getStatusInfo(session.display_status);
    
    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-md p-2 hover:brightness-95 transition-all outline-none focus:ring-2 focus:ring-blue-400 ${styleInfo.bg} ${styleInfo.border}`}
        >
            <div className={`text-xs font-semibold ${styleInfo.text} flex items-center gap-1`}>
                 {styleInfo.icon}
                 {format(parseISO(session.start_time), 'HH:mm')} - {format(parseISO(session.end_time), 'HH:mm')}
            </div>
            <div className={`font-bold text-slate-900 mt-1 truncate ${large ? 'text-lg' : 'text-sm'}`}>
                {session.class.name} <span className="text-slate-500 font-normal">| {session.course.code}</span>
            </div>
            <div className={`text-slate-600 mt-0.5 truncate ${large ? 'text-sm' : 'text-xs'}`}>
                 📍 {session.room}
            </div>
            {large && session.display_status === 'missing_attendance' && (
                <div className="mt-2 inline-flex items-center text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">
                    Cần điểm danh
                </div>
            )}
        </button>
    );
}