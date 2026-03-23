import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Badge } from "component/ui";
import { ChevronLeft, RefreshCw, CheckCircle2, XCircle, Info, MessageSquare } from "lucide-react";
import { studentApi } from "service/studentApi";
import { toast } from "sonner";

export default function StudentQuizReview() {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await studentApi.getSubmissionReview(submissionId);
            const result = res.data;
            if (result && (result.success || result.status === "success") && result.data?.questions) {
                const apiData = result.data;
                const mappedData = {
                    submission: {
                        ...apiData.submission,
                        Assessment: apiData.quiz,
                        final_score: apiData.grade?.final_score ?? "---"
                    },
                    questions: (apiData.questions || []).map(q => ({
                        id: q.question_id,
                        is_correct: q.is_correct,
                        points_awarded: q.score,
                        max_points: q.max_points,
                        content: q.question_text,
                        options: (q.options || []).map(opt => ({
                            id: opt.id,
                            content: opt.option_text,
                            is_correct: opt.is_correct
                        })),
                        user_answer: q.selected_option_id,
                        teacher_comment: q.teacher_comment,
                        is_gradable: true
                    }))
                };
                setData(mappedData);
            } else {
                toast.error("Không thể tải chi tiết bài làm");
            }
        } catch (error) {
            console.error("Error fetching submission review:", error);
            toast.error("Lỗi kết nối máy chủ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (submissionId) fetchData();
    }, [submissionId]);

    if (loading && !data) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-slate-500 font-medium">Đang tải chi tiết...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center text-slate-500">Không tìm thấy dữ liệu bài làm.</div>;

    const { submission, questions } = data;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <PageHeader 
                title="Xem lại bài làm" 
                subtitle={`Bài: ${submission.Assessment?.title}`}
                right={
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Quay lại
                    </Button>
                }
            />

            {/* Overview Card */}
            <Card className="bg-white shadow-sm border-slate-200">
                <CardContent className="p-6">
                    <div className="flex flex-wrap justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div>
                                <h3 className="font-bold text-slate-900">Kết quả của bạn</h3>
                            </div>
                        </div>

                        <div className="flex gap-8">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Thời gian làm</p>
                                <p className="font-semibold text-slate-900">
                                    {submission.duration_minutes ? `${submission.duration_minutes} phút` : "--"}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Nộp lúc</p>
                                <p className="font-semibold text-slate-900">
                                    {submission.submitted_at ? new Date(submission.submitted_at).toLocaleTimeString('vi-VN') + " " + new Date(submission.submitted_at).toLocaleDateString('vi-VN') : "--"}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 text-blue-600">Tổng điểm</p>
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-2xl font-black text-blue-700">{submission.final_score}</span>
                                    <span className="text-sm text-slate-400 font-medium">/ {submission.Assessment?.max_score}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Questions Review */}
            <div className="space-y-6 pb-12">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Info className="h-5 w-5 text-indigo-500" />
                    Chi tiết từng câu hỏi
                </h4>

                {(Array.isArray(questions) ? questions : []).map((q, idx) => {
                    const isCorrect = q.is_gradable ? q.is_correct : null;
                    const statusColor = isCorrect === true ? "bg-emerald-50 border-emerald-200" : isCorrect === false ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200";
                    const statusIcon = isCorrect === true ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : isCorrect === false ? <XCircle className="h-5 w-5 text-rose-600" /> : null;

                    return (
                        <Card key={q.id} className={`overflow-hidden border-l-4 ${isCorrect === true ? 'border-l-emerald-500' : isCorrect === false ? 'border-l-rose-500' : 'border-l-slate-400'}`}>
                            <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between py-3">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    Câu hỏi {idx + 1}
                                </CardTitle>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-sm font-bold">
                                        <span>{q.points_awarded ?? 0}</span>
                                        <span className="text-slate-400">/ {q.max_points} điểm</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="text-slate-900 font-medium mb-4 whitespace-pre-wrap">
                                    {q.content}
                                </div>

                                <div className="grid gap-3 mb-6">
                                    {q.options?.map(opt => {
                                        const isStudentChoice = q.user_answer === opt.id || (Array.isArray(q.user_answer) && q.user_answer.includes(opt.id));
                                        const isCorrectOpt = opt.is_correct;
                                        
                                        let optCls = "flex items-center gap-3 p-3 rounded-lg border text-sm transition-all ";
                                        if (isCorrectOpt) {
                                            optCls += "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300 text-emerald-900";
                                        } else if (isStudentChoice && !isCorrectOpt) {
                                            optCls += "bg-rose-50 border-rose-300 text-rose-900";
                                        } else {
                                            optCls += "bg-white border-slate-200 text-slate-700 opacity-80";
                                        }

                                        return (
                                            <div key={opt.id} className={optCls}>
                                                <div className="shrink-0 h-5 w-5">
                                                    {isCorrectOpt && <CheckCircle2 className="h-5 w-5" />}
                                                    {!isCorrectOpt && isStudentChoice && <XCircle className="h-5 w-5" />}
                                                </div>
                                                <div className="flex-1">{opt.content}</div>
                                                {isStudentChoice && (
                                                    <Badge tone={isCorrectOpt ? 'green' : 'red'} className="ml-auto uppercase text-[10px]">Lựa chọn</Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {q.teacher_comment && (
                                    <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                                        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase mb-2">
                                            <MessageSquare className="h-3 w-3" /> Ghi chú giáo viên
                                        </div>
                                        <p className="text-sm text-amber-900">
                                            {q.teacher_comment}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
