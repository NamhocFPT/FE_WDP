import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { startAttempt } from "service/StudentQuizService";
import { Button, Card, CardContent, PageHeader } from "component/ui";

export default function StudentQuizStart() {
    const { quizId } = useParams();
    const nav = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [quizInfo, setQuizInfo] = useState(null);
    const [infoLoading, setInfoLoading] = useState(true);

    // Fetch quiz info to get time limit, attempt limit etc. from the class details page
    // We'll get this info after calling startAttempt which returns quiz metadata
    // For now, let's display a generic confirmation and get metadata from the attempt start response

    const handleStart = async () => {
        setLoading(true);
        setError("");

        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen().catch(e => console.warn(e));
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen().catch(e => console.warn(e));
            }
        } catch (e) {
            console.warn("Fullscreen request failed", e);
        }

        try {
            const res = await startAttempt(quizId);
            // res shape: { success, message, statusCode, data: { attempt, quiz, questionPalette } }
            if (!res?.success) {
                setError(res?.message || "Có lỗi xảy ra, vui lòng thử lại.");
                return;
            }
            const submissionId = res?.data?.attempt?.id;
            if (submissionId) {
                nav(`/student/attempts/${submissionId}/take`, {
                    state: {
                        quizInfo: res.data.quiz,
                        remainingSeconds: res.data.attempt.remainingSeconds
                    }
                });
            } else {
                setError("Không lấy được ID bài làm. Vui lòng thử lại.");
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra, vui lòng thử lại.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            <PageHeader title="Bắt đầu bài kiểm tra" />
            
            <Card className="mt-6 shadow-lg border border-slate-200">
                <CardContent className="text-center py-12 px-8">
                    <div className="text-5xl mb-4">📝</div>
                    <h2 className="text-2xl font-bold mb-3 text-slate-900">Bạn đã sẵn sàng?</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                        Hệ thống sẽ tính giờ ngay khi bạn nhấn <strong>"Bắt đầu làm bài"</strong>.
                        Các câu trả lời sẽ được tự động lưu trong suốt quá trình làm bài.
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-8 text-sm space-y-2 max-w-sm mx-auto">
                        <div className="flex items-center gap-2 font-bold text-amber-800">
                            <span>⚠️</span> Lưu ý quan trọng
                        </div>
                        <ul className="text-amber-700 space-y-1 pl-5 list-disc">
                            <li>Thời gian sẽ bắt đầu đếm ngay lập tức.</li>
                            <li>Bài làm được lưu nháp tự động sau mỗi câu trả lời.</li>
                            <li>Khi hết giờ, hệ thống sẽ tự động nộp bài.</li>
                            <li>Nếu bạn thoát, lần vào sau có thể tiếp tục (thời gian vẫn tính).</li>
                        </ul>
                    </div>
                    
                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                            {error}
                        </div>
                    )}
                    
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" onClick={() => nav(-1)} disabled={loading}>
                            Quay lại
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleStart} 
                            disabled={loading}
                            className="px-8"
                        >
                            {loading ? "Đang khởi tạo..." : "Bắt đầu làm bài →"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
