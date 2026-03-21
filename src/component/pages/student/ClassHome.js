// src/component/pages/student/ClassHome.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { studentApi } from "service/studentApi";
import { cn, Button, PageHeader, Card, CardHeader, CardTitle, CardContent, Badge, Table, Th, Td } from "component/ui";
import { 
    Lock, CheckCircle2, AlertCircle, HelpCircle,
    FileText, File, MonitorPlay, Table as TableIcon,
    Image, Film, Archive, Link as LinkIcon, Text as TextIcon,
    ChevronDown, ChevronUp, FolderOpen, Download
} from "lucide-react";
import ClassStream from "component/pages/common/stream/ClassStream";
import { format } from "date-fns";

const getTypeIcon = (type) => {
    switch (type) {
        case 'pdf': return { icon: <FileText size={18} className="text-red-500" />, bg: 'bg-red-50' };
        case 'doc': case 'docx': return { icon: <File size={18} className="text-blue-500" />, bg: 'bg-blue-50' };
        case 'slide': case 'pptx': case 'ppt': return { icon: <MonitorPlay size={18} className="text-orange-500" />, bg: 'bg-orange-50' };
        case 'spreadsheet': case 'xls': case 'xlsx': return { icon: <TableIcon size={18} className="text-green-500" />, bg: 'bg-green-50' };
        case 'image': return { icon: <Image size={18} className="text-purple-500" />, bg: 'bg-purple-50' };
        case 'video': return { icon: <Film size={18} className="text-cyan-500" />, bg: 'bg-cyan-50' };
        case 'archive': case 'zip': case 'rar': return { icon: <Archive size={18} className="text-amber-700" />, bg: 'bg-amber-50' };
        case 'link': return { icon: <LinkIcon size={18} className="text-slate-500" />, bg: 'bg-slate-100' };
        case 'text': return { icon: <TextIcon size={18} className="text-slate-500" />, bg: 'bg-slate-50' };
        default: return { icon: <File size={18} className="text-slate-500" />, bg: 'bg-slate-50' };
    }
};

