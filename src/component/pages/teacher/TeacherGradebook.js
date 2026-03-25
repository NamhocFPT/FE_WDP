import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge } from "component/ui";
import { Eye, EyeOff, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight, ClipboardList, TableIcon, List } from "lucide-react";
import * as TeacherQuizService from "service/TeacherQuizService";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function TeacherGradebook() {
    const { classId } = useParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("grid"); // "grid" | "assessments"
    const [assessments, setAssessments] = useState([]);
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState({}); // { [studentId]: { [assessmentId]: score } }
    const [loading, setLoading] = useState(true);
    const [className, setClassName] = useState(`lớp ${classId}`);
    const [isUpcomingClass, setIsUpcomingClass] = useState(false);

    // Pagination for list view
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchGrades = async (assessmentsData, studentsData) => {
        const token = localStorage.getItem("smartedu_token");
        const gradesMap = {};

        await Promise.all(assessmentsData.map(async (a) => {
            try {
                const url = String(a.type).toUpperCase() === 'QUIZ'
                    ? `http://localhost:9999/api/teacher/quizzes/${a.id}/attempts`
                    : `http://localhost:9999/api/teacher/assessments/${a.id}/submissions`;

                const res = await fetch(url, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await res.json();

                if (result.success && (result.data || result.attempts)) {
                    const items = Array.isArray(result.data)
                        ? result.data
                        : (result.data && Array.isArray(result.data.submissions)
                            ? result.data.submissions
                            : (result.attempts || []));

                    items.forEach(item => {
                        const studentId = item.user_id || item.student_id || (item.student && item.student.id);
                        const score = (item.score !== undefined && item.score !== null) ? item.score : (item.grade && item.grade.final_score !== undefined && item.grade.final_score !== null ? item.grade.final_score : null);
                        if (studentId !== undefined && score !== null && score !== undefined) {
                            if (!gradesMap[studentId]) gradesMap[studentId] = {};
                            gradesMap[studentId][a.id] = score;
                        }
                    });
                }
            } catch (err) {
                console.error(`Lỗi tải điểm cho bài tập ${a.id}:`, err);
            }
        }));
        setGrades(gradesMap);
    };

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            // Fetch classes to get class name
            try {
                const classesRes = await TeacherQuizService.getTeacherClasses();
                if (classesRes.success && classesRes.data) {
                    const cls = classesRes.data.find(c => String(c.id) === String(classId));
                    if (cls) {
                        setClassName(cls.name || cls.courseName || `Lớp ${classId}`);
                        setIsUpcomingClass(cls.status === "upcoming");
                    }
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin lớp:", err);
            }

            const token = localStorage.getItem("smartedu_token");

            // 1. Fetch Quizzes
            const quizzesRes = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/quizzes`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const quizzesResult = await quizzesRes.json();
            const quizzes = quizzesResult.success && Array.isArray(quizzesResult.data) ? quizzesResult.data.map(q => ({ ...q, type: 'QUIZ' })) : [];

            // 2. Fetch Essays / Assignments
            const res = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/assessments`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            const essays = result.success && result.data && Array.isArray(result.data.assessments)
                ? result.data.assessments.filter(a => String(a.type).toUpperCase() !== 'QUIZ')
                : [];

            // Combine both
            const combinedAssessments = [...quizzes, ...essays];
            setAssessments(combinedAssessments);
            const loadedAssessments = combinedAssessments;

            // Fetch Students List
            const studentsRes = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/students`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const studentsResult = await studentsRes.json();
            let loadedStudents = [];
            if (studentsResult.success && Array.isArray(studentsResult.data)) {
                setStudents(studentsResult.data);
                loadedStudents = studentsResult.data;
            } else {
                setStudents([]);
            }

            // Fetch Grades
            if (loadedAssessments.length > 0 && loadedStudents.length > 0) {
                fetchGrades(loadedAssessments, loadedStudents);
            }

        } catch (error) {
            console.error("Error fetching assessments:", error);
            toast.error("Không thể tải danh sách bài tập");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (classId) {
            setAssessments([]); // Clear previous assessments state to prevent flash from other classes
            fetchAssessments();
        }
    }, [classId]);

    const handleExportExcel = () => {
        if (!students || students.length === 0) return;

        const quizAssessments = (Array.isArray(assessments) ? assessments : []).filter(a => String(a.type).toUpperCase() === 'QUIZ' && a.status === 'published');
        const essayAssessments = (Array.isArray(assessments) ? assessments : []).filter(a => String(a.type).toUpperCase() !== 'QUIZ' && a.status === 'published');

        const csvData = [];
        const header = ["Học sinh", "Email"];
        quizAssessments.forEach(a => header.push(`${a.title} (Quiz / ${parseFloat(a.max_score)}đ)`));
        essayAssessments.forEach(a => header.push(`${a.title} (Tự luận / ${parseFloat(a.max_score)}đ)`));
        csvData.push(header);

        students.forEach(s => {
            const studentId = s.student?.id || s.student_id;
            const studentGrades = grades[studentId] || {};

            const row = [s.student?.full_name || 'Unknown', s.student?.email || '-'];

            quizAssessments.forEach(a => {
                const score = studentGrades[a.id];
                row.push(score !== undefined && score !== null ? score : '-');
            });

            essayAssessments.forEach(a => {
                const score = studentGrades[a.id];
                row.push(score !== undefined && score !== null ? score : '-');
            });

            csvData.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(csvData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bảng điểm");

        XLSX.writeFile(wb, `${className || 'Bang_Diem'}_Export.xlsx`);
    };

    const renderGridView = () => {
        const quizAssessments = (Array.isArray(assessments) ? assessments : []).filter(a => String(a.type).toUpperCase() === 'QUIZ' && a.status === 'published');
        const essayAssessments = (Array.isArray(assessments) ? assessments : []).filter(a => String(a.type).toUpperCase() !== 'QUIZ' && a.status === 'published');

        return (
            <div className="overflow-x-auto">
                <Table className="min-w-full">
                    <thead>
                        {/* Sub-header row for Category Grouping */}
                        <tr className="bg-slate-100/80 text-slate-700 text-xs font-bold border-b">
                            <Th className="sticky left-0 bg-slate-100 z-10 w-48 shadow-sm">Học sinh</Th>
                            {quizAssessments.length > 0 && <Th colSpan={quizAssessments.length} className="text-center bg-blue-50/80 text-blue-800 border-r">Trắc nghiệm</Th>}
                            {essayAssessments.length > 0 && <Th colSpan={essayAssessments.length} className="text-center bg-indigo-50/80 text-indigo-800">Tự luận</Th>}
                        </tr>
                        <tr className="bg-slate-50 border-b">
                            <Th className="sticky left-0 bg-slate-50 z-10 w-48 shadow-sm border-r"></Th>
                            {quizAssessments.map(a => (
                                <Th key={a.id} className="text-center text-xs w-28 min-w-[112px] px-2 py-3 bg-blue-50/30 border-r border-slate-300">
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-slate-800 line-clamp-2 break-words text-center">{a.title}</span>
                                        <span className="text-[10px] text-slate-400">/{parseFloat(a.max_score)}</span>
                                    </div>
                                </Th>
                            ))}
                            {essayAssessments.map(a => (
                                <Th key={a.id} className="text-center text-xs w-28 min-w-[112px] px-2 py-3 bg-indigo-50/30 border-r border-slate-300">
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-slate-800 line-clamp-2 break-words text-center">{a.title}</span>
                                        <span className="text-[10px] text-slate-400">/{parseFloat(a.max_score)}</span>
                                    </div>
                                </Th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s, sIndex) => {
                            const studentId = s.student?.id || s.student_id;
                            const studentGrades = grades[studentId] || {};

                            return (
                                <tr key={s.id || sIndex} className="hover:bg-slate-50 transition-colors border-b">
                                    <Td className="sticky left-0 bg-white font-medium text-slate-900 border-r shadow-sm flex items-center gap-2 py-3 z-10">
                                        <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {s.student?.full_name?.charAt(0) || "U"}
                                        </div>
                                        <span className="text-sm font-semibold truncate max-w-[120px]">{s.student?.full_name || "Unknown"}</span>
                                    </Td>

                                    {quizAssessments.map(a => {
                                        const score = studentGrades[a.id];
                                        const isExpired = a.due_at && new Date(a.due_at) < new Date();
                                        return (
                                            <Td key={a.id} className="text-center font-bold px-2 py-3 text-sm bg-blue-50/5 border-r border-slate-300">
                                                {score !== undefined && score !== null ? (
                                                    <span className="text-blue-900">
                                                        {score}
                                                    </span>
                                                ) : isExpired ? (
                                                    <span className="text-red-500 font-bold">0</span>
                                                ) : (
                                                    <span className="text-slate-300 italic font-normal text-xs">---</span>
                                                )}
                                            </Td>
                                        );
                                    })}

                                    {essayAssessments.map(a => {
                                        const score = studentGrades[a.id];
                                        const isExpired = a.due_at && new Date(a.due_at) < new Date();
                                        return (
                                            <Td key={a.id} className="text-center font-bold px-2 py-3 text-sm bg-indigo-50/5 border-r border-slate-300">
                                                {score !== undefined && score !== null ? (
                                                    <span className="text-blue-900">
                                                        {score}
                                                    </span>
                                                ) : isExpired ? (
                                                    <span className="text-red-500 font-bold">0</span>
                                                ) : (
                                                    <span className="text-slate-300 italic font-normal text-xs">---</span>
                                                )}
                                            </Td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {students.length === 0 && (
                            <tr>
                                <Td colSpan={quizAssessments.length + essayAssessments.length + 1} className="text-center py-12 text-slate-400 italic">
                                    Chưa có học sinh nào trong lớp.
                                </Td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        );
    };

    const renderListView = () => {
        return (
            <div className="overflow-x-auto">
                <Table>
                    <thead>
                        <tr className="bg-slate-50">
                            <Th className="w-1/3">Tên Bài tập / Quiz</Th>
                            <Th>Loại</Th>
                            <Th>Hạn nộp</Th>
                            <Th>Thang điểm</Th>
                            <Th>Trạng thái</Th>
                            <Th className="text-right">Thao tác</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(assessments) && assessments.length > 0 ? (
                            assessments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <Td className="font-bold text-slate-900">
                                        <div className="flex items-center gap-2">
                                            {a.status !== 'published' && <EyeOff className="h-4 w-4 text-amber-500" title="Đang ẩn với học sinh" />}
                                            {a.status === 'published' && <Eye className="h-4 w-4 text-emerald-500" title="Đã công bố" />}
                                            {a.title}
                                        </div>
                                    </Td>
                                    <Td>
                                        <Badge tone={String(a.type).toUpperCase() === 'QUIZ' ? 'blue' : 'indigo'}>
                                            {String(a.type).toUpperCase() === 'QUIZ' ? 'Trắc nghiệm' : 'Tự luận'}
                                        </Badge>
                                    </Td>
                                    <Td className="text-xs text-slate-600">
                                        {a.due_at ? new Date(a.due_at).toLocaleString('vi-VN') : "---"}
                                    </Td>
                                    <Td className="font-semibold text-slate-700">{a.max_score}</Td>
                                    <Td>
                                        {a.status === 'published' ? (
                                            <Badge tone="green" className="gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Công khai
                                            </Badge>
                                        ) : (
                                            <Badge tone="slate" className="gap-1 italic">
                                                <EyeOff className="h-3 w-3" /> Bản nháp
                                            </Badge>
                                        )}
                                    </Td>
                                    <Td className="text-right">
                                        <button
                                            className="h-8 w-8 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                                            title="Xem bài nộp/điểm"
                                            onClick={() => {
                                                if (String(a.type).toUpperCase() === 'QUIZ') {
                                                    navigate(`/teacher/classes/${classId}/assessments/${a.id}/quiz-attempts`);
                                                } else {
                                                    navigate(`/teacher/classes/${classId}/assessments/${a.id}/submissions`);
                                                }
                                            }}
                                        >
                                            <ClipboardList className="h-5 w-5" />
                                        </button>
                                    </Td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <Td colSpan="6" className="text-center py-12 text-slate-400 italic">
                                    Lớp học chưa có bài tập nào được tạo.
                                </Td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Bảng điểm lớp học"
                subtitle={`Quản lý trạng thái và bảng tổng hợp cho ${className}`}
                onBack={() => navigate("/teacher/classes")}
                right={[
                    <Button key="dl" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleExportExcel} disabled={isUpcomingClass}>Xuất điểm Excel</Button>
                ]}
            />

            {isUpcomingClass && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 shadow-sm flex items-start gap-2 animate-in fade-in duration-300">
                    <span className="text-blue-500 pt-0.5">ℹ️</span>
                    <div>
                        <div className="font-bold">Lớp học chưa bắt đầu (Sắp tới)</div>
                        <p className="mt-1 opacity-90">Bảng điểm hiện tại trống vì chưa có hoạt động nào được diễn ra.</p>
                    </div>
                </div>
            )}

            {/* Tab Toggle Removed */}

            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                            <p className="text-slate-500 font-medium">Đang nạp dữ liệu bảng điểm...</p>
                        </div>
                    ) : (
                        renderGridView()
                    )}
                </CardContent>

                {/* Pagination Removed */}
            </Card>
        </div>
    );
}
