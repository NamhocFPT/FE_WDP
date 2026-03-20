import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "service/studentApi";
import { PageHeader } from "component/ui";
import { 
    startOfWeek, endOfWeek, 
    startOfMonth, endOfMonth, 
    eachDayOfInterval, addDays, subDays, 
    addMonths, subMonths, 
    format, isSameDay, isSameMonth 
} from "date-fns";
import { vi } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";

export default function MySchedule() {
    const nav = useNavigate();
    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // States for Calendar control
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState("week"); // week / month

    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoading(true);
            try {
                const res = await studentApi.getMyClasses();
                if (res.data?.success) {
                    setClasses(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch classes:", err);
                setError("Could not load your classes.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchClasses();
    }, []);

    // Nav Helpers
    const handlePrev = () => {
        if (viewMode === 'week') setCurrentDate(subDays(currentDate, 7));
        else setCurrentDate(subMonths(currentDate, 1));
    };
    const handleNext = () => {
        if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
        else setCurrentDate(addMonths(currentDate, 1));
    };
    const handleToday = () => setCurrentDate(new Date());

    // Core Calendar Logic
    const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    
    // 1. Week dates
    const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(monday, i));

    // 2. Month dates calculation
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const monthDates = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const getSlotFromTime = (timeStr) => {
        if (!timeStr) return 1;
        const [start] = timeStr.split('-').map(t => t.trim());
        const [hours] = start.split(':').map(Number);
        
        if (hours < 9) return 1;
        if (hours < 12) return 2;
        if (hours < 15) return 3;
        if (hours < 18) return 4;
        return 5;
    };

    const getSessionForSlotWeek = (slotNum, targetDate) => {
        const found = [];
        classes.forEach(c => {
            (c.schedule || []).forEach(s => {
                if (s.rawDate && isSameDay(new Date(s.rawDate), targetDate) && getSlotFromTime(s.time) === slotNum) {
                    found.push({ ...s, className: c.name, classId: c.id });
                }
            });
        });
        return found[0] || null;
    };

    const getSessionsForDate = (targetDate) => {
        const list = [];
        classes.forEach(c => {
            (c.schedule || []).forEach(s => {
                if (s.rawDate && isSameDay(new Date(s.rawDate), targetDate)) {
                    list.push({ ...s, className: c.name, classId: c.id });
                }
            });
        });
        return list.sort((a,b) => String(a.time).localeCompare(String(b.time)));
    };

    return (
        <div className="space-y-6">
            {/* TOOLBAR NAV BAR */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4 border-slate-100">
                <PageHeader 
                    title="Lịch học của tôi" 
                    subtitle={viewMode === 'week' ? `Tuần: ${format(weekDates[0], 'dd/MM')} - ${format(weekDates[6], 'dd/MM')}` : `Tháng ${format(currentDate, 'MM/yyyy')}`} 
                />
                
                <div className="flex items-center gap-3">
                    {/* Prev/Next Buttons */}
                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5 shadow-inner-sm">
                        <button onClick={handlePrev} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 font-bold">◀</button>
                        <button onClick={handleToday} className="px-3 py-1.5 hover:bg-white rounded-lg transition-all text-xs font-bold text-slate-700">Hôm nay</button>
                        <button onClick={handleNext} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 font-bold">▶</button>
                    </div>

                    {/* View Switch */}
                    <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner-sm">
                        <button 
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} 
                            onClick={() => setViewMode('week')}
                        >
                            Tuần
                        </button>
                        <button 
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} 
                            onClick={() => setViewMode('month')}
                        >
                            Tháng
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center p-10 text-slate-500 animate-pulse">Đang tải lịch học...</div>
            ) : error ? (
                <div className="text-center p-10 bg-red-50 text-red-500 rounded-xl">{error}</div>
            ) : viewMode === 'week' ? (
                /* ---------------- WEEK VIEW ---------------- */
                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-8 divide-x divide-y divide-slate-100 min-w-[1000px]">
                        <div className="bg-slate-50/50 p-4"></div>
                        {weekDates.map((date, idx) => (
                            <div key={idx} className="bg-slate-50/50 p-3 text-center flex flex-col justify-center border-t border-slate-200">
                                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{format(date, 'EEEE', { locale: vi })}</div>
                                <div className="text-base font-black text-slate-800 mt-0.5">{format(date, 'dd/MM')}</div>
                            </div>
                        ))}

                        {[1, 2, 3, 4, 5].map(slot => (
                            <React.Fragment key={slot}>
                                <div className="p-4 flex items-center justify-center bg-slate-50/30 font-extrabold text-slate-700 text-sm">Slot {slot}</div>
                                {weekDates.map((date, idx) => {
                                    const s = getSessionForSlotWeek(slot, date);
                                    return (
                                        <div key={idx} className="p-2.5 min-h-[110px] flex items-stretch">
                                            {s ? (
                                                <div 
                                                    onClick={() => nav(`/student/classes/${s.classId}`)}
                                                    className="bg-amber-50/40 p-2.5 rounded-lg border-l-4 border-l-amber-500 border border-amber-100 shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col w-full"
                                                >
                                                    <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold">
                                                        <AlertTriangle className="h-3 w-3 text-amber-500" /> {s.time}
                                                    </div>
                                                    <div className="text-xs font-black text-slate-800 mt-1.5 line-clamp-2 leading-tight">{s.className}</div>
                                                    <div className="text-[10px] text-slate-500 font-bold mt-2 bg-white/80 px-1.5 py-0.5 rounded-md self-start border border-amber-100/50">📍 P.{s.room}</div>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            ) : (
                /* ---------------- MONTH VIEW ---------------- */
                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-w-[750px]">
                        {DAYS.map(day => (
                            <div key={day} className="bg-slate-50/50 p-2.5 text-center font-bold text-xs text-slate-600 border-t border-slate-100">
                                {day}
                            </div>
                        ))}
                        {monthDates.map((date, idx) => {
                            const sessions = getSessionsForDate(date);
                            const isCurrentMonth = isSameMonth(date, currentDate);
                            const isToday = isSameDay(date, new Date());

                            return (
                                <div 
                                    key={idx} 
                                    className={`p-1.5 min-h-[100px] flex flex-col gap-1 border-t border-slate-100 ${!isCurrentMonth ? 'bg-slate-50/30 opacity-40' : ''}`}
                                >
                                    <div className={`text-right text-[11px] font-bold ${isToday ? 'text-blue-600 bg-blue-50 px-1 w-5 h-5 rounded-full flex items-center justify-center self-end' : 'text-slate-400'}`}>
                                        {format(date, 'd')}
                                    </div>
                                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                                        {sessions.map((s, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => nav(`/student/classes/${s.classId}`)} 
                                                className="bg-amber-50/80 px-1.5 py-1 rounded text-[9px] font-extrabold text-amber-800 border-l border-amber-400 cursor-pointer hover:bg-amber-100/80 flex items-center justify-between truncate" 
                                                title={`${s.className} (${s.room})`}
                                            >
                                                <span>{s.time.split('-')[0]} P.{s.room}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
