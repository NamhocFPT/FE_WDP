// src/component/pages/student/StudentDashboard.js
import React from "react";
import { mock } from "service/mockData";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent, Badge } from "component/ui";

export default function StudentDashboard() {
    const myClasses = mock.classes; // demo: student thấy 1 lớp
    const today = mock.schedule.filter((s) => s.role === "student");

    return (
        <div>
            <PageHeader title="Student Dashboard" subtitle="Your classes, schedule and progress." />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Enrolled Classes" value={myClasses.length} hint="Active" />
                <StatCard label="Materials" value={myClasses.reduce((a, c) => a + c.materials.length, 0)} hint="Available" />
                <StatCard label="Assignments" value={myClasses.reduce((a, c) => a + c.assignments.length, 0)} hint="To do" />
                <StatCard label="Today sessions" value={today.length} hint="Upcoming" />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Today</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {today.map((s) => (
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
                        {myClasses.map((c) => (
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