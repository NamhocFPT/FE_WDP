// src/component/pages/admin/ScheduleManagement.js
import React, { useMemo, useState, useEffect } from "react";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Badge, Input, Button, Modal, SearchableSelect } from "component/ui";
import { Calendar, Upload, Download, Plus } from "lucide-react";

export default function ScheduleManagement() {
    const [q, setQ] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
    }, [page, limit, groupBy, classIdFilter, courseCodeFilter]);


    // Action buttons for PageHeader
    const pageActions = (
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
                <Upload size={16} /> Import Schedule
            </Button>
            <Button variant="outline" className="gap-2">
                <Download size={16} /> Export Schedule
            </Button>
            <Button variant="primary" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={16} /> Add Session
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
            alert("Please fill in all required fields!");
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
                throw new Error(errorData.message || "Failed to create session");
            }

            alert("Session created successfully!");
            
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
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <PageHeader 
                title="Schedule Management" 
                subtitle="Manage class schedules and timetables"
                right={pageActions}
            />

            {/* Filter Controls */}
            <Card className="mb-4">
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex-1 w-full sm:w-1/3 border border-slate-200 rounded-lg bg-white relative">
                        {/* We use SearchableSelect if you have a class list or just Input. We'll use simple Input for now */}
                        <Input 
                            value={classIdFilter}
                            onChange={(e) => setClassIdFilter(e.target.value)}
                            placeholder="Filter by Class ID..."
                            className="border-none bg-transparent"
                        />
                    </div>
                    <div className="flex-1 w-full sm:w-1/3">
                        <Input 
                            value={courseCodeFilter}
                            onChange={(e) => setCourseCodeFilter(e.target.value)}
                            placeholder="Filter by Course Code (e.g. PRJ301)..."
                        />
                    </div>
                    <div className="w-full sm:w-1/4">
                        <select 
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="teacher">Group by Teacher</option>
                            <option value="date">Group by Date</option>
                            <option value="class">Group by Class</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {isLoadingSchedule ? (
                    <Card>
                        <CardContent className="text-center py-8 text-slate-500">
                            Loading schedule...
                        </CardContent>
                    </Card>
                ) : scheduleData.length > 0 ? (
                    scheduleData.map((group) => (
                        <Card key={group.key} className="overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-2">
                                <Calendar size={18} className="text-blue-600" />
                                <h3 className="font-semibold text-slate-800">
                                    {groupBy === "teacher" 
                                        ? group.teacher?.full_name || "Unknown Teacher" 
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
                                                        <div>{new Date(s.start_time).toLocaleDateString()}</div>
                                                        <div className="text-xs text-slate-400">
                                                            {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -  
                                                            {new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {s.class?.name} - {s.class?.course?.code}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        {s.topic || s.room} • {s.status}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {s.status === "cancelled" && <Badge tone="red">Cancelled</Badge>}
                                                {s.status === "scheduled" && <Badge tone="blue">Scheduled</Badge>}
                                                {s.status === "completed" && <Badge tone="green">Completed</Badge>}
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
                            No scheduled sessions found.
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
                        Previous
                    </Button>
                    <span className="text-sm text-slate-600">
                        Page {page} of {totalPages}
                    </span>
                    <Button 
                        variant="outline" 
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isLoadingSchedule}
                    >
                        Next
                    </Button>
                </div>
            )}

            <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Schedule Session">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                        <SearchableSelect 
                            options={classOptions}
                            value={selectedClassId}
                            onChange={setSelectedClassId}
                            placeholder="Search and select class..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
                        <Input 
                            readOnly 
                            className="bg-slate-50 text-slate-500 cursor-not-allowed"
                            value={selectedTeacher ? selectedTeacher.full_name : "Please select a class first"} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
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
                                Valid range: {displayDateLimits.min} to {displayDateLimits.max}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                            <Input 
                                type="time" 
                                value={startTime} 
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                            <Input 
                                type="time" 
                                value={endTime} 
                                onChange={(e) => setEndTime(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Room</label>
                        <Input 
                            placeholder="Room 301" 
                            value={room} 
                            onChange={(e) => setRoom(e.target.value)} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Note <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <textarea 
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 resize-none"
                            placeholder="e.g. Học bù" 
                            rows="2"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            className="bg-blue-600 hover:bg-blue-700" 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Save Session"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}