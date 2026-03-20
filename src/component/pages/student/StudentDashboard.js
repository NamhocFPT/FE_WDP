// src/component/pages/student/StudentDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "service/studentApi";

import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent, Badge } from "component/ui";

export default function StudentDashboard() {
    const [dashboardData, setDashboardData] = useState({
        classes: [],
        upcomingAssessmentsCount: 0,
        upcomingAssessments: [],
        todaySessions: [],
        recentActivities: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("all"); // tabs: all, quiz, assignment
    const navigate = useNavigate();

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
    const upcomingAssessmentsCount = dashboardData.upcomingAssessmentsCount || 0;
    const upcomingAssessments = dashboardData.upcomingAssessments || [];
    const todaySessions = dashboardData.todaySessions || [];
    const recentActivities = dashboardData.recentActivities || [];

    const filteredAssessments = upcomingAssessments.filter(a => {
        if (activeTab === "all") return true;
        const isQuiz = a.type === "QUIZ" || String(a.type).toUpperCase() === "QUIZ";
        if (activeTab === "quiz") return isQuiz;
        return !isQuiz;
    });

    return (
        <div className="space-y-6">
            <PageHeader title="Student Dashboard" subtitle="Your classes, schedule and progress." />

            {/* KHỐI THỐNG KÊ (STAT CARDS) */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Enrolled Classes" value={classes.length} hint="Active" />
                <StatCard label="Upcoming Tasks" value={upcomingAssessmentsCount} hint="To do" />
                <StatCard label="Today Sessions" value={todaySessions.length} hint="Classes today" />
                <div className="cursor-pointer" onClick={() => navigate('/student/grades')}>
                    <StatCard label="My Progress" value="View" hint="All grades" />
                </div>
            </div>


            {/* KHỐI CHI TIẾT LỊCH TRÌNH VÀ LỚP HỌC */}
            <div className="grid gap-4 lg:grid-cols-2">

                {/* Cột 1: Lịch học hôm nay */}
                <Card>
                    <CardHeader><CardTitle>Lịch học hôm nay</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {todaySessions.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500 border border-dashed rounded-xl bg-slate-50">
                                Hôm nay bạn không có lịch học. <br /> Hãy dành thời gian ôn tập nhé!
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

                {/* Cột 2: Việc cần làm & Deadline */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                        <CardTitle>Hạn chót sắp tới (7 ngày)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-0">
                        {/* Tab Buttons */}
                        <div className="flex border-b border-slate-200">
                            {['all', 'quiz', 'assignment'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2 text-center text-sm font-semibold border-b-2 transition-all ${activeTab === tab ? 'border-b-blue-600 text-blue-600 bg-white' : 'border-b-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {tab === 'all' ? 'Tất cả' : tab === 'quiz' ? 'Quiz' : 'Bài tập'}
                                </button>
                            ))}
                        </div>
                        
                        <div className="p-4 space-y-2">
                        {filteredAssessments.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500 border border-dashed rounded-xl bg-slate-50">
                                {activeTab === 'all' 
                                    ? 'Tuyệt vời! Bạn không có bài tập hay quiz nào sắp đến hạn.' 
                                    : activeTab === 'quiz' 
                                        ? 'Không có quiz nào sắp đến hạn.' 
                                        : 'Không có bài tập nào sắp đến hạn.'}
                            </div>
                        ) : filteredAssessments.map((a) => (
                            <div 
                                key={a.id} 
                                onClick={() => {
                                    if (a.type === "QUIZ" || String(a.type).toUpperCase() === "QUIZ") {
                                        navigate(`/student/quizzes/${a.id}/start`);
                                    } else {
                                        navigate(`/student/assessments/${a.id}`);
                                    }
                                }}
                                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm hover:shadow-md cursor-pointer transition-all ${a.isUrgent ? 'border-l-4 border-l-red-500 bg-red-50/30' : 'border-slate-200 border-l-4 border-l-orange-400'}`}
                            >
                                <div>
                                    <div className="font-bold text-slate-900">{a.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        Môn: <span className="font-medium">{a.className}</span> • Hạn: <span className={`font-medium ${a.isUrgent ? 'text-red-600' : 'text-orange-600'}`}>{a.dueFormatted}</span>
                                    </div>
                                </div>
                                <Badge tone={a.type === 'QUIZ' ? 'purple' : 'orange'}>{a.type}</Badge>
                            </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 mt-4">
                 {/* Cột 3: Lớp học & Tiến độ */}
                 <Card>
                    <CardHeader><CardTitle>Khóa học tham gia</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {classes.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500 border border-dashed rounded-xl bg-slate-50">
                                Bạn chưa đăng ký lớp học nào.
                            </div>
                        ) : classes.map((c) => (
                            <div key={c.id} className="rounded-lg border border-slate-200 px-4 py-3 text-sm hover:shadow-sm transition-shadow border-l-4 border-l-blue-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-slate-900">{c.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            GV: <span className="font-medium">{c.teacher}</span> • {c.room}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-blue-600">{c.progress}%</span>
                                    </div>
                                </div>
                                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${c.progress}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Cột 4: Hoạt động gần đây */}
                <Card>
                    <CardHeader><CardTitle>Hoạt động gần đây</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {recentActivities.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500 border border-dashed rounded-xl bg-slate-50">
                                Không có hoạt động mới.
                            </div>
                        ) : recentActivities.map((act, index) => (
                            <div key={index} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${act.type === 'grade' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                    <div>
                                        <div className="font-medium text-slate-800">{act.title}</div>
                                        {act.detail && <div className="text-xs text-slate-400 mt-0.5">{act.detail}</div>}
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 font-medium">{act.date}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}