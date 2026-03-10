// src/component/pages/student/StudentDashboard.js
import React, { useState, useEffect } from "react";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent, Badge } from "component/ui";

export default function StudentDashboard() {
    const [dashboardData, setDashboardData] = useState({
        classes: [],
        upcomingAssessments: 0,
        todaySessions: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem("smartedu_token");
                const res = await fetch("http://localhost:9999/api/students/dashboard", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) setDashboardData(result.data);
            } catch (error) {
                console.error("Lỗi lấy dữ liệu dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (isLoading) return <div className="p-10 text-center text-slate-500">Đang tải Dashboard...</div>;

    const { classes, upcomingAssessments, todaySessions } = dashboardData;

    return (
        <div className="space-y-6">
            <PageHeader title="Student Dashboard" subtitle="Your classes, schedule and progress." />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Enrolled Classes" value={classes.length} hint="Active" />
                <StatCard label="Upcoming Tasks" value={upcomingAssessments} hint="To do" />
                <StatCard label="Today Sessions" value={todaySessions.length} hint="Classes today" />
                <StatCard label="Recent Grades" value={0} hint="Coming soon" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Today</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {todaySessions.length === 0 ? (
                            <div className="text-sm text-slate-500 py-4 text-center">No classes scheduled for today.</div>
                        ) : todaySessions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <div>
                                    <div className="font-semibold text-slate-900">{s.title}</div>
                                    <div className="text-xs text-slate-500">{s.date} • {s.time} • {s.location}</div>
                                </div>
                                <Badge tone="blue">Class</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>My classes</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {classes.length === 0 ? (
                            <div className="text-sm text-slate-500 py-4 text-center">You are not enrolled in any classes yet.</div>
                        ) : classes.map((c) => (
                            <div key={c.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <div className="font-semibold text-slate-900">{c.name}</div>
                                <div className="text-xs text-slate-500">Teacher: {c.teacher} • Room {c.room}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}