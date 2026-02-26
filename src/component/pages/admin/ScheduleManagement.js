// src/component/pages/admin/ScheduleManagement.js
import React, { useMemo, useState } from "react";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Badge, Input } from "component/ui";

export default function ScheduleManagement() {
    const [q, setQ] = useState("");

    const items = useMemo(() => {
        return mock.schedule.filter((x) => !q || x.title.toLowerCase().includes(q.toLowerCase()) || x.location.toLowerCase().includes(q.toLowerCase()));
    }, [q]);

    return (
        <div>
            <PageHeader title="Schedule Management" subtitle="Search and view scheduled sessions." />

            <Card>
                <CardContent>
                    <div className="max-w-md">
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or location..." />
                    </div>

                    <div className="mt-4 space-y-2">
                        {items.map((s) => (
                            <div key={s.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                                    <div className="text-xs text-slate-500">
                                        {s.date} • {s.time} • {s.location}
                                    </div>
                                </div>
                                <Badge tone="blue">{s.role}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}