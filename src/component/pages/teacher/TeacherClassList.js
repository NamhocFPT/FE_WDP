// src/component/pages/teacher/TeacherClassList.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { teacherApi } from "service/teacherApi";
import { PageHeader, Card, CardContent, Button, Badge } from "component/ui";
import { ArrowLeft, BookOpen, ClipboardList, BarChart3, Clock, MapPin, Users, Info } from "lucide-react";

export default function TeacherClassList() {
    const nav = useNavigate();
    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoading(true);
            try {
                const res = await teacherApi.getMyClasses();
                console.log("[FRONTEND_DEBUG] Classes fetched:", res.data);
                if (res.data?.success) {
                    setClasses(res.data.data);
                } else {
                    setError(res.data?.message || "Không thể tải danh sách lớp học.");
                }
            } catch (err) {
                console.error("Failed to fetch classes:", err);
                setError("Có lỗi xảy ra khi kết nối máy chủ.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchClasses();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu lớp học...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 text-center">
                <div className="inline-block p-6 bg-red-50 border-2 border-dashed border-red-100 rounded-2xl text-red-500 font-bold max-w-md">
                    ⚠️ {error}
                </div>
            </div>
        );
    }

    // GIAO DIỆN DANH SÁCH LỚP (GRID)
    return (
        <div className="space-y-6">
            <PageHeader
                title="Lớp học của tôi"
                subtitle="Danh sách các lớp học bạn đang phụ trách giảng dạy trong học kỳ này."
            />

            {classes.length === 0 ? (
                <div className="text-center p-20 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl text-slate-400">
                    <div className="text-5xl mb-4">🎓</div>
                    Bạn chưa có lớp học nào được phân công.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {classes.map((c) => (
                        <Card
                            key={c.id}
                            className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 border-t-blue-500 cursor-pointer overflow-hidden"
                            onClick={() => nav(`/teacher/classes/${c.id}`)}
                        >
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                            {c.name}
                                        </h3>
                                        <div className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <span>{c.course?.code}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="truncate">{c.course?.name}</span>
                                        </div>
                                    </div>
                                    <Badge tone="blue" className="shrink-0 ml-2">
                                        {c.room || "TBA"}
                                    </Badge>
                                </div>

                                <div className="mt-auto space-y-3 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                                        <Clock className="w-3.5 h-3.5" /> Lịch dạy tuần này
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        {c.schedule && c.schedule.length > 0 ? (
                                            (() => {
                                                const uniqueSchedule = Array.from(new Set(c.schedule.map((s) => `${s.day} ${s.time}`)));
                                                const displayCount = 3;
                                                const displayItems = uniqueSchedule.slice(0, displayCount);
                                                const remainingCount = uniqueSchedule.length - displayItems.length;

                                                return (
                                                    <>
                                                        {displayItems.map((timeStr, idx) => (
                                                            <div key={idx} className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded-md text-[9px] font-black shadow-sm flex items-center gap-1 border-l-2 border-l-blue-400">
                                                                {timeStr}
                                                            </div>
                                                        ))}
                                                        {remainingCount > 0 && (
                                                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                                +{remainingCount}
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()
                                        ) : (
                                            <span className="text-slate-400 italic text-[10px]">Chưa sắp lịch</span>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-slate-800 text-white hover:bg-slate-900 transition-colors mt-4"
                                >
                                    Quản lý lớp học
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}