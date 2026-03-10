// src/component/pages/student/StudentDashboard.js
import React, { useState, useEffect } from "react";
import { studentApi } from "service/studentApi";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent, Badge } from "component/ui";

export default function StudentDashboard() {
    const [dashboardData, setDashboardData] = useState({
        classes: [],
        upcomingAssessments: 0,
        todaySessions: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            setIsLoading(true);
            try {
                const res = await studentApi.getStudentDashboard();
                if (res.data?.success) {
                    setDashboardData(res.data.data);
                }
            } catch (err) {
                console.error("Lỗi lấy dữ liệu dashboard:", err);
                setError("Could not load your dashboard data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    // Xử lý giao diện lúc đang tải dữ liệu (Loading Skeleton mượt mà)
    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse p-4">
                <div className="h-20 w-1/3 bg-slate-200 rounded-lg mb-8"></div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>)}
                </div>
                <div className="grid gap-4 lg:grid-cols-2 mt-4">
                    <div className="h-64 bg-slate-200 rounded-xl"></div>
                    <div className="h-64 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    // Xử lý giao diện lúc gọi API lỗi
    if (error) {
        return (
            <div className="p-10 mt-10 text-center bg-red-50 border-2 border-dashed border-red-200 rounded-xl text-red-500 font-medium">
                {error}
            </div>
        );
    }

    // Lấy dữ liệu an toàn (fallback array rỗng nếu api trả thiếu)
    const classes = dashboardData.classes || [];
    const upcomingAssessments = dashboardData.upcomingAssessments || 0;
    const todaySessions = dashboardData.todaySessions || [];

    return (
        <div className="space-y-6">
            <PageHeader title="Student Dashboard" subtitle="Your classes, schedule and progress." />

            {/* KHỐI THỐNG KÊ (STAT CARDS) */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Enrolled Classes" value={classes.length} hint="Active" />
                <StatCard label="Upcoming Tasks" value={upcomingAssessments} hint="To do" />
                <StatCard label="Today Sessions" value={todaySessions.length} hint="Classes today" />
                <StatCard label="Recent Grades" value={0} hint="Coming soon" />
            </div>

            {/* KHỐI CHI TIẾT LỊCH TRÌNH VÀ LỚP HỌC */}
            <div className="grid gap-4 lg:grid-cols-2">
                
                {/* Cột 1: Lịch học hôm nay */}
                <Card>
                    <CardHeader><CardTitle>Today</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {todaySessions.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500 border border-dashed rounded-xl bg-slate-50">
                                Hôm nay bạn không có lịch học. <br/> Hãy dành thời gian ôn tập nhé!
                            </div>
                        ) : todaySessions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50 transition-colors">
                                <div>
                                    <div className="font-bold text-slate-900">{s.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        <span className="font-medium text-slate-700">{s.time}</span> • {s.location}
                                    </div>
                                </div>
                                <Badge tone="blue">Class</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Cột 2: Danh sách lớp học ngắn gọn */}
                <Card>
                    <CardHeader><CardTitle>My classes</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {classes.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500 border border-dashed rounded-xl bg-slate-50">
                                Bạn chưa đăng ký lớp học nào.
                            </div>
                        ) : classes.map((c) => (
                            <div key={c.id} className="rounded-lg border border-slate-200 px-4 py-3 text-sm hover:shadow-sm transition-shadow border-l-4 border-l-blue-500">
                                <div className="font-bold text-slate-900">{c.name}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Teacher: <span className="font-medium">{c.teacher}</span> • Room <span className="font-medium">{c.room}</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}