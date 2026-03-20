// src/component/pages/admin/ScheduleManagement.js
import React, { useMemo, useState, useEffect } from "react";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Badge, Input, Button, Modal, SearchableSelect } from "component/ui";
import { Calendar, Upload, Download, Plus } from "lucide-react";
import ImportScheduleModal from "./ImportScheduleModal";
import * as XLSX from "xlsx";

export default function ScheduleManagement() {
    const [q, setQ] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Filter items based on search query
    const [classOptions, setClassOptions] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState("");

    // Schedule List State
    const [scheduleData, setScheduleData] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [courseCodeFilter, setCourseCodeFilter] = useState("");
    const [classIdFilter, setClassIdFilter] = useState("");
    const [groupBy, setGroupBy] = useState("teacher");
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

    // Export Excel Filters
    const [semesterFilter, setSemesterFilter] = useState("");
    const [roomFilter, setRoomFilter] = useState("");
    const [fromFilter, setFromFilter] = useState("");
    const [toFilter, setToFilter] = useState("");

    // Fetch classes using useEffect
    useEffect(() => {
        if (isAddModalOpen && classOptions.length === 0) {
            fetch("http://localhost:9999/api/v1/admin/classes")
                .then(res => {
                    if (!res.ok) throw new Error("Network response was not ok");
                    return res.json();
                })
                .then(result => {
                    if (result.data) {
                        const options = result.data.map(cls => ({
                            value: cls.id,
                            label: `${cls.name}-${cls.course?.code || ''}`.replace(/-$/, ''),
                            teacher: cls.teacher,
                            startDate: cls.start_date,
                            endDate: cls.end_date
                        }));
                        setClassOptions(options);
                    }
                })
                .catch(err => console.error("Failed to fetch classes:", err));
        }
    }, [isAddModalOpen, classOptions.length]);

    // Fetch Schedule Data
    const fetchSchedules = async () => {
        setIsLoadingSchedule(true);
        try {
            const url = new URL("http://localhost:9999/api/v1/admin/class-sessions");
            url.searchParams.append("page", page);
            url.searchParams.append("limit", limit);
            url.searchParams.append("group_by", groupBy);
            if (classIdFilter) url.searchParams.append("class_id", classIdFilter);
            if (courseCodeFilter) url.searchParams.append("course_code", courseCodeFilter);
            if (semesterFilter) url.searchParams.append("semester", semesterFilter);
            if (roomFilter) url.searchParams.append("room", roomFilter);
            if (fromFilter) url.searchParams.append("from", fromFilter);
            if (toFilter) url.searchParams.append("to", toFilter);

            const res = await fetch(url.toString());
            if (!res.ok) throw new Error("Network response was not ok");
            const result = await res.json();
            
            setScheduleData(result.data || []);
            setTotalPages(result.meta?.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch schedules:", error);
            setScheduleData([]);
        } finally {
            setIsLoadingSchedule(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [page, limit, groupBy, classIdFilter, courseCodeFilter, semesterFilter, roomFilter, fromFilter, toFilter]);


    const handleExport = async () => {
        try {
            const url = new URL("http://localhost:9999/api/v1/admin/class-sessions");
            url.searchParams.append("all", "true");
            url.searchParams.append("group_by", groupBy);
            if (classIdFilter) url.searchParams.append("class_id", classIdFilter);
            if (courseCodeFilter) url.searchParams.append("course_code", courseCodeFilter);
            if (semesterFilter) url.searchParams.append("semester", semesterFilter);
            if (roomFilter) url.searchParams.append("room", roomFilter);
            if (fromFilter) url.searchParams.append("from", fromFilter);
            if (toFilter) url.searchParams.append("to", toFilter);

            const res = await fetch(url.toString());
            const result = await res.json();
            const items = result.data || [];

            if (items.length === 0) {
                alert("Không có dữ liệu lịch học khớp điều kiện lọc.");
                return;
            }

            let flatData = [];
            if (groupBy && items[0]?.sessions) {
                 items.forEach(g => { flatData = [...flatData, ...g.sessions]; });
            } else {
                 flatData = items;
            }

            const excelRows = flatData.map((s, index) => ({
                "STT": index + 1,
                "Lớp": s.class?.name || "",
                "Môn": s.class?.course?.code || "",
                "Ngày": new Date(s.start_time).toLocaleDateString("vi-VN"),
                "Giờ Bắt đầu": new Date(s.start_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
                "Giờ Kết thúc": new Date(s.end_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
                "Phòng": s.room || "",
                "Giảng viên": s.class?.teacher?.full_name || "",
                "Chủ đề": s.topic || ""
            }));

            const ws = XLSX.utils.json_to_sheet(excelRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "LichHoc");
            XLSX.writeFile(wb, `LichHoc_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error("Export Error:", error);
            alert("Lỗi xuất file Excel.");
        }
    };

    // Action buttons for PageHeader
    const pageActions = (
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsImportModalOpen(true)}>
                <Upload size={16} /> Nhập Lịch học
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download size={16} /> Xuất file Excel
            </Button>
            <Button variant="primary" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={16} /> Thêm Buổi học
            </Button>
        </div>
    );

    const selectedTeacher = useMemo(() => {
        if (!selectedClassId) return null;
        const cls = classOptions.find(c => c.value === selectedClassId);
        return cls?.teacher || null;
    }, [selectedClassId, classOptions]);

    const displayDateLimits = useMemo(() => {
        if (!selectedClassId) return { min: "", max: "" };
        const cls = classOptions.find(c => c.value === selectedClassId);
        return {
            min: cls?.startDate ? cls.startDate.split('T')[0] : "",
            max: cls?.endDate ? cls.endDate.split('T')[0] : ""
        };
    }, [selectedClassId, classOptions]);

    const [selectedDate, setSelectedDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [room, setRoom] = useState("");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedClassId || !selectedDate || !startTime || !endTime || !room) {
            alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
            return;
        }

        try {
            setIsSubmitting(true);
            const startDateTime = new Date(`${selectedDate}T${startTime}:00+07:00`).toISOString();
            const endDateTime = new Date(`${selectedDate}T${endTime}:00+07:00`).toISOString();

            const payload = {
                start_time: startDateTime,
                end_time: endDateTime,
                room: room,
                note: note || undefined
            };

            const response = await fetch(`http://localhost:9999/api/v1/admin/classes/${selectedClassId}/sessions/manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Không thể tạo buổi học");
            }

            alert("Tạo buổi học thành công!");
            
            // Reset form and close modal
            setIsAddModalOpen(false);
            setSelectedClassId("");
            setSelectedDate("");
            setStartTime("");
            setEndTime("");
            setRoom("");
            setNote("");
            
        } catch (error) {
            console.error("Error creating session:", error);
            alert(`Lỗi: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <PageHeader 
                title="Quản lý Lịch học" 
                subtitle="Quản lý thời khóa biểu và lịch trình các lớp học"
                right={pageActions}
            />

            {/* Filter Controls */}
            <Card className="mb-4">
                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex-1">
                            <Input 
                                value={classIdFilter}
                                onChange={(e) => setClassIdFilter(e.target.value)}
                                placeholder="Lọc theo mã Lớp học..."
                            />
                        </div>
                        <div className="flex-1">
                            <Input 
                                value={courseCodeFilter}
                                onChange={(e) => setCourseCodeFilter(e.target.value)}
                                placeholder="Lọc theo mã Khóa học..."
                            />
                        </div>
                        <div className="w-full sm:w-1/4">
                            <select 
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="teacher">Gom nhóm theo Giảng viên</option>
                                <option value="date">Gom nhóm theo Ngày</option>
                                <option value="class">Gom nhóm theo Lớp</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex-1">
                            <Input 
                                value={semesterFilter}
                                onChange={(e) => setSemesterFilter(e.target.value)}
                                placeholder="Học kỳ (VD: Spring 2026)..."
                            />
                        </div>
                        <div className="flex-1">
                            <Input 
                                value={roomFilter}
                                onChange={(e) => setRoomFilter(e.target.value)}
                                placeholder="Phòng (VD: P301)..."
                            />
                        </div>
                        <div className="flex-1">
                            <Input 
                                type="date"
                                value={fromFilter}
                                onChange={(e) => setFromFilter(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <Input 
                                type="date"
                                value={toFilter}
                                onChange={(e) => setToFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {isLoadingSchedule ? (
                    <Card>
                        <CardContent className="text-center py-8 text-slate-500">
                            Đang tải lịch học...
                        </CardContent>
                    </Card>
                ) : scheduleData.length > 0 ? (
                    scheduleData.map((group) => (
                        <Card key={group.key} className="overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-2">
                                <Calendar size={18} className="text-blue-600" />
                                <h3 className="font-semibold text-slate-800">
                                    {groupBy === "teacher" 
                                        ? group.teacher?.full_name || "Giảng viên chưa xác định" 
                                        : group.key}
                                </h3>
                            </div>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {group.sessions?.map((s) => (
                                        <div key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 transition-colors">
                                            <div className="flex gap-4">
                                                <div className="text-sm font-medium text-slate-500 min-w-[140px] flex items-center gap-1.5 flex-wrap">
                                                    <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">T</span>
                                                    <div>
                                                        <div>{new Date(s.start_time).toLocaleDateString("vi-VN")}</div>
                                                        <div className="text-xs text-slate-400">
                                                            {new Date(s.start_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} -  
                                                            {new Date(s.end_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        Lớp: {s.class?.name} - Môn: {s.class?.course?.code}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        Phòng: {s.room} {s.topic ? `• Chủ đề: ${s.topic}` : ""}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge tone={s.status === "cancelled" ? "red" : (s.status === "completed" ? "green" : "blue")}>
                                                    {s.status === "cancelled" ? "Đã hủy" : (s.status === "completed" ? "Hoàn thành" : "Đã lên lịch")}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="text-center py-8 text-slate-500">
                            Không tìm thấy dữ liệu lịch học.
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoadingSchedule}
                    >
                        Trang trước
                    </Button>
                    <span className="text-sm text-slate-600">
                        Trang {page} / {totalPages}
                    </span>
                    <Button 
                        variant="outline" 
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isLoadingSchedule}
                    >
                        Trang sau
                    </Button>
                </div>
            )}

            <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm buổi học mới">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Lớp học</label>
                        <SearchableSelect 
                            options={classOptions}
                            value={selectedClassId}
                            onChange={setSelectedClassId}
                            placeholder="Tìm kiếm và chọn lớp học..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Giảng viên</label>
                        <Input 
                            readOnly 
                            className="bg-slate-50 text-slate-500 cursor-not-allowed"
                            value={selectedTeacher ? selectedTeacher.full_name : "Vui lòng chọn lớp học trước"} 
                        />
                    </div>

                    {/* Day Selection (New for recurring) or just use the existing Date picker */}
                    {/* The existing code uses a specific date picker, which is fine for direct session creation */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ngày học</label>
                        <Input 
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={displayDateLimits.min}
                            max={displayDateLimits.max}
                            disabled={!selectedClassId}
                            className={!selectedClassId ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}
                        />
                        {selectedClassId && displayDateLimits.min && displayDateLimits.max ? (
                            <p className="mt-1 text-xs text-slate-500">
                                Phạm vi hợp lệ: {new Date(displayDateLimits.min).toLocaleDateString("vi-VN")} đến {new Date(displayDateLimits.max).toLocaleDateString("vi-VN")}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Giờ bắt đầu</label>
                            <Input 
                                type="time" 
                                value={startTime} 
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Giờ kết thúc</label>
                            <Input 
                                type="time" 
                                value={endTime} 
                                onChange={(e) => setEndTime(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phòng học</label>
                        <Input 
                            placeholder="Ví dụ: P301, DE201..." 
                            value={room} 
                            onChange={(e) => setRoom(e.target.value)} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Ghi chú <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                        </label>
                        <textarea 
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                            placeholder="Ví dụ: Học bù buổi ngày 10/10" 
                            rows="2"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
                            Hủy bỏ
                        </Button>
                        <Button 
                            variant="primary" 
                            className="bg-blue-600 hover:bg-blue-700" 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Đang lưu..." : "Lưu buổi học"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <ImportScheduleModal 
                isOpen={isImportModalOpen} 
                onClose={() => setIsImportModalOpen(false)} 
                onSuccess={fetchSchedules} 
            />
        </div>
    );
}