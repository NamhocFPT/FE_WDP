// src/component/pages/teacher/TeacherClassHome.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { teacherApi } from "service/teacherApi";
import { PageHeader, Card, CardContent, Badge } from "component/ui";
import { Clock, Users, ArrowRight } from "lucide-react";

export default function TeacherClassHome() {
    const { classId } = useParams();
    const nav = useNavigate();
    const [selectedClass, setSelectedClass] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClassDetails = async () => {
            setIsLoading(true);
            try {
                // Fetch all classes and find the current one
                // (Since we don't have a specific get class details Teacher API yet)
                const res = await teacherApi.getMyClasses();
                if (res.data?.success) {
                    const c = res.data.data.find(cls => String(cls.id) === String(classId));
                    if (c) setSelectedClass(c);
                    else setError("Không tìm thấy lớp học.");
                } else {
                    setError("Không thể tải thông tin lớp học.");
                }
            } catch (err) {
                console.error("Failed to fetch class details:", err);
                setError("Có lỗi xảy ra khi kết nối máy chủ.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchClassDetails();
    }, [classId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu lớp học...</div>
            </div>
        );
    }

    if (error || !selectedClass) {
        return (
            <div className="p-10 text-center">
                <div className="inline-block p-6 bg-red-50 border-2 border-dashed border-red-100 rounded-2xl text-red-500 font-bold max-w-md">
                    ⚠️ {error || "Không tìm thấy dữ liệu"}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl mx-auto">
            <PageHeader 
                title={selectedClass.name} 
                subtitle={`Mã học phần: ${selectedClass.courseCode || selectedClass.course?.code || "N/A"}`} 
            />

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card className="overflow-hidden border-none shadow-md">
                        <div className="bg-slate-900 p-6 text-white relative">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tổng quan</div>
                                    <h3 className="text-2xl font-black tracking-tight">{selectedClass.name}</h3>
                                </div>
                                <Badge tone="blue" className="bg-blue-500 text-white border-none py-1.5 px-4 text-sm font-black">
                                    Phòng: {selectedClass.room || "TBA"}
                                </Badge>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                        </div>
                        
                        <CardContent className="p-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                {/* Lịch học */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wider">
                                        <Clock className="w-4 h-4 text-blue-600" /> Thời gian học
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedClass.schedule && selectedClass.schedule.length > 0 ? (
                                            Array.from(new Set(selectedClass.schedule.map(s => `${s.day} ${s.time}`))).map((timeStr, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                    <span className="text-sm font-bold text-slate-700">{timeStr}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-slate-400 italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                Chưa có lịch học cụ thể cho lớp này.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Thông tin */}
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
                                            <div className="text-[10px] text-blue-600 font-black uppercase mb-1">Khóa học</div>
                                            <div className="text-xs font-black text-blue-900 truncate" title={selectedClass.courseName || selectedClass.course?.name}>
                                                {selectedClass.courseName || selectedClass.course?.name || "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="border-none shadow-sm bg-slate-50 p-6 flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">📰</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 mb-2">Bảng tin lớp học</h4>
                        <p className="text-sm text-slate-500 mb-6">Đăng thông báo, chia sẻ tài liệu và thảo luận với sinh viên.</p>
                        <button
                            onClick={() => nav(`/teacher/classes/${classId}/stream`)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            Truy cập Bảng tin <ArrowRight size={16} />
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
