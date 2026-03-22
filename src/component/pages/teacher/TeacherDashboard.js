import React, { useState, useEffect } from "react";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent, Badge, Button } from "component/ui";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem("smartedu_token");
                const res = await fetch("http://localhost:9999/api/teacher/dashboard", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                } else {
                    setError(result.message);
                }
            } catch (err) {
                setError("Có lỗi xảy ra khi tải dữ liệu.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (isLoading) return <div className="p-10 text-center text-slate-500">Đang tải dữ liệu Dashboard...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Lỗi: {error}</div>;

    const { todaySessions = [], needsGrading = [], classes = [], recentActivities = [] } = data || {};

    const totalNeedsGrading = needsGrading.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Bảng điều khiển Giáo viên" 
                subtitle="Tổng quan lịch dạy và bài tập cần chấm trong ngày." 
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Lớp phụ trách" value={classes.length} hint="Lớp đang mở" />
                <StatCard label="Bài chờ chấm" value={totalNeedsGrading} hint="Cần chấm điểm" />
                <StatCard label="Ca dạy hôm nay" value={todaySessions.length} hint="Buổi học" />
                <StatCard label="Yêu cầu mới" value={recentActivities.length} hint="Hoạt động" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* KHỐI 1: LỊCH DẠY HÔM NAY */}
                    <Card>
                        <CardHeader><CardTitle>Lịch dạy hôm nay</CardTitle></CardHeader>
                        <CardContent className="space-y-3 p-4">
                            {todaySessions.length === 0 ? (
                                <div className="text-sm text-slate-500 italic p-4 text-center border rounded-xl bg-slate-50">
                                    Hôm nay bạn không có lịch lên lớp. Chúc bạn một ngày hiệu quả!
                                </div>
                            ) : (
                                todaySessions.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 bg-white hover:shadow-md transition-shadow">
                                        <div>
                                            <div className="font-bold text-slate-800 text-base">{s.className}</div>
                                            <div className="text-xs text-slate-500 mt-1 flex gap-2 items-center">
                                                <span>🕒 {new Date(s.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - {new Date(s.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Phòng: {s.room || "TBA"}</span>
                                            </div>
                                        </div>
                                        <Badge tone="blue">Giảng dạy</Badge>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* KHỐI 2: LỚP HỌC PHỤ TRÁCH */}
                    <Card>
                        <CardHeader><CardTitle>Lớp học của tôi</CardTitle></CardHeader>
                        <CardContent className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2">
                            {classes.map((c) => (
                                <div 
                                    key={c.id} 
                                    onClick={() => navigate(`/teacher/classes/${c.id}`)}
                                    className="rounded-xl border border-slate-100 p-4 bg-white hover:border-blue-200 hover:shadow-md cursor-pointer transition-all shadow-sm active:scale-[0.98]"
                                >
                                    <div className="font-bold text-slate-800 text-base">{c.name}</div>
                                    <div className="text-xs text-slate-500 mb-3">{c.courseName || "Cấp độ khóa học"}</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-600">Sĩ số: {c.studentCount} học sinh</span>
                                            <span className="text-blue-700">{c.progress}% Hoàn tất</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 transition-all" style={{ width: `${c.progress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* KHỐI 3: VIỆC CẦN LÀM / CHỜ CHẤM ĐIỂM */}
                    <Card className="border-amber-100">
                        <div className="bg-amber-50 px-4 py-3 text-amber-800 font-bold text-sm border-b border-amber-100 flex justify-between items-center">
                            <span>Việc cần làm</span>
                            <Badge tone="amber">{totalNeedsGrading}</Badge>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            {needsGrading.length === 0 ? (
                                <div className="text-xs text-slate-500 italic text-center p-3 border border-dashed rounded-xl border-amber-200 bg-amber-50/20">
                                    🎉 Tuyệt vời! Chưa có bài tập tồn đọng cần chấm.
                                </div>
                            ) : (
                                needsGrading.map((g) => (
                                    <div 
                                        key={g.assessmentId} 
                                        onClick={() => {
                                            if (g.type?.toUpperCase() === 'QUIZ') {
                                                navigate(`/teacher/classes/${g.classId}/assessments/${g.assessmentId}/quiz-attempts`);
                                            } else {
                                                navigate(`/teacher/classes/${g.classId}/assessments/${g.assessmentId}/submissions`);
                                            }
                                        }}
                                        className="flex items-center justify-between p-3 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 cursor-pointer transition-all active:scale-95"
                                    >
                                        <div className="overflow-hidden">
                                            <div className="font-semibold text-sm text-slate-800 truncate">{g.title}</div>
                                            <div className="text-[10px] text-amber-600 font-bold uppercase mt-1">Bấm để chấm bài ngay</div>
                                        </div>
                                        <Badge tone="amber" className="font-bold">{g.count}</Badge>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* KHỐI 4: HOẠT ĐỘNG GẦN ĐÂY */}
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Hoạt động gần đây</CardTitle></CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {recentActivities.length === 0 ? (
                                <div className="text-xs text-slate-400 italic text-center">Chưa có hoạt động mới.</div>
                            ) : (
                                recentActivities.map((act) => (
                                    <div 
                                        key={act.id} 
                                        onClick={() => act.link && navigate(act.link)}
                                        className={`flex gap-3 text-xs border-b last:border-0 pb-3 last:pb-0 items-start p-2 rounded-lg ${act.link ? "cursor-pointer hover:bg-slate-50 transition-all active:scale-[0.98]" : ""}`}
                                    >
                                        <span className="text-xl">{act.isLate ? "⚠️" : "📝"}</span>
                                        <div>
                                            <div className={`font-semibold ${act.isLate ? "text-amber-700" : "text-slate-800"}`}>
                                                {act.message}
                                            </div>
                                            <div className="text-slate-400 text-[10px] mt-0.5">
                                                {new Date(act.timestamp).toLocaleString('vi-VN')}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}