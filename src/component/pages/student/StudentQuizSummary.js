import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAttemptSummary, submitAttempt } from "service/StudentQuizService";
import { Button, Card, CardContent, PageHeader } from "component/ui";

export default function StudentQuizSummary() {
    const { submissionId } = useParams();
    const nav = useNavigate();
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await getAttemptSummary(submissionId);
                const data = res?.data || res;
                setSummary(data.questions || []); // array c?a { idx, status: 'answered' | 'not_yet_answered' }
            } catch (err) {
                console.error(err);
                setError("Lỗi lấy thông tin bài làm.");
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [submissionId]);

    const handleSubmit = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn nộp bài? Hành động này không thể hoàn tác.")) {
            return;
        }

        setSubmitting(true);
        setError("");
        
        try {
            await submitAttempt(submissionId);
            alert("Nộp bài thành công!");
            nav("/student/grades"); // Quay v? menu l?p ho?c b?ng i?m sau submit
        } catch (err) {
            setError(err?.body?.message || err?.message || "Lỗi nộp bài, vui lòng thử lại.");
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Đang tải tóm tắt bài làm...</div>;

    const answeredCount = summary.filter((q) => q.answered).length;
    const totalCount = summary.length;

    return (
        <div className="max-w-4xl mx-auto py-8">
            <PageHeader title="Tóm tắt bài làm" />
            
            <Card className="mt-6">
                <CardContent className="p-6">
                    <div className="mb-6 rounded bg-slate-50 p-4 border border-slate-200">
                        <div className="text-lg font-semibold text-slate-900 mb-2">Trạng thái bài kiểm tra</div>
                        <div className="text-sm text-slate-700">
                            Bạn đã trả lời <b>{answeredCount}</b> trên tổng số <b>{totalCount}</b> câu hỏi.
                        </div>
                    </div>

                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 text-sm">
                        {summary.map((q, idx) => (
                            <div key={q.id || idx} className={`p-3 rounded border text-center ${q.answered ? "border-green-300 bg-green-50 text-green-700 font-medium" : "border-red-300 bg-red-50 text-red-700 font-medium"}`}>
                                <div className="mb-1 text-xs text-slate-500 font-bold uppercase tracking-wider">Câu {idx + 1}</div>
                                {q.answered ? "Đã trả lời" : "Chưa trả lời"}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="mt-8 flex justify-center gap-4 border-t pt-6 border-slate-200">
                        <Button variant="outline" onClick={() => nav(`/student/attempts/${submissionId}/take`)} disabled={submitting}>
                            Sửa lại đáp án
                        </Button>
                        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? "Đang nộp..." : "Nộp bài và kết thúc"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
