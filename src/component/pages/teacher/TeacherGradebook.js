import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge, Modal } from "component/ui";
import { Eye, EyeOff, MoreVertical, CheckCircle2, AlertCircle, RefreshCw, ChevronLeft } from "lucide-react";
import * as TeacherQuizService from "service/TeacherQuizService";
import { toast } from "sonner";

export default function TeacherGradebook() {
    const { classId } = useParams();
    const navigate = useNavigate();
    
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [publishModal, setPublishModal] = useState({ open: false, assessment: null });
    const [publishMode, setPublishMode] = useState("graded_only");
    const [processing, setProcessing] = useState(false);

    const fetchAssessments = async () => {
        setLoading(true);
        try {
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

    const handleOpenPublish = (assessment) => {
        setPublishModal({ open: true, assessment });
        setPublishMode("graded_only");
    };

    const handlePublish = async (is_published) => {
        const { assessment } = publishModal;
        setProcessing(true);
        try {
            const payload = {
                is_published,
                publish_mode: is_published ? publishMode : undefined
            };
            const res = await TeacherQuizService.publishGrades(classId, assessment.id, payload);
            if (res.success || res.code === 200) {
                toast.success(is_published ? "Đã công bố điểm thành công" : "Đã ẩn điểm thành công");
                setPublishModal({ open: false, assessment: null });
                fetchAssessments();
            } else {
                toast.error(res.message || "Thao tác thất bại");
            }
        } catch (error) {
            console.error("Publish error:", error);
            if (error?.status === 400) {
                toast.error(error.body?.message || "Chưa có sinh viên nào được chấm điểm để công bố");
            } else {
                toast.error("Lỗi khi cập nhật trạng thái công bố");
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Bảng điểm lớp học" 
                subtitle={`Quản lý trạng thái công bố điểm cho lớp ${classId}`}
                right={
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Quay lại
                    </Button>
                }
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
                                    (Array.isArray(assessments) ? assessments : []).map((a) => (
                                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <Td className="font-bold text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    {!a.is_published && <EyeOff className="h-4 w-4 text-amber-500" title="Đang ẩn với sinh viên" />}
                                                    {a.is_published && <Eye className="h-4 w-4 text-emerald-500" title="Đã công bố" />}
                                                    {a.title}
                                                </div>
                                            </Td>
                                            <Td>
                                                <Badge tone={a.type === 'quiz' ? 'blue' : 'indigo'}>
                                                    {a.type === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}
                                                </Badge>
                                            </Td>
                                            <Td className="text-xs text-slate-600">
                                                {a.due_at ? new Date(a.due_at).toLocaleString('vi-VN') : "---"}
                                            </Td>
                                            <Td className="font-semibold text-slate-700">{a.max_score}</Td>
                                            <Td>
                                                {a.is_published ? (
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
                                                <Button 
                                                    size="sm" 
                                                    variant={a.is_published ? "outline" : "primary"}
                                                    className={a.is_published ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "bg-emerald-600 text-white hover:bg-emerald-700"}
                                                    onClick={() => handleOpenPublish(a)}
                                                >
                                                    {a.is_published ? "Ẩn điểm" : "Công bố điểm"}
                                                </Button>
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
            </Card>

            {/* Publish Confirmation Modal */}
            <Modal 
                open={publishModal.open} 
                title={publishModal.assessment?.is_published ? "Ẩn điểm bài tập" : "Công bố điểm bài tập"} 
                onClose={() => !processing && setPublishModal({ open: false, assessment: null })}
            >
                <div className="space-y-4">
                    {publishModal.assessment?.is_published ? (
                        <>
                            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                                <p className="text-sm text-amber-800">
                                    Xác nhận <b>ẩn điểm</b> bài tập <b>"{publishModal.assessment?.title}"</b>? 
                                    Sinh viên sẽ không còn nhìn thấy điểm số và nhận xét cho đến khi được công bố lại.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="outline" onClick={() => setPublishModal({ open: false, assessment: null })} disabled={processing}>
                                    Hủy bỏ
                                </Button>
                                <Button variant="danger" onClick={() => handlePublish(false)} disabled={processing}>
                                    {processing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Xác nhận Ẩn điểm
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <Eye className="h-6 w-6 text-blue-600 shrink-0" />
                                <p className="text-sm text-blue-800">
                                    Bạn muốn công bố điểm cho bài tập <b>"{publishModal.assessment?.title}"</b>? 
                                    Sau khi công bố, sinh viên có thể xem điểm và nhận xét của mình.
                                </p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <p className="text-sm font-bold text-slate-700">Chọn đối tượng công bố:</p>
                                
                                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input 
                                        type="radio" 
                                        name="publishMode" 
                                        className="mt-1 h-4 w-4 text-blue-600"
                                        checked={publishMode === "graded_only"}
                                        onChange={() => setPublishMode("graded_only")}
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Chỉ những sinh viên đã chấm</p>
                                        <p className="text-xs text-slate-500">Chỉ công bố cho sinh viên đã có điểm thực tế.</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input 
                                        type="radio" 
                                        name="publishMode" 
                                        className="mt-1 h-4 w-4 text-blue-600"
                                        checked={publishMode === "all_students"}
                                        onChange={() => setPublishMode("all_students")}
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Toàn bộ sinh viên trong lớp</p>
                                        <p className="text-xs text-slate-500">Những sinh viên chưa nộp bài sẽ tự động nhận 0 điểm.</p>
                                    </div>
                                </label>
                            </div>

                            {publishMode === "all_students" && (
                                <div className="p-3 bg-red-50 rounded-lg text-xs text-red-700 border border-red-100 flex gap-2 items-start">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span><b>Cảnh báo:</b> Những sinh viên chưa nộp bài sẽ bị tính 0 điểm ngay lập tức.</span>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="outline" onClick={() => setPublishModal({ open: false, assessment: null })} disabled={processing}>
                                    Hủy bỏ
                                </Button>
                                <Button 
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    onClick={() => handlePublish(true)} 
                                    disabled={processing}
                                >
                                    {processing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Xác nhận Công bố
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
