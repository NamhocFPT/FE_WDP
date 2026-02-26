// src/component/pages/teacher/TeacherDashboard.js
import React from "react";
import { mock } from "service/mockData";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent, Badge } from "component/ui";

export default function TeacherDashboard() {
    const myClasses = mock.classes.filter((c) => c.teacher.includes("Sarah"));
    const today = mock.schedule.filter((s) => s.role === "teacher");

    return (
        <div>
            <PageHeader title="Teacher Dashboard" subtitle="Today overview and your classes." />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="My Classes" value={myClasses.length} hint="Active classes" />
                <StatCard label="Materials" value={myClasses.reduce((a, c) => a + c.materials.length, 0)} hint="Uploaded" />
                <StatCard label="Assignments" value={myClasses.reduce((a, c) => a + c.assignments.length, 0)} hint="Created" />
                <StatCard label="Sessions" value={today.length} hint="Upcoming" />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Today schedule</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {today.map((s) => (
                            <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <div>
                                    <div className="font-semibold text-slate-900">{s.title}</div>
                                    <div className="text-xs text-slate-500">{s.date} • {s.time} • {s.location}</div>
                                </div>
                                <Badge tone="blue">Session</Badge>
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
                                <div className="text-xs text-slate-500">
                                    Room {c.room} • {c.schedule.map((x) => `${x.day} ${x.time}`).join(" • ")}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}