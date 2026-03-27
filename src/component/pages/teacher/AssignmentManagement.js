// src/component/pages/teacher/AssignmentManagement.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge } from "component/ui";
import { Eye, EyeOff, FileText, HelpCircle, Share2, Send, AlertTriangle } from "lucide-react";
import ShareAssessmentModal from "./ShareAssessmentModal";
import { updateQuizStatus } from "service/TeacherQuizService";

export default function AssignmentManagement() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const typeFilter = searchParams.get("type"); // 'quiz' or 'essay'

    const [assignments, setAssignments] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [classDetail, setClassDetail] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [assessmentToShare, setAssessmentToShare] = useState(null);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem("smartedu_token");
            const response = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/assessments`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setAssignments(data.data.assessments);
                setClassDetail(data.data.class);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách bài tập:", error);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (classId) fetchAssignments();
    }, [classId]);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ text: "", type: "" });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const onDelete = async (assessmentId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài tập này không? Hành động này không thể hoàn tác.")) return;

        try {
            const token = localStorage.getItem("smartedu_token");
            const response = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/assessments/${assessmentId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ text: "Đã xóa bài tập thành công!", type: "success" });
                fetchAssignments();
            } else {
                setMessage({ text: data.message || "Không thể xóa bài tập.", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Lỗi kết nối khi xóa.", type: "error" });
        }
    };

    const onQuickPublish = async (assignment) => {
        try {
            const token = localStorage.getItem("smartedu_token");
            const { files, ...assignmentClean } = assignment; // Bỏ files để tránh lỗi tải lại file khi publish

            const response = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/assessments/essay/${assignment.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...assignmentClean,
                    settings: assignment.settings_json,
                    status: 'published'
                })
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ text: "Bài tập đã được công bố!", type: "success" });
                fetchAssignments();
            } else {
                setMessage({ text: data.message || "Không thể công bố bài tập.", type: "error" });
            }
        } catch (error) {
            console.error("Lỗi công bố nhanh:", error);
        }
    };

    const onQuizPublish = async (quiz) => {
        const now = new Date();
        const dueDate = quiz.due_at ? new Date(quiz.due_at) : null;

        if (dueDate && now > dueDate) {
            alert("Đề đã hết hạn nộp bài, nếu muốn công bố hãy thay đổi lại thời gian nộp");
            return;
        }

        if (!window.confirm(`Bạn có chắc muốn công bố đề thi "${quiz.title}"?`)) return;

        try {
            const res = await updateQuizStatus(classId, quiz.id, "published");
            if (res.success) {
                setMessage({ text: "Đã công bố đề thi thành công!", type: "success" });
                fetchAssignments();
            } else {
                setMessage({ text: res.message || "Lỗi khi công bố đề thi.", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Lỗi kết nối khi công bố đề thi.", type: "error" });
        }
    };

    const isExpired = (dueDateStr) => {
        if (!dueDateStr) return false;
        return new Date() > new Date(dueDateStr);
    };

    const handleEditClick = (assignment) => {
        if (assignment.type?.toUpperCase() === 'QUIZ') {
            navigate(`/teacher/classes/${classId}/quizzes/create?quizId=${assignment.id}`);
        } else {
            navigate(`/teacher/classes/${classId}/assignments/essay/edit?essayId=${assignment.id}`);
        }
    };

    const filteredAssignments = assignments.filter(a => {
        if (!typeFilter) return true;
        if (typeFilter === 'quiz') return a.type?.toUpperCase() === 'QUIZ';
        if (typeFilter === 'essay') return a.type?.toUpperCase() === 'ESSAY';
        return true;
    });

    const pageTitle = typeFilter === 'quiz' ? "Quản lý Trắc nghiệm" : (typeFilter === 'essay' ? "Quản lý Tự luận" : "Quản lý Bài tập");
    const pageIcon = typeFilter === 'quiz' ? <HelpCircle className="text-blue-600" /> : <FileText className="text-blue-600" />;

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            <PageHeader
                title={pageTitle}
                subtitle={classDetail ? `${classDetail.course?.name || "---"} (${classDetail.name})` : `Lớp: ${classId}`}
                icon={pageIcon}
                onBack={() => navigate("/teacher/classes")}
                right={[
                    <Button key="n" disabled={classDetail && classDetail.status === "upcoming"} onClick={() => {
                        if (typeFilter === 'quiz') {
                            navigate(`/teacher/classes/${classId}/quizzes/create`);
                        } else {
                            navigate(`/teacher/classes/${classId}/assignments/essay/create`);
                        }
                    }}>
                        + {typeFilter === 'quiz' ? 'Tạo Trắc nghiệm mới' : (typeFilter === 'essay' ? 'Tạo Tự luận mới' : 'Tạo mới')}
                    </Button>
                ]}
            />

            {classDetail && classDetail.status === "upcoming" && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 shadow-sm flex items-start gap-2 animate-in fade-in duration-300 mb-4">
                    <span className="text-blue-500 pt-0.5">ℹ️</span>
                    <div>
                        <div className="font-bold">Lớp học chưa bắt đầu (Sắp tới)</div>
                        <p className="mt-1 opacity-90">Bạn không thể tạo mới bài tập cho đến khi lớp học chính thức bắt đầu.</p>
                    </div>
                </div>
            )}
            {message.text && (
                <div className={`mb-4 rounded-xl border p-3 text-sm font-semibold ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    {message.text}
                </div>
            )}
            <Card>
                <CardContent>
                    {isFetching ? <p className="p-10 text-center text-slate-500">Đang tải dữ liệu...</p> : (
                        <div className="overflow-x-auto">
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Tiêu đề</Th>
                                        <Th>Thời gian mở</Th>
                                        <Th>Hạn nộp</Th>
                                        <Th>Thang điểm</Th>
                                        <Th>Trạng thái</Th>
                                        <Th className="text-right">Thao tác</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAssignments.length > 0 ? filteredAssignments.map((a) => (
                                        <tr key={a.id} className="hover:bg-slate-50 group">
                                            <Td>
                                                <div
                                                    className="font-semibold text-blue-600 cursor-pointer hover:underline flex items-center gap-2"
                                                    onClick={() => {
                                                        if (a.type?.toUpperCase() === 'QUIZ') {
                                                            navigate(`/teacher/classes/${classId}/assessments/${a.id}/quiz-attempts`);
                                                        } else {
                                                            navigate(`/teacher/classes/${classId}/assessments/${a.id}/submissions`);
                                                        }
                                                    }}
                                                >
                                                    {a.status === 'published' ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-amber-500" />}
                                                    {a.title}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">{a.type?.toUpperCase() === 'QUIZ' ? '(Trắc nghiệm)' : '(Tự luận)'}</div>
                                            </Td>
                                            <Td className="text-sm text-slate-600 font-medium whitespace-nowrap">
                                                {a.allow_from ? new Date(a.allow_from).toLocaleString('vi-VN') : (a.settings_json?.openAt ? new Date(a.settings_json.openAt).toLocaleString('vi-VN') : "Ngay lập tức")}
                                            </Td>
                                            <Td className="text-sm">
                                                <div className="flex flex-col">
                                                    <span className={isExpired(a.due_at) ? "text-red-500 font-bold" : "text-slate-600"}>
                                                        {a.due_at ? new Date(a.due_at).toLocaleString('vi-VN') : "Không có hạn"}
                                                    </span>
                                                    {isExpired(a.due_at) && (
                                                        <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5 mt-0.5">
                                                            <AlertTriangle size={10} /> Đã hết hạn
                                                        </span>
                                                    )}
                                                </div>
                                            </Td>
                                            <Td><Badge tone="amber">{a.max_score || 100}</Badge></Td>
                                            <Td>
                                                <Badge tone={a.status === 'published' ? 'green' : 'slate'}>
                                                    {a.status === 'published' ? 'Đã công bố' : 'Bản nháp'}
                                                </Badge>
                                            </Td>
                                            <Td className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {a.status !== 'published' && a.type?.toUpperCase() === 'ESSAY' && (
                                                        <Button
                                                            size="xs"
                                                            variant="outline"
                                                            className="text-emerald-600 border-emerald-200"
                                                            onClick={() => onQuickPublish(a)}
                                                        >
                                                            Công bố
                                                        </Button>
                                                    )}
                                                    {a.status === 'draft' && a.type?.toUpperCase() === 'QUIZ' && (
                                                        <Button
                                                            size="xs"
                                                            variant="outline"
                                                            className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                                                            onClick={() => onQuizPublish(a)}
                                                        >
                                                            <Send size={14} className="mr-1" />
                                                            Công bố
                                                        </Button>
                                                    )}

                                                    <Button size="xs" variant="outline" onClick={() => handleEditClick(a)}>
                                                        Sửa
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="danger"
                                                        className={`bg-red-50 text-red-600 hover:bg-red-600 hover:text-white ${a.submissionCount > 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                        onClick={() => a.submissionCount > 0 ? alert("Không thể xóa bài tập đã có học sinh làm bài.") : onDelete(a.id)}
                                                        title={a.submissionCount > 0 ? "Không thể xóa bài tập đã có học sinh làm bài" : "Xóa bài tập"}
                                                    >
                                                        Xóa
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        className={`border-blue-200 text-blue-600 hover:bg-blue-50 ${a.status === 'closed' ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                        onClick={() => {
                                                            if (a.status === 'closed') return;
                                                            setAssessmentToShare(a);
                                                            setIsShareModalOpen(true);
                                                        }}
                                                        title={a.status === 'closed' ? "Không thể chia sẻ bài tập đã đóng" : "Chia sẻ bài tập"}
                                                    >
                                                        <Share2 className="w-3 h-3 mr-1" />
                                                        Chia sẻ
                                                    </Button>
                                                    {a.status !== 'published' && a.type?.toUpperCase() === 'QUIZ' && (
                                                        <Button
                                                            size="xs"
                                                            className={a.status === 'published' ? "bg-slate-800 text-white hover:bg-black" : "bg-blue-600 text-white hover:bg-blue-700"}
                                                            onClick={() => {
                                                                const qId = a.id || a._id;
                                                                if (!qId || qId === "undefined") {
                                                                    alert("Không tìm thấy ID bài tập. Vui lòng tải lại trang.");
                                                                    return;
                                                                }
                                                                navigate(`/teacher/classes/${classId}/quizzes/${qId}/questions`, { state: { quiz: a } });
                                                            }}
                                                        >
                                                            Soạn đề
                                                        </Button>
                                                    )}
                                                </div>
                                            </Td>
                                        </tr>
                                    )) : <tr><Td colSpan="5" className="text-center text-slate-400 py-10">Lớp chưa có bài tập nào.</Td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <ShareAssessmentModal
                open={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                assessment={assessmentToShare}
                currentClassId={classId}
            />
        </div>
    );
}