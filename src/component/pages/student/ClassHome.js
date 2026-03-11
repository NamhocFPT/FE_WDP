// src/component/pages/student/ClassHome.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { studentApi } from "service/studentApi";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Badge, Table, Th, Td } from "component/ui";

export default function ClassHome() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cl, setCl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState("overview");

    useEffect(() => {
        const fetchClassDetails = async () => {
            setIsLoading(true);
            try {
                // Gọi API thông qua studentApi (chuẩn cấu trúc dự án)
                const res = await studentApi.getClassDetails(id);
                if (res.data?.success) {
                    setCl(res.data.data);
                }
            } catch (err) {
                console.error("Lỗi lấy chi tiết lớp:", err);
                setError(err.response?.data?.message || "Không tìm thấy lớp học hoặc bạn không có quyền truy cập.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchClassDetails();
    }, [id]);

    // UI lúc đang Loading (Hiệu ứng Skeleton)
    if (isLoading) return (
        <div className="p-10 space-y-4 animate-pulse">
            <div className="h-12 w-1/3 bg-slate-200 rounded-lg"></div>
            <div className="h-6 w-1/4 bg-slate-200 rounded-lg"></div>
            <div className="h-64 bg-slate-200 rounded-xl mt-8"></div>
        </div>
    );

    // UI lúc gọi API lỗi
    if (error) return (
        <div className="p-10 text-center text-red-500 font-semibold bg-red-50 rounded-xl border border-red-200 mt-6">
            {error}
        </div>
    );

    // UI lúc không có data
    if (!cl) return <div className="p-10 text-center text-slate-500">Không có dữ liệu lớp học.</div>;

    // Component Nút Tab
    const TabBtn = ({ v, label }) => (
        <button
            onClick={() => setTab(v)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${tab === v
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title={cl.name}
                subtitle={`Teacher: ${cl.teacher || "Chưa phân công"} • Room: ${cl.room || "N/A"}`}
            />

            {/* Thanh điều hướng Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                <TabBtn v="overview" label="Overview" />
                <TabBtn v="materials" label="Materials" />
                <TabBtn v="assignments" label="Assignments" />
                <TabBtn v="announcements" label="Announcements" />
            </div>

            {/* TAB: OVERVIEW */}
            {tab === "overview" && (
                <div className="grid gap-4 lg:grid-cols-2 animate-in fade-in duration-300">
                    <Card>
                        <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {cl.schedule?.length > 0 ? cl.schedule.map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm hover:border-blue-300 transition-colors">
                                    <div className="font-semibold text-slate-900">{s.day}</div>
                                    <div className="text-slate-700 font-medium">{s.time}</div>
                                </div>
                            )) : <p className="text-sm text-slate-500 italic">Chưa có lịch học.</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Quick Info</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span>Students</span><Badge tone="slate">{cl.studentsCount || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span>Materials</span><Badge tone="blue">{cl.materials?.length || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Assignments</span><Badge tone="amber">{cl.assignments?.length || 0}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB: MATERIALS */}
            {tab === "materials" && (
                <Card className="animate-in fade-in duration-300">
                    <CardHeader><CardTitle>Materials</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {cl.materials?.length > 0 ? cl.materials.map((m) => (
                            <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">📚</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">{m.title}</div>
                                        <div className="text-xs text-slate-500 mt-1">Updated: {m.updatedAt}</div>
                                    </div>
                                </div>
                                <Badge tone="blue">{m.type}</Badge>
                            </div>
                        )) : <p className="text-sm text-slate-500 italic text-center py-6">No materials posted yet.</p>}
                    </CardContent>
                </Card>
            )}

            {/* TAB: ASSIGNMENTS */}
            {tab === "assignments" && (
                <Card className="animate-in fade-in duration-300">
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
                                    {cl.assignments?.length > 0 ? cl.assignments.map((a) => (
                                        <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                                            <Td>
                                                {/* LINK CHUYỂN TRANG ĐẾN BÀI TẬP CHI TIẾT */}
                                                <div
                                                    className="font-bold text-blue-600 cursor-pointer group-hover:underline"
                                                    onClick={() => navigate(`/student/assessments/${a.id}`)}
                                                >
                                                    {a.title}
                                                </div>
                                            </Td>
                                            <Td className="text-slate-600 text-sm font-medium">{a.due}</Td>
                                            <Td><Badge tone="amber">{a.points}</Badge></Td>
                                        </tr>
                                    )) : <tr><Td colSpan="3" className="text-center py-8 text-slate-500 italic">No assignments available.</Td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TAB: ANNOUNCEMENTS */}
            {tab === "announcements" && (
                <Card className="animate-in fade-in duration-300">
                    <CardHeader><CardTitle>Announcements</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {cl.announcements?.length > 0 ? cl.announcements.map((a) => (
                            <div key={a.id} className="rounded-xl border border-blue-100 bg-blue-50/40 p-5 hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">📢</span>
                                    <div className="text-sm font-bold text-slate-900">{a.title}</div>
                                </div>
                                <div className="text-sm text-slate-700 leading-relaxed border-l-2 border-blue-200 pl-3 ml-2">{a.content}</div>
                                <div className="mt-3 text-xs font-semibold text-slate-400 ml-5">{a.date}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}