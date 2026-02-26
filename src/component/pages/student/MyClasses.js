// src/component/pages/student/MyClasses.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Button, Badge } from "component/ui";

export default function MyClasses() {
    const nav = useNavigate();

    return (
        <div>
            <PageHeader title="My Classes" subtitle="Classes you are enrolled in." />

            <div className="grid gap-3 md:grid-cols-2">
                {mock.classes.map((c) => (
                    <Card key={c.id}>
                        <CardContent>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                                    <div className="mt-1 text-xs text-slate-500">Teacher: {c.teacher}</div>
                                </div>
                                <Badge tone="blue">{c.room}</Badge>
                            </div>

                            <div className="mt-3 text-xs text-slate-600">
                                {c.schedule.map((s) => `${s.day} ${s.time}`).join(" • ")}
                            </div>

                            <div className="mt-3">
                                <Button variant="outline" onClick={() => nav(`/student/classes/${c.id}`)}>
                                    Open class
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}