const formatBytes = (bytes) => {
    if (bytes === null || bytes === undefined) return null;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDateObj = (dateString) => {
    if (!dateString) return "";
    try {
        return format(new Date(dateString), "dd/MM/yyyy");
    } catch {
        return dateString;
    }
};

export default function ClassHome() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Đồng bộ tab từ URL query param, mặc định là overview
    const currentTab = searchParams.get("tab") || "stream";

    const [cl, setCl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gradesData, setGradesData] = useState(null);
    const [isGradesLoading, setIsGradesLoading] = useState(false);

    // Materials State
    const [materialsData, setMaterialsData] = useState({ general: [], bySession: [] });
    const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);
    const [expandedSections, setExpandedSections] = useState({ general: true });

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

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

    useEffect(() => {
        if (currentTab === "materials" && materialsData.general.length === 0 && materialsData.bySession.length === 0) {
            const fetchMaterials = async () => {
                setIsMaterialsLoading(true);
                try {
                    const res = await studentApi.getClassMaterials(id);
                    if (res.data?.message === "OK" || res.data?.success) {
                        setMaterialsData({
                            general: res.data.data?.general || [],
                            bySession: res.data.data?.by_session || []
                        });
                    }
                } catch (err) {
                    console.error("Lỗi lấy danh sách tài liệu:", err);
                } finally {
                    setIsMaterialsLoading(false);
                }
            };
            fetchMaterials();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTab, id]);

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

    const renderMaterialRow = (m) => {
        const typeInfo = getTypeIcon(m.type);
        const sizeStr = formatBytes(m.file_size);
        const dateStr = formatDateObj(m.created_at);

        return (
            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-100 last:border-b-0 group hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4 flex-1">
                    <div className={cn("mt-1 p-2 rounded-lg flex-shrink-0", typeInfo.bg)}>
                        {typeInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <a href={m.file_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-900 hover:text-blue-600 truncate underline-offset-2 hover:underline">
                                {m.title}
                            </a>
                        </div>
                        {m.description && (
                            <div className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">{m.description}</div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                            {sizeStr && <span>{sizeStr}</span>}
                            {sizeStr && <span className="w-1 h-1 rounded-full bg-slate-300"></span>}
                            <span>{dateStr}</span>
                            {m.type === 'link' && <span className="w-1 h-1 rounded-full bg-slate-300"></span>}
                            {m.type === 'link' && <span className="truncate max-w-[200px] text-blue-500">{m.file_url}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 mt-4 sm:mt-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button 
                        variant="ghost" 
                        title="Tải về"
                        className="px-2 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => window.open(m.file_url, "_blank")}
                    >
                        {m.type === 'link' ? <LinkIcon size={16} /> : <Download size={16} />}
                        <span className="ml-1.5 sm:hidden">{m.type === 'link' ? 'Mở link' : 'Tải về'}</span>
                    </Button>
                </div>
            </div>
        );
    };

    const isMaterialsEmpty = materialsData.general.length === 0 && materialsData.bySession.every(s => !s.materials || s.materials.length === 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title={cl.name}
                subtitle={`Giảng viên: ${cl.teacher || "Chưa phân công"} • Phòng: ${cl.room || "TBA"}`}
            />

            {/* TAB: STREAM */}
            {currentTab === "stream" && (
                <ClassStream classId={id} />
            )}

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
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <LinkIcon className="text-slate-400" /> Tài liệu môn học
                    </h3>
                    
                    {isMaterialsLoading ? (
                        <div className="p-8 text-center text-slate-500 animate-pulse bg-white rounded-xl shadow-sm border border-slate-200">
                            Đang tải danh sách tài liệu...
                        </div>
                    ) : isMaterialsEmpty ? (
                        <Card className="p-10 text-center border-dashed bg-slate-50/50">
                            <div className="flex flex-col items-center justify-center text-slate-500">
                                <FolderOpen className="text-slate-300 mb-3" size={48} />
                                <h3 className="text-lg font-medium text-slate-700">Chưa có tài liệu nào</h3>
                                <p className="text-sm">Giảng viên chưa đăng tải tài liệu cho môn học này.</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {/* GENERAL MATERIALS */}
                            {materialsData.general.length > 0 && (
                                <section>
                                    <div 
                                        className="flex items-center justify-between px-3 py-3 cursor-pointer bg-white rounded-xl mb-3 shadow-sm border border-slate-200 hover:border-slate-300 transition-all"
                                        onClick={() => toggleSection('general')}
                                    >
                                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                                            <Archive size={18} className="text-slate-500" />
                                            TÀI LIỆU CHUNG
                                        </div>
                                        <Button variant="ghost" className="p-1 h-auto text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg">
                                            {expandedSections['general'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </Button>
                                    </div>
                                    
                                    {expandedSections['general'] && (
                                        <Card className="border shadow-none">
                                            <div className="divide-y divide-slate-100">
                                                {materialsData.general.map(m => renderMaterialRow(m))}
                                            </div>
                                        </Card>
                                    )}
                                </section>
                            )}

                            {/* BY SESSION MATERIALS */}
                            {materialsData.bySession.map((sessionGroup) => {
                                const { session, materials } = sessionGroup;
                                const sectionId = `session_${session.id}`;
                                const isExpanded = expandedSections[sectionId] !== false; // Default expanded

                                return (
                                    <section key={session.id}>
                                        <div 
                                            className="flex items-center justify-between px-3 py-3 cursor-pointer bg-white rounded-xl mb-3 shadow-sm border border-slate-200 hover:border-slate-300 transition-all"
                                            onClick={() => toggleSection(sectionId)}
                                        >
                                            <div className="font-semibold text-slate-800 flex items-center gap-2">
                                                <span className="text-slate-500">📅</span>
                                                BUỔI {session.index} — {formatDateObj(session.start_time)} — {session.topic || "Chưa có chủ đề"}
                                            </div>
                                            <Button variant="ghost" className="p-1 h-auto text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg">
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </Button>
                                        </div>
                                        
                                        {isExpanded && (
                                            <Card className="border shadow-none">
                                                {materials && materials.length > 0 ? (
                                                    <div className="divide-y divide-slate-100">
                                                        {materials.map(m => renderMaterialRow(m))}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-slate-500 italic py-6 bg-slate-50/50">
                                                        Chưa có tài liệu cho buổi này.
                                                    </div>
                                                )}
                                            </Card>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </div>
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