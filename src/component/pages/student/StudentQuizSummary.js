import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAttemptSummary, submitAttempt } from "service/StudentQuizService";
import { Button, Card, CardContent, PageHeader } from "component/ui";

export default function StudentQuizSummary() {
    const { submissionId } = useParams();
    const nav = useNavigate();
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await getAttemptSummary(submissionId);
                // res shape: { success, message, statusCode, data: { attemptId, status, totalQuestions, answeredCount, notAnsweredCount, items } }
                if (!res?.success) {
                    setError(res?.message || "Không thể tải tóm tắt bài làm.");
                    return;
                }
                setSummaryData(res.data);
            } catch (err) {
                console.error("Error fetching summary:", err);
                setError("Không thể tải tóm tắt bài làm. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [submissionId]);

    const handleSubmit = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn nộp bài?\n\nHành động này không thể hoàn tác.")) {
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const res = await submitAttempt(submissionId);
            if (!res?.success) {
                // Navigate to result page with failure
                nav("/student/quiz-result", {
                    state: { 
                        success: false, 
                        errorMessage: res?.message || "Lỗi nộp bài.",
                        assessmentId: res?.data?.assessmentId,
                        classId: res?.data?.classId
                    },
                    replace: true
                });
                return;
            }
            // Navigate to result page with success
            nav("/student/quiz-result", {
                state: { 
                    success: true, 
                    result: res.data,
                    assessmentId: res.data.assessmentId,
                    classId: res.data.classId
                },
                replace: true
            });
        } catch (err) {
            console.error("Lỗi nộp bài trong handleSubmit:", err);
            const msg = err?.response?.data?.message || err?.message || "Lỗi nộp bài. Vui lòng thử lại.";
            try {
                nav("/student/quiz-result", {
                    state: { success: false, errorMessage: msg },
                    replace: true
                });
            } catch (navErr) {
                console.error("Lỗi khi chuyển trang sau khi nộp bài:", navErr);
                alert(msg);
            }
        } finally {
            setSubmitting(false); // Make sure button is clickable again if we didn't unmount
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="text-center space-y-3">
                    <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div>Đang tải tóm tắt bài làm...</div>
                </div>
            </div>
        );
    }

    const items = summaryData?.items || [];
    const answeredCount = summaryData?.answeredCount ?? items.filter(q => q.answered).length;
    const totalCount = summaryData?.totalQuestions ?? items.length;
    const notAnsweredCount = totalCount - answeredCount;

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-6">
            <PageHeader title="Tóm tắt bài làm" />
            
            {/* Status Overview */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-slate-200">
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-black text-slate-900">{totalCount}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Tổng số câu</div>
                    </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-black text-green-600">{answeredCount}</div>
                        <div className="text-xs font-bold text-green-600 uppercase tracking-wider mt-1">Đã trả lời</div>
                    </CardContent>
                </Card>
                <Card className={`${notAnsweredCount > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                    <CardContent className="p-4 text-center">
                        <div className={`text-3xl font-black ${notAnsweredCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>{notAnsweredCount}</div>
                        <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${notAnsweredCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>Chưa trả lời</div>
                    </CardContent>
                </Card>
            </div>

            {/* Question Grid */}
            <Card>
                <CardContent className="p-6">
                    <div className="font-bold text-slate-800 mb-4">Trạng thái từng câu</div>
                    <div className="grid gap-2 grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                        {items.map((q, idx) => (
                            <button
                                key={q.questionId || idx}
                                onClick={() => nav(`/student/attempts/${submissionId}/take`)}
                                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-xs font-bold transition-all hover:shadow-md hover:-translate-y-0.5
                                    ${q.answered
                                        ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                                        : "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                                    }`}
                                title={q.answered ? `Câu ${q.no || idx + 1}: Đã trả lời` : `Câu ${q.no || idx + 1}: Chưa trả lời`}
                            >
                                <span className="text-sm">{q.no || idx + 1}</span>
                                <span className="text-[10px] mt-0.5">
                                    {q.answered ? "✓" : "○"}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 mt-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <div className="h-3 w-3 rounded border-2 border-green-300 bg-green-50"></div>
                            <span>Đã trả lời</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-3 w-3 rounded border-2 border-red-200 bg-red-50"></div>
                            <span>Chưa trả lời</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Warning if unanswered */}
            {notAnsweredCount > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                    ⚠️ Bạn còn <strong>{notAnsweredCount}</strong> câu chưa trả lời. Bạn có thể quay lại để tiếp tục làm.
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 border-t border-slate-200 pt-6">
                <Button
                    variant="outline"
                    onClick={() => nav(`/student/attempts/${submissionId}/take`)}
                    disabled={submitting}
                >
                    ← Quay lại kiểm tra đáp án
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8"
                >
                    {submitting ? "Đang nộp bài..." : "Nộp bài và kết thúc ✓"}
                </Button>
            </div>
        </div>
    );
}
