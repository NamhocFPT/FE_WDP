// src/component/pages/student/StudentDashboard.js
import React, { useState, useEffect } from "react";
import { studentApi } from "service/studentApi";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent, Badge } from "component/ui";

export default function StudentDashboard() {
    const [data, setData] = useState({
        classes: [],
        upcomingAssessments: 0,
        todaySessions: [],
        recentGrades: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await studentApi.getStudentDashboard();
                if (res.data?.success) {
                    setData(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching dashboard:", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-4">Loading dashboard...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    const myClasses = data.classes || [];
    const today = data.todaySessions || [];

    return (
        <div>
            <PageHeader title="Student Dashboard" subtitle="Your classes, schedule and progress." />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Enrolled Classes" value={myClasses.length} hint="Active" />
                <StatCard label="Upcoming Deadlines" value={data.upcomingAssessments} hint="To do" />
                <StatCard label="Today sessions" value={today.length} hint="Upcoming" />
                {/* Note: In future we can add Graded assignments count here */}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Today</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {today.length === 0 ? (
                            <div className="py-4 text-center text-sm text-slate-500">
                                Hôm nay bạn không có lịch học. Hãy dành thời gian ôn tập nhé!
                            </div>
                        ) : (
                            today.map((s) => (
                                <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                    <div>
                                        <div className="font-semibold text-slate-900">{s.title}</div>
                                        <div className="text-xs text-slate-500">{s.date} • {s.time} • {s.location}</div>
                                    </div>
                                    <Badge tone="blue">Class</Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>My classes</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {myClasses.length === 0 ? (
                            <div className="py-4 text-center text-sm text-slate-500">
                                Bạn chưa đăng ký lớp học nào.
                            </div>
                        ) : (
                            myClasses.map((c) => (
                                <div key={c.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                    <div className="font-semibold text-slate-900">{c.name}</div>
                                    <div className="text-xs text-slate-500">Teacher: {c.teacher} • Room {c.room}</div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}