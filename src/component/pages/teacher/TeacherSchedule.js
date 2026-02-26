// src/component/pages/teacher/TeacherSchedule.js
import React, { useMemo, useState } from "react";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Badge, Modal, Button } from "component/ui";

export default function TeacherSchedule() {
    const items = useMemo(() => mock.schedule.filter((s) => s.role === "teacher"), []);
    const [selected, setSelected] = useState(null);

    return (
        <div>
            <PageHeader title="Teacher Schedule" subtitle="Weekly sessions (demo)." />

            <Card>
                <CardContent className="space-y-2">
                    {items.map((s) => (
                        <button
                            key={s.id}
                            className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50"
                            onClick={() => setSelected(s)}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                                    <div className="text-xs text-slate-500">{s.date} • {s.time} • {s.location}</div>
                                </div>
                                <Badge tone="blue">Open</Badge>
                            </div>
                        </button>
                    ))}
                </CardContent>
            </Card>

            <Modal open={!!selected} title="Session detail" onClose={() => setSelected(null)}>
                {selected ? (
                    <div className="space-y-3">
                        <div>
                            <div className="text-sm font-semibold text-slate-900">{selected.title}</div>
                            <div className="text-xs text-slate-500">{selected.date} • {selected.time} • {selected.location}</div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            Demo: bạn có thể thêm Attendance / Notes / Materials ở đây.
                        </div>

                        <Button onClick={() => setSelected(null)}>Close</Button>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}