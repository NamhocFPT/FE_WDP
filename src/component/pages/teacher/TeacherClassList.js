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
    const [selectedClass, setSelectedClass] = useState(null);

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

    const handleBackToList = () => {
        setSelectedClass(null);
    };

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
    if (!selectedClass) {
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
                                onClick={() => setSelectedClass(c)}
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
                                        <div className="flex flex-wrap gap-1.5">
                                            {c.schedule && c.schedule.length > 0 ? (
                                                Array.from(new Set(c.schedule.map((s) => `${s.day} ${s.time}`))).slice(0, 2).map((timeStr, idx) => (
                                                    <div key={idx} className="bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded text-[10px] font-bold shadow-sm">
                                                        {timeStr}
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic text-[10px]">Chưa sắp lịch</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // GIAO DIỆN CHI TIẾT LỚP (SIDEBAR)
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-4">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBackToList}
                    className="rounded-xl border-slate-200 hover:bg-slate-100 px-3 flex items-center gap-2 font-bold text-slate-600"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </Button>
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedClass.name}</h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* SIDEBAR BÊN TRÁI - 3 MENU CON */}
                <div className="lg:w-72 shrink-0 space-y-3">
                    <Card className="p-2 border-none bg-slate-50/50 shadow-none ring-1 ring-slate-200">
                        <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quản lý lớp học</div>
                        
                        <div className="space-y-1">
                            <button 
                                onClick={() => nav(`/teacher/classes/${selectedClass.id}/assignments?type=essay`)}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-blue-600 hover:text-white group text-slate-700 font-bold text-sm"
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                                    <BookOpen className="w-4 h-4 text-blue-600 group-hover:text-white" />
                                </div>
                                <span>Bài tập tự luận</span>
                            </button>

                            <button 
                                onClick={() => nav(`/teacher/classes/${selectedClass.id}/assignments?type=quiz`)}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-emerald-600 hover:text-white group text-slate-700 font-bold text-sm"
                            >
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                                    <ClipboardList className="w-4 h-4 text-emerald-600 group-hover:text-white" />
                                </div>
                                <span>Bài tập trắc nghiệm</span>
                            </button>

                            <button 
                                onClick={() => nav(`/teacher/classes/${selectedClass.id}/gradebook`)}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white group text-slate-700 font-bold text-sm border-t border-slate-100 pt-3 mt-2"
                            >
                                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                                    <BarChart3 className="w-4 h-4 text-slate-700 group-hover:text-white" />
                                </div>
                                <span>Vào sổ điểm lớp</span>
                            </button>
                        </div>
                    </Card>
                    
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
                            <Info className="w-3.5 h-3.5" /> Ghi chú
                        </div>
                        <p className="text-[11px] text-amber-700 leading-relaxed italic">
                            Chọn một hạng mục ở trên để bắt đầu quản lý bài tập hoặc chấm điểm cho sinh viên của lớp này.
                        </p>
                    </div>
                </div>

                {/* CONTENT BÊN PHẢI - TỔNG QUAN LỚP HỌC */}
                <div className="flex-1 space-y-6">
                    <Card className="overflow-hidden">
                        <div className="bg-slate-900 p-6 text-white relative">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Thông tin chi tiết</div>
                                    <h3 className="text-2xl font-black tracking-tight">{selectedClass.name}</h3>
                                    <div className="mt-2 text-slate-400 font-medium text-sm">Mã học phần: <span className="text-white">{selectedClass.courseCode || selectedClass.course?.code || "N/A"}</span></div>
                                </div>
                                <Badge tone="blue" className="bg-blue-500 text-white border-none py-1.5 px-4 text-sm font-black">
                                    Phòng: {selectedClass.room || "TBA"}
                                </Badge>
                            </div>
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                        </div>
                        
                        <CardContent className="p-8 grid gap-8 md:grid-cols-2">
                            {/* Column 1: Schedule */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wider">
                                    <Clock className="w-4 h-4 text-blue-600" /> Thời gian học
                                </h4>
                                <div className="space-y-3">
                                    {selectedClass.schedule && selectedClass.schedule.length > 0 ? (
                                        Array.from(new Set(selectedClass.schedule.map(s => `${s.day} ${s.time}`))).map((timeStr, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 transition-colors">
                                                <span className="text-sm font-bold text-slate-700">{timeStr}</span>
                                                <Badge tone="slate" className="bg-white border border-slate-200 shadow-sm">Hoạt động</Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-slate-400 italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            Chưa có lịch học cụ thể cho lớp này.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Quick Stats */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wider">
                                    <Users className="w-4 h-4 text-emerald-600" /> Thông tin bổ sung
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                        <div className="text-[10px] text-emerald-600 font-black uppercase mb-1">Sĩ số</div>
                                        <div className="text-2xl font-black text-emerald-900">{selectedClass.studentCount || 0} <span className="text-xs font-bold opacity-60">sv</span></div>
                                    </div>
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                        <div className="text-[10px] text-blue-600 font-black uppercase mb-1">Môn học</div>
                                        <div className="text-xs font-black text-blue-900 truncate" title={selectedClass.courseName || selectedClass.course?.name}>
                                            {selectedClass.courseName || selectedClass.course?.name || "N/A"}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl col-span-2">
                                        <div className="text-[10px] text-slate-400 font-black uppercase mb-1 flex justify-between items-center">
                                            <span>Tiến độ giảng dạy</span>
                                            <span className="text-slate-900">0%</span>
                                        </div>
                                        <div className="mt-2 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-800 transition-all duration-1000" style={{ width: '0%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}