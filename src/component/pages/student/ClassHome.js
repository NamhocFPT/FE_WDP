// src/component/pages/student/ClassHome.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { studentApi } from "service/studentApi";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Badge, Table, Th, Td } from "component/ui";

export default function ClassHome() {
    const { id } = useParams();
    const [cl, setCl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState("overview");

    useEffect(() => {
        const fetchClass = async () => {
            try {
                const res = await studentApi.getClassDetails(id);
                if (res.data?.success) {
                    setCl(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching class:", err);
                setError(err.response?.data?.message || "Class not found or no access.");
            } finally {
                setLoading(false);
            }
        };
        fetchClass();
    }, [id]);

    if (loading) return <div className="p-4">Loading class details...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!cl) return <div className="p-4 text-sm text-slate-600">Class not found.</div>;

    const TabBtn = ({ v, label }) => (
        <button
            onClick={() => setTab(v)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === v ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <PageHeader title={cl.name} subtitle={`Teacher: ${cl.teacher} • Room: ${cl.room}`} />

            <div className="mb-4 flex flex-wrap gap-2">
                <TabBtn v="overview" label="Overview" />
                <TabBtn v="materials" label="Materials" />
                <TabBtn v="assignments" label="Assignments" />
                <TabBtn v="announcements" label="Announcements" />
            </div>

            {tab === "overview" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {cl.schedule && cl.schedule.length > 0 ? cl.schedule.map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                                    <div className="font-semibold text-slate-900">{s.day}</div>
                                    <div className="text-slate-700">{s.time}</div>
                                </div>
                            )) : <div className="text-sm text-slate-500">Chưa có lịch phân công cho lớp học này.</div>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Quick info</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center justify-between"><span>Students</span><Badge tone="blue">{cl.studentsCount || 0}</Badge></div>
                            <div className="flex items-center justify-between"><span>Materials</span><Badge tone="blue">{cl.materials?.length || 0}</Badge></div>
                            <div className="flex items-center justify-between"><span>Assignments</span><Badge tone="blue">{cl.assignments?.length || 0}</Badge></div>
                        </CardContent>
                    </Card>
                </div>
            ) : null}

            {tab === "materials" ? (
                <Card>
                    <CardHeader><CardTitle>Materials</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {cl.materials?.length > 0 ? cl.materials.map((m) => (
                            <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                                    <div className="text-xs text-slate-500">Updated: {m.updatedAt}</div>
                                </div>
                                <Badge tone="blue">{m.type}</Badge>
                            </div>
                        )) : <div className="text-sm text-slate-500">No materials available yet.</div>}
                    </CardContent>
                </Card>
            ) : null}

            {tab === "assignments" ? (
                <Card>
                    <CardHeader><CardTitle>Assignments</CardTitle></CardHeader>
                    <CardContent>
                        {cl.assignments?.length > 0 ? (
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
                        ) : <div className="text-sm text-slate-500">No upcoming assignments.</div>}
                    </CardContent>
                </Card>
            ) : null}

            {tab === "announcements" ? (
                <Card>
                    <CardHeader><CardTitle>Announcements</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {cl.announcements?.length > 0 ? cl.announcements.map((a) => (
                            <div key={a.id} className="rounded-xl border border-slate-200 p-3">
                                <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                                <div className="mt-1 text-sm text-slate-700">{a.content}</div>
                                <div className="mt-2 text-xs text-slate-500">{a.date}</div>
                            </div>
                        )) : <div className="text-sm text-slate-500">No new announcements.</div>}
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}