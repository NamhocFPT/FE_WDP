// src/component/pages/student/ClassHome.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { studentApi } from "service/studentApi";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Badge, Table, Th, Td } from "component/ui";
import { Lock, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";


export default function ClassHome() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Đồng bộ tab từ URL query param, mặc định là overview
    const currentTab = searchParams.get("tab") || "overview";

    const [cl, setCl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gradesData, setGradesData] = useState(null);
    const [isGradesLoading, setIsGradesLoading] = useState(false);

    useEffect(() => {
        const fetchClassDetails = async () => {
            setIsLoading(true);
            try {
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

    useEffect(() => {
        if (currentTab === "grades" && !gradesData) {
            const fetchGrades = async () => {
                setIsGradesLoading(true);
                try {
                    const res = await studentApi.getClassGrades(id);
                    if (res.data?.status === "success" || res.data?.success) {
                        setGradesData(res.data.data);
                    }
                } catch (err) {
                    console.error("Lỗi lấy bảng điểm:", err);
                } finally {
                    setIsGradesLoading(false);
                }
            };
            fetchGrades();
        }
    }, [currentTab, id, gradesData]);

    const getStatusBadge = (status) => {
        switch (status) {
            case "published": return <Badge tone="green" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Đã công bố</Badge>;
            case "hidden": return <Badge tone="slate" className="gap-1 opacity-70"><Lock className="h-3 w-3" /> Đã ẩn</Badge>;
            case "submitted": return <Badge tone="blue" className="gap-1"><HelpCircle className="h-3 w-3" /> Đã nộp bài</Badge>;
            case "no_submission": return <Badge tone="amber" className="gap-1"><AlertCircle className="h-3 w-3" /> Chưa nộp</Badge>;
            default: return <Badge tone="slate">{status}</Badge>;
        }
    };

    if (isLoading) return (
        <div className="p-10 space-y-4 animate-pulse">
            <div className="h-12 w-1/3 bg-slate-200 rounded-lg"></div>
            <div className="h-6 w-1/4 bg-slate-200 rounded-lg"></div>
            <div className="h-64 bg-slate-200 rounded-xl mt-8"></div>
        </div>
    );

    if (error) return (
        <div className="p-10 text-center text-red-500 font-semibold bg-red-50 rounded-xl border border-red-200 mt-6">
            {error}
        </div>
    );

    if (!cl) return <div className="p-10 text-center text-slate-500">Không có dữ liệu lớp học.</div>;

    return (
        <div className="space-y-6">
            <PageHeader
                title={cl.name}
                subtitle={`Giảng viên: ${cl.teacher || "Chưa phân công"} • Phòng: ${cl.room || "TBA"}`}
            />

            {/* TAB: OVERVIEW */}
            {currentTab === "overview" && (
                <div className="grid gap-4 lg:grid-cols-2 animate-in fade-in duration-300">
                    <Card>
                        <CardHeader><CardTitle>Lịch học</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {cl.schedule?.length > 0 ? (
                                    Array.from(new Set(cl.schedule.map((s) => `${s.day} ${s.time} • P.${s.room || 'TBA'}`))).map((timeStr, idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:border-blue-300 hover:bg-white transition-colors">
                                            {timeStr}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 italic w-full text-center py-4 bg-slate-50 rounded-lg">Chưa có lịch học.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Thông tin nhanh</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span>Sĩ số</span><Badge tone="slate">{cl.studentsCount || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span>Số tài liệu</span><Badge tone="blue">{cl.materials?.length || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Bài tập & Trắc nghiệm</span><Badge tone="amber">{cl.assignments?.length || 0}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB: MATERIALS */}
            {currentTab === "materials" && (
                <Card className="animate-in fade-in duration-300">
                    <CardHeader><CardTitle>Tài liệu học tập</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {cl.materials?.length > 0 ? cl.materials.map((m) => (
                            <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">📚</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">{m.title}</div>
                                        <div className="text-xs text-slate-500 mt-1">Cập nhật: {m.updatedAt}</div>
                                    </div>
                                </div>
                                <Badge tone="blue">{m.type}</Badge>
                            </div>
                        )) : <p className="text-sm text-slate-500 italic text-center py-6">Chưa có tài liệu nào được đăng.</p>}
                    </CardContent>
                </Card>
            )}

            {/* TAB: QUIZZES */}
            {currentTab === "quizzes" && (
                <Card className="animate-in fade-in duration-300">
                    <CardHeader><CardTitle>Bài tập trắc nghiệm</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Tiêu đề</Th>
                                        <Th>Hạn nộp</Th>
                                        <Th>Điểm tối đa</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cl.assignments?.filter(a => a.type === 'QUIZ' || String(a.type).toUpperCase() === 'QUIZ').length > 0 ? 
                                        cl.assignments.filter(a => a.type === 'QUIZ' || String(a.type).toUpperCase() === 'QUIZ').map((a) => (
                                        <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                                            <Td>
                                                <div
                                                    className="font-bold text-blue-600 cursor-pointer group-hover:underline"
                                                    onClick={() => navigate(`/student/quizzes/${a.id}/start`)}
                                                >
                                                    {a.title}
                                                </div>
                                            </Td>
                                            <Td className="text-slate-600 text-sm font-medium">{a.due}</Td>
                                            <Td><Badge tone="amber">{a.points}</Badge></Td>
                                        </tr>
                                    )) : <tr><Td colSpan="3" className="text-center py-8 text-slate-500 italic">Không có bài trắc nghiệm nào.</Td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TAB: ASSIGNMENTS */}
            {currentTab === "assignments" && (
                <Card className="animate-in fade-in duration-300">
                    <CardHeader><CardTitle>Bài tập tự luận</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Tiêu đề</Th>
                                        <Th>Hạn nộp</Th>
                                        <Th>Điểm tối đa</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cl.assignments?.filter(a => a.type !== 'QUIZ' && String(a.type).toUpperCase() !== 'QUIZ').length > 0 ? 
                                        cl.assignments.filter(a => a.type !== 'QUIZ' && String(a.type).toUpperCase() !== 'QUIZ').map((a) => (
                                        <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                                            <Td>
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
                                    )) : <tr><Td colSpan="3" className="text-center py-8 text-slate-500 italic">Không có bài tự luận nào.</Td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TAB: ANNOUNCEMENTS */}
            {currentTab === "announcements" && (
                <Card className="animate-in fade-in duration-300">
                    <CardHeader><CardTitle>Thông báo lớp học</CardTitle></CardHeader>
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
                        )) : <p className="text-sm text-slate-500 italic text-center py-6">Chưa có thông báo nào.</p>}
                    </CardContent>
                </Card>
            )}

            {/* TAB: GRADES */}
            {currentTab === "grades" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    {isGradesLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-slate-100">
                            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-3 text-sm text-slate-500">Đang tải bảng điểm...</p>
                        </div>
                    ) : gradesData ? (
                        <div className="grid gap-4 lg:grid-cols-4">
                            <div className="lg:col-span-1">
                                <Card className="bg-slate-900 text-white border-none">
                                    <CardContent className="p-6 text-center">
                                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">Tổng kết môn học</p>
                                        <div className="text-4xl font-black">{gradesData.course_total !== null ? Number(gradesData.course_total).toFixed(2) : "--"}</div>
                                        <p className="text-[10px] text-slate-500 mt-2 italic">* Chỉ tính các bài đã công bố</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <Card className="lg:col-span-3">
                                <CardContent className="p-0">
                                    <Table>
                                        <thead>
                                            <tr>
                                                <Th>Hạng mục</Th>
                                                <Th>Trọng số</Th>
                                                <Th>Điểm</Th>
                                                <Th>Trạng thái</Th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gradesData.grade_items?.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <Td>
                                                        <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.type}</div>
                                                    </Td>
                                                    <Td className="text-sm font-semibold text-slate-600">{item.weight}%</Td>
                                                    <Td>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="font-bold text-blue-600">{item.status === 'published' ? item.score : '--'}</span>
                                                            <span className="text-[10px] text-slate-400">/ {item.max_score}</span>
                                                        </div>
                                                    </Td>
                                                    <Td>{getStatusBadge(item.status)}</Td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card className="border-dashed border-2">
                            <CardContent className="p-10 text-center text-slate-400 italic">
                                Không thể tải dữ liệu bảng điểm.
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}