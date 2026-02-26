// src/component/pages/admin/ClassDetail.js
import React from "react";
import { useParams } from "react-router-dom";
import { mock } from "service/mockData";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Badge, Table, Th, Td } from "component/ui";

export default function ClassDetail() {
    const { id } = useParams();
    const cl = mock.classes.find((x) => x.id === id);

    if (!cl) return <div className="text-sm text-slate-600">Class not found.</div>;

    return (
        <div>
            <PageHeader title={cl.name} subtitle={`Teacher: ${cl.teacher} • Room: ${cl.room}`} />

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {cl.schedule.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                                <div className="font-semibold text-slate-900">{s.day}</div>
                                <div className="text-slate-700">{s.time}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Roster</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {cl.students.map((s) => (
                            <div key={s} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <div className="font-semibold text-slate-900">{s}</div>
                                <Badge tone="green">Active</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Materials</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {cl.materials.map((m) => (
                                <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                    <div>
                                        <div className="font-semibold text-slate-900">{m.title}</div>
                                        <div className="text-xs text-slate-500">Updated: {m.updatedAt}</div>
                                    </div>
                                    <Badge tone="blue">{m.type}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Assignments</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Title</Th>
                                        <Th>Due</Th>
                                        <Th>Points</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cl.assignments.map((a) => (
                                        <tr key={a.id}>
                                            <Td className="font-semibold text-slate-900">{a.title}</Td>
                                            <Td>{a.due}</Td>
                                            <Td><Badge tone="amber">{a.points}</Badge></Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-4">
                <Card>
                    <CardHeader><CardTitle>Gradebook (demo)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Student</Th>
                                        {cl.assignments.map((a) => <Th key={a.id}>{a.id}</Th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {cl.gradebook.map((g) => (
                                        <tr key={g.student}>
                                            <Td className="font-semibold text-slate-900">{g.student}</Td>
                                            {cl.assignments.map((a) => <Td key={a.id}>{g[a.id] ?? "-"}</Td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}