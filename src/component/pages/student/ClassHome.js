// src/component/pages/student/ClassHome.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Badge, Table, Th, Td } from "component/ui";

export default function ClassHome() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cl, setCl] = useState(null);
    const [tab, setTab] = useState("overview");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClassDetails = async () => {
            try {
                const token = localStorage.getItem("smartedu_token");
                const res = await fetch(`http://localhost:9999/api/students/classes/${id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) setCl(result.data);
            } catch (error) {
                console.error("Lỗi lấy chi tiết lớp:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClassDetails();
    }, [id]);

    if (isLoading) return <div className="p-10 text-center text-slate-500">Đang tải chi tiết lớp học...</div>;
    if (!cl) return <div className="p-10 text-center text-red-500 font-semibold">Class not found or access denied.</div>;

    const TabBtn = ({ v, label }) => (
        <button
            onClick={() => setTab(v)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === v ? "bg-slate-900 text-white shadow-md" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <PageHeader title={cl.name} subtitle={`Teacher: ${cl.teacher} • Room: ${cl.room}`} />

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                <TabBtn v="overview" label="Overview" />
                <TabBtn v="materials" label="Materials" />
                <TabBtn v="assignments" label="Assignments" />
                <TabBtn v="announcements" label="Announcements" />
            </div>

            {tab === "overview" && (
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {cl.schedule.length > 0 ? cl.schedule.map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                                    <div className="font-semibold text-slate-900">{s.day}</div>
                                    <div className="text-slate-700">{s.time}</div>
                                </div>
                            )) : <p className="text-sm text-slate-500">No schedule available.</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Quick info</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between border-b pb-2"><span>Students</span><Badge tone="slate">{cl.studentsCount || 0}</Badge></div>
                            <div className="flex items-center justify-between border-b pb-2"><span>Materials</span><Badge tone="blue">{cl.materials.length}</Badge></div>
                            <div className="flex items-center justify-between"><span>Assignments</span><Badge tone="amber">{cl.assignments.length}</Badge></div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {tab === "materials" && (
                <Card>
                    <CardHeader><CardTitle>Materials</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {cl.materials.length > 0 ? cl.materials.map((m) => (
                            <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 bg-white hover:bg-slate-50">
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">Updated: {m.updatedAt}</div>
                                </div>
                                <Badge tone="blue">{m.type}</Badge>
                            </div>
                        )) : <p className="text-sm text-slate-500">No materials posted yet.</p>}
                    </CardContent>
                </Card>
            )}

            {tab === "assignments" && (
                <Card>
                    <CardHeader><CardTitle>Assignments</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Title</Th>
                                        <Th>Due Date</Th>
                                        <Th>Max Points</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cl.assignments.length > 0 ? cl.assignments.map((a) => (
                                        <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                            <Td>
                                                {/* LINK ĐẾN TRANG NỘP BÀI (UC_STU_10) */}
                                                <div 
                                                    className="font-bold text-blue-600 cursor-pointer hover:underline"
                                                    onClick={() => navigate(`/student/assessments/${a.id}`)}
                                                >
                                                    {a.title}
                                                </div>
                                            </Td>
                                            <Td className="text-slate-600 text-sm">{a.due}</Td>
                                            <Td><Badge tone="amber">{a.points}</Badge></Td>
                                        </tr>
                                    )) : <tr><Td colSpan="3" className="text-center py-6 text-slate-500">No assignments available.</Td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {tab === "announcements" && (
                <Card>
                    <CardHeader><CardTitle>Announcements</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {cl.announcements.length > 0 ? cl.announcements.map((a) => (
                            <div key={a.id} className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                                <div className="text-sm font-bold text-slate-900">{a.title}</div>
                                <div className="mt-2 text-sm text-slate-700">{a.content}</div>
                                <div className="mt-3 text-xs font-semibold text-slate-500">{a.date}</div>
                            </div>
                        )) : <p className="text-sm text-slate-500">No announcements yet.</p>}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}