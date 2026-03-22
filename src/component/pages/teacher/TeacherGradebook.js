import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge, Modal } from "component/ui";
import { Eye, EyeOff, MoreVertical, CheckCircle2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import * as TeacherQuizService from "service/TeacherQuizService";
import { toast } from "sonner";

export default function TeacherGradebook() {
    const { classId } = useParams();
    const navigate = useNavigate();
    
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [className, setClassName] = useState(`lớp ${classId}`);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            // Fetch classes to get class name
            try {
                const classesRes = await TeacherQuizService.getTeacherClasses();
                if (classesRes.success && classesRes.data) {
                    const cls = classesRes.data.find(c => String(c.id) === String(classId));
                    if (cls) setClassName(cls.name || cls.courseName || `Lớp ${classId}`);
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin lớp:", err);
            }

            const token = localStorage.getItem("smartedu_token");
            const res = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/assessments`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setAssessments(result.data);
            }
        } catch (error) {
            console.error("Error fetching assessments:", error);
            toast.error("Không thể tải danh sách bài tập");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (classId) fetchAssessments();
    }, [classId]);

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Bảng điểm lớp học" 
                subtitle={`Quản lý trạng thái công bố điểm cho ${className}`}
                onBack={() => navigate("/teacher/classes")}
            />

            <Card className="overflow-hidden">
                <CardContent className="p-0">
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
                                {loading ? (
                                    <tr>
                                        <Td colSpan="6" className="text-center py-12">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                                            <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
                                        </Td>
                                    </tr>
                                ) : (Array.isArray(assessments) ? assessments : []).length > 0 ? (
                                    (Array.isArray(assessments) ? assessments : []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((a) => (
                                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <Td className="font-bold text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    {a.status !== 'published' && <EyeOff className="h-4 w-4 text-amber-500" title="Đang ẩn với sinh viên" />}
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
                                                            navigate(`/teacher/assessments/${a.id}/quiz-attempts`);
                                                        } else {
                                                            navigate(`/teacher/assessments/${a.id}/submissions`);
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
                </CardContent>
                
                {/* Pagination Controls */}
                {assessments.length > itemsPerPage && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="text-sm text-slate-500">
                            Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, assessments.length)} trong tổng số {assessments.length} bài
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm">
                                {currentPage} / {Math.ceil(assessments.length / itemsPerPage) || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(assessments.length / itemsPerPage), p + 1))}
                                disabled={currentPage === Math.ceil(assessments.length / itemsPerPage) || assessments.length === 0}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
