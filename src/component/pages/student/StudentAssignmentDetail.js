import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge } from "component/ui";
import { ClipboardList, Clock, Repeat, CheckCircle2, PlayCircle } from "lucide-react";

export default function StudentAssignmentDetail() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();

    const [assessment, setAssessment] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [isEditing, setIsEditing] = useState(false); 
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("smartedu_token");
            const res = await fetch(`http://localhost:9999/api/student/assessments/${assessmentId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setAssessment(result.data.assessment);
                setSubmission(result.data.submission);
            }
        } catch (error) {
            console.error("Lỗi lấy chi tiết bài tập:", error);
        }
    };

    useEffect(() => {
        if (assessmentId) fetchData();
    }, [assessmentId]);

    // HÀM TẢI FILE THÔNG MINH (Xử lý cho PDF, Ảnh, Docx,...)
    const handleDownload = async (fileUrl, originalName) => {
        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Xử lý đuôi file: Nếu tên gốc thiếu đuôi, lấy đuôi từ link Cloudinary
            let finalName = originalName || "document";
            if (!finalName.includes('.')) {
                const ext = fileUrl.split('.').pop().split(/[?#]/)[0]; 
                const validExts = ['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'zip', 'rar'];
                const extension = validExts.includes(ext.toLowerCase()) ? ext.toLowerCase() : 'bin';
                finalName = `${finalName}.${extension}`;
            }

            link.setAttribute('download', finalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            window.open(fileUrl, '_blank');
        }
    };

    const getTimeRemaining = (targetDate) => {
        if (!targetDate) return "-";
        const now = new Date();
        const target = new Date(targetDate);
        const diff = target - now;
        if (diff < 0) return "Đã hết hạn";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        return `${days > 0 ? `${days} ngày ` : ''}${hours} giờ`;
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            setMessage({ type: "error", text: "Vui lòng chọn ít nhất một file để nộp." });
            return;
        }
        setIsLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("smartedu_token");
            let uploadedFileUrls = [];
            const uploadFormData = new FormData();
            selectedFiles.forEach(file => uploadFormData.append("files", file));
            
            const uploadRes = await fetch("http://localhost:9999/api/upload", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: uploadFormData
            });
            const uploadData = await uploadRes.json();
            if (uploadData.success) {
                uploadedFileUrls = uploadData.data;
            } else {
                throw new Error(uploadData.message || "Lỗi khi tải file lên.");
            }

            const res = await fetch(`http://localhost:9999/api/student/assessments/${assessmentId}/submit`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ files: uploadedFileUrls })
            });
            
            const result = await res.json();
            if (result.success) {
                setMessage({ type: "success", text: "Nộp bài thành công!" });
                setIsEditing(false);
                setSelectedFiles([]);
                fetchData();
            } else {
                setMessage({ type: "error", text: result.message });
            }
        } catch (error) {
            setMessage({ type: "error", text: error.message || "Lỗi kết nối máy chủ." });
        } finally {
            setIsLoading(false);
        }
    };

    if (!assessment) return <div className="p-10 text-center text-slate-500">Đang tải dữ liệu bài tập...</div>;

    const now = new Date();
    const isPastCutoff = assessment.cutoff_at && now > new Date(assessment.cutoff_at);
    const isQuiz = assessment.type === 'QUIZ';

    // ─── QUIZ TYPE: Redirect to quiz flow ───
    if (isQuiz) {
        const hasInProgress = submission?.status === 'in_progress';
        const hasFinished = submission?.status === 'submitted' || submission?.status === 'graded';
        const settings = (() => {
            try {
                const marker = '[quiz_settings]';
                const idx = (assessment.instructions || '').lastIndexOf(marker);
                if (idx === -1) return {};
                return JSON.parse(assessment.instructions.slice(idx + marker.length).trim());
            } catch { return {}; }
        })();

        return (
            <div className="space-y-6">
                <PageHeader
                    title={assessment.title}
                    subtitle={`Bài kiểm tra trắc nghiệm`}
                    right={[<Button key="back" variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>]}
                />
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left: Quiz Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-blue-600" /> Thông tin bài kiểm tra
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {assessment.time_limit_minutes && (
                                        <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4">
                                            <Clock className="h-6 w-6 text-blue-600 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-blue-500 uppercase">Thời gian</div>
                                                <div className="font-bold text-slate-900">{assessment.time_limit_minutes} phút</div>
                                            </div>
                                        </div>
                                    )}
                                    {assessment.attempt_limit != null && (
                                        <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-4">
                                            <Repeat className="h-6 w-6 text-purple-600 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-purple-500 uppercase">Số lần làm</div>
                                                <div className="font-bold text-slate-900">{assessment.attempt_limit} lần</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {assessment.instructions && !assessment.instructions.includes('[quiz_settings]') && (
                                    <div className="mt-4 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed border-t pt-4">
                                        {assessment.instructions}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Submission history */}
                        {hasFinished && submission && (
                            <Card className="border-green-200">
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5" /> Kết quả bài làm
                                    </h3>
                                    <div className="text-sm text-slate-600 space-y-2">
                                        <div>Lần làm: <b>#{submission.attempt_no || 1}</b></div>
                                        {submission.submitted_at && (
                                            <div>Nộp lúc: <b>{new Date(submission.submitted_at).toLocaleString('vi-VN')}</b></div>
                                        )}
                                        {submission.grade?.is_published && submission.grade?.final_score != null && (
                                            <div className="text-lg font-black text-green-700">Điểm: {submission.grade.final_score} / {assessment.max_score}</div>
                                        )}
                                        {!submission.grade?.is_published && (
                                            <div className="text-amber-600 font-semibold">Điểm chưa được công bố.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right: Action area */}
                    <div className="space-y-4">
                        <Card className="overflow-hidden">
                            <div className="bg-slate-900 px-4 py-3 text-white font-bold text-sm">Trạng thái</div>
                            <CardContent className="p-4 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Hạn nộp</span>
                                    <span className="font-semibold">{assessment.due_at ? new Date(assessment.due_at).toLocaleString('vi-VN') : '---'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Trạng thái</span>
                                    <span>
                                        {hasInProgress ? <Badge tone="blue">Đang làm</Badge>
                                            : hasFinished ? <Badge tone="green">Đã nộp</Badge>
                                            : <Badge tone="slate">Chưa bắt đầu</Badge>}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CTA */}
                        {!isPastCutoff && (
                            <>
                                {hasInProgress && submission?.id ? (
                                    <Button
                                        className="w-full py-5 text-base font-bold"
                                        variant="primary"
                                        onClick={() => navigate(`/student/attempts/${submission.id}/take`)}
                                    >
                                        <PlayCircle className="h-5 w-5 mr-2" /> Tiếp tục làm bài
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full py-5 text-base font-bold"
                                        variant="primary"
                                        onClick={() => navigate(`/student/quizzes/${assessmentId}/start`)}
                                    >
                                        <PlayCircle className="h-5 w-5 mr-2" />
                                        {hasFinished ? 'Làm lại bài' : 'Bắt đầu làm bài'}
                                    </Button>
                                )}
                            </>
                        )}
                        {isPastCutoff && (
                            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 font-semibold text-center">
                                Đã hết hạn nộp bài.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title={assessment.title} 
                subtitle={`Môn học: ${assessment.Course?.name || "SmartEdu Course"}`} 
                right={[<Button key="back" variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>]}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* KHỐI 1: YÊU CẦU ĐỀ BÀI */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                Yêu cầu & Hướng dẫn
                            </h3>
                            <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed border-t pt-4 mb-6">
                                {assessment.instructions || "Giảng viên không có hướng dẫn thêm cho bài tập này."}
                            </div>

                            {assessment.files && assessment.files.length > 0 && (
                                <div className="mt-6 border-t pt-4">
                                    <h4 className="text-sm font-bold text-slate-700 mb-3 text-blue-600 uppercase tracking-wider">Tài liệu đính kèm:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {assessment.files.map((file) => (
                                            <button 
                                                key={file.id}
                                                onClick={() => handleDownload(file.file_url, file.original_name)}
                                                className="flex items-center text-left gap-3 p-3 rounded-xl border border-blue-50 bg-blue-50/20 hover:bg-blue-50 hover:border-blue-200 transition-all group w-full"
                                            >
                                                <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
                                                <div className="overflow-hidden">
                                                    <div className="text-sm font-semibold text-blue-700 truncate">
                                                        {file.original_name || "Tài liệu câu hỏi"}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold">BẤM ĐỂ TẢI VỀ</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* KHỐI 2 (MỚI): HIỂN THỊ BÀI ĐÃ NỘP (Chỉ hiện khi có submission và không sửa bài) */}
                    {!isEditing && submission && (
                        <Card className="border-green-200 shadow-sm">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-green-700 mb-4 flex items-center gap-2">
                                    Bài làm đã nộp
                                </h3>
                                {submission.files && submission.files.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-green-100 pt-4">
                                        {submission.files.map((file) => (
                                            <button 
                                                key={file.id}
                                                onClick={() => handleDownload(file.file_url, file.original_name)}
                                                className="flex items-center text-left gap-3 p-3 rounded-xl border border-green-100 bg-green-50/40 hover:bg-green-100 transition-all group w-full"
                                            >
                                                <span className="text-2xl group-hover:scale-110 transition-transform">✅</span>
                                                <div className="overflow-hidden">
                                                    <div className="text-sm font-semibold text-green-800 truncate">
                                                        {file.original_name || "File bài làm"}
                                                    </div>
                                                    <div className="text-[10px] text-green-600 font-bold">BẤM ĐỂ XEM LẠI</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 italic border-t pt-4">
                                        {submission.content_text || "Bạn đã nộp bài nhưng không có file đính kèm."}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* KHỐI 3: FORM NỘP BÀI (Chỉ hiện khi bấm nút Chỉnh sửa / Nộp bài) */}
                    {isEditing && (
                        <Card className="border-blue-200 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <CardContent className="p-8">
                                <form onSubmit={onSubmit} className="space-y-6">
                                    <div className="border-4 border-dashed border-blue-100 rounded-3xl p-12 text-center bg-blue-50/30 hover:bg-blue-50 transition-all relative group">
                                        <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        <div className="text-blue-700 font-bold text-xl">Kéo thả file bài làm vào đây</div>
                                        <p className="text-slate-500 mt-2">PDF, DOCX, ZIP, PNG, JPG (Tối đa 50MB)</p>
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">File đã chọn:</p>
                                            {selectedFiles.map((f, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm text-slate-700 py-1 border-b last:border-0">
                                                    <span>📄 {f.name}</span>
                                                    <span className="text-xs text-slate-400">{(f.size/1024/1024).toFixed(2)} MB</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3">
                                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Hủy bỏ</Button>
                                        <Button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-8">
                                            {isLoading ? "Đang xử lý..." : "Xác nhận nộp bài"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="overflow-hidden border-slate-200">
                        <div className="bg-slate-900 px-4 py-3 text-white font-bold text-sm">Trạng thái bài làm</div>
                        <CardContent className="p-0">
                            <Table>
                                <tbody>
                                    <tr className="border-b">
                                        <Th className="bg-slate-50 text-slate-600 text-xs uppercase">Trạng thái</Th>
<Td>
    {!submission ? (
        <Badge tone="slate">Chưa nộp</Badge>
    ) : (submission.status === 'submitted_late' || (assessment.due_at && new Date(submission.submitted_at) > new Date(assessment.due_at))) ? (
        <Badge tone="amber">Nộp muộn</Badge>
    ) : (
        <Badge tone="green">Đã nộp</Badge>
    )}
</Td>
                                    </tr>
                                    <tr className="border-b">
                                        <Th className="bg-slate-50 text-slate-600 text-xs uppercase">Điểm số</Th>
                                        <Td className="font-bold text-blue-700">
                                            {submission?.grade?.final_score !== undefined && submission?.grade?.final_score !== null
                                                ? `${submission.grade.final_score} / ${assessment.max_score}` 
                                                : "Chưa có điểm"}
                                        </Td>
                                    </tr>
                                    <tr className="border-b">
                                        <Th className="bg-slate-50 text-slate-600 text-xs uppercase">Hạn cuối</Th>
                                        <Td className="text-slate-700 text-xs font-medium">
                                            {assessment.due_at ? new Date(assessment.due_at).toLocaleString('vi-VN') : "---"}
                                        </Td>
                                    </tr>
                                    <tr>
                                        <Th className="bg-slate-50 text-slate-600 text-xs uppercase">Thời gian</Th>
                                        <Td className="text-xs italic">
                                            {submission ? `Nộp lúc: ${new Date(submission.submitted_at).toLocaleString('vi-VN')}` : getTimeRemaining(assessment.due_at)}
                                        </Td>
                                    </tr>
                                </tbody>
                            </Table>
                        </CardContent>
                    </Card>
{/* KHỐI 4: NÚT NỘP / SỬA BÀI */}
                    {message && (
                        <div className={`p-4 rounded-xl text-sm font-semibold border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                            {message.type === 'error' ? '❌' : '✅'} {message.text}
                        </div>
                    )}

                    {/* ĐÃ CẬP NHẬT: Thêm điều kiện kiểm tra trạng thái 'graded' */}
                    {!isEditing && !isPastCutoff && (!submission || submission.status !== 'graded') && (
                        <Button 
                            className="w-full bg-blue-600 text-white py-6 text-lg font-bold rounded-2xl shadow-blue-200 shadow-xl hover:bg-blue-700 transition-all hover:-translate-y-1"
                            onClick={() => setIsEditing(true)}
                        >
                            {submission ? "Chỉnh sửa bài nộp" : "Nộp bài ngay"}
                        </Button>
                    )}

                    {/* CẢNH BÁO: Hiển thị nếu đã quá hạn hoặc bài đã được chấm */}
                    {!isEditing && (
                        <>
                            {isPastCutoff && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm font-semibold text-center rounded-xl border border-red-100">
                                    Hệ thống đã đóng cổng nộp bài.
                                </div>
                            )}
                            {submission && submission.status === 'graded' && !isPastCutoff && (
                                <div className="p-4 bg-green-50 text-green-700 text-sm font-semibold text-center rounded-xl border border-green-100">
                                    Bài làm của bạn đã được chấm điểm. Không thể chỉnh sửa thêm.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}