import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizByClass, deleteQuiz, getTeacherClasses } from "service/TeacherQuizService";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge } from "component/ui";
import { FileText, Users, Settings, Plus, Trash2, Edit3, Eye, ChevronRight, ChevronLeft } from "lucide-react";

export default function QuizList() {
    const { classId: paramClassId } = useParams();
    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState(paramClassId || "");
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch danh sách lớp nếu không có classId từ URL
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await getTeacherClasses();
                const data = Array.isArray(res) ? res : res?.data || [];
                setClasses(data);
                if (!selectedClassId && data.length > 0) {
                    setSelectedClassId(data[0].id);
                }
            } catch (err) {
                console.error("Lỗi fetchClasses:", err);
            }
        };
        fetchClasses();
    }, [paramClassId]);

    const fetchQuizzes = async (cid) => {
        if (!cid) return;
        setIsLoading(true);
        try {
            const res = await getQuizByClass(cid);
            if (res.success) {
                setQuizzes(res.data);
                setError(null);
            } else {
                setError(res.message || "Không thể tải danh sách bài Quiz.");
                setQuizzes([]);
            }
        } catch (err) {
            console.error("Lỗi fetchQuizzes:", err);
            setError("Lỗi kết nối máy chủ.");
            setQuizzes([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedClassId) {
            fetchQuizzes(selectedClassId);
            setCurrentPage(1); // Reset page on class change
        } else if (!paramClassId) {
            setIsLoading(false); // Không có gì để tải
        }
    }, [selectedClassId, paramClassId]);

    const handleDelete = async (quizId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài Quiz này?")) return;
        try {
            const res = await deleteQuiz(quizId);
            if (res.success) {
                alert("Xóa thành công!");
                fetchQuizzes();
            } else {
                alert(res.message || "Xóa thất bại.");
            }
        } catch (err) {
            alert("Lỗi khi xóa bài trắc nghiệm.");
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Quản lý Trắc nghiệm Online" 
                subtitle={selectedClassId ? `Lớp: ${classes.find(c => c.id === selectedClassId)?.name || selectedClassId}` : "Danh sách bài tập trắc nghiệm của lớp"}
                onBack={() => navigate("/teacher/classes")}
                right={[
                    <Button 
                        key="create" 
                        disabled={!selectedClassId}
                        onClick={() => navigate(`/teacher/quizzes/create?classId=${selectedClassId}`)}
                        className="flex items-center gap-2 bg-blue-600 text-white"
                    >
                        <Plus size={18} /> Tạo Bài Trắc Nghiệm Mới
                    </Button>
                ]}
            />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Settings size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900">Chọn lớp học</div>
                        <div className="text-xs text-slate-500">Lọc danh sách theo từng lớp</div>
                    </div>
                </div>
                
                <select 
                    className="w-full md:w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer"
                    value={selectedClassId}
                    onChange={(e) => {
                        setSelectedClassId(e.target.value);
                        if (paramClassId) navigate(`/teacher/classes/${e.target.value}/quizzes`, { replace: true });
                    }}
                >
                    <option value="" disabled>-- Chọn lớp học --</option>
                    {(Array.isArray(classes) ? classes : []).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500 animate-pulse">
                            Đang tải danh sách bài trắc nghiệm...
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center text-red-500 bg-red-50 font-medium rounded-b-xl">
                            {error}
                        </div>
                    ) : quizzes.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            {!selectedClassId 
                                ? "Vui lòng chọn một lớp học để xem danh sách." 
                                : "Chưa có bài trắc nghiệm nào được tạo cho lớp này."}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Tiêu đề</Th>
                                        <Th>Trạng thái</Th>
                                        <Th className="text-center">Số câu hỏi</Th>
                                        <Th className="text-center">Số lượt làm</Th>
                                        <Th>Thời hạn</Th>
                                        <Th className="text-right">Thao tác</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(Array.isArray(quizzes) ? quizzes : []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((q) => (
                                        <tr key={q.id} className="hover:bg-slate-50 transition-colors group">
                                            <Td>
                                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                                    {q.title}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">ID: {q.id.substring(0,8)}...</div>
                                            </Td>
                                            <Td>
                                                <Badge tone={q.is_published ? "green" : "slate"}>
                                                    {q.is_published ? "Công bố" : "Bản nháp"}
                                                </Badge>
                                            </Td>
                                            <Td className="text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-slate-700 font-medium">
                                                    <FileText size={14} className="text-slate-400" />
                                                    {q.questionsCount || 0}
                                                </div>
                                            </Td>
                                            <Td className="text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-slate-700 font-medium">
                                                    <Users size={14} className="text-slate-400" />
                                                    {q.attemptsCount || 0}
                                                </div>
                                            </Td>
                                            <Td className="text-sm text-slate-600">
                                                {q.due_at ? new Date(q.due_at).toLocaleString('vi-VN') : "Vô thời hạn"}
                                            </Td>
                                            <Td className="text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button 
                                                        size="xs" 
                                                        variant="outline" 
                                                        title="Xem danh sách nộp bài"
                                                        onClick={() => navigate(`/teacher/assessments/${q.id}/quiz-attempts`)}
                                                    >
                                                        <Eye size={14} />
                                                    </Button>
                                                    <Button 
                                                        size="xs" 
                                                        variant="outline" 
                                                        title="Soạn đề"
                                                        onClick={() => navigate(`/teacher/classes/${selectedClassId}/quizzes/${q.id}/questions`)}
                                                    >
                                                        <Settings size={14} />
                                                    </Button>
                                                    <Button 
                                                        size="xs" 
                                                        variant="outline" 
                                                        title="Chỉnh sửa"
                                                        onClick={() => navigate(`/teacher/quizzes/create?classId=${selectedClassId}&quizId=${q.id}`)}
                                                    >
                                                        <Edit3 size={14} />
                                                    </Button>
                                                    <Button 
                                                        size="xs" 
                                                        variant="danger" 
                                                        className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                                                        title="Xóa"
                                                        onClick={() => handleDelete(q.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {!isLoading && !error && Math.ceil((quizzes || []).length / itemsPerPage) > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl">
                            <span className="text-sm font-medium text-slate-500">
                                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, quizzes.length)} trong số {quizzes.length} bài
                            </span>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="bg-white h-8 w-8 !p-0 flex items-center justify-center text-slate-600 border-slate-300"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center justify-center min-w-[40px] font-bold text-sm text-slate-700">
                                    {currentPage} / {Math.ceil((quizzes || []).length / itemsPerPage)}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={currentPage === Math.ceil((quizzes || []).length / itemsPerPage)}
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil((quizzes || []).length / itemsPerPage), prev + 1))}
                                    className="bg-white h-8 w-8 !p-0 flex items-center justify-center text-slate-600 border-slate-300"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
