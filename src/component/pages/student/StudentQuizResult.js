import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, PageHeader, Button } from "component/ui";

function formatTime(secs) {
    if (secs === null || secs === undefined) return "--:--:--";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StudentQuizResult() {
    const nav = useNavigate();
    const location = useLocation();
    const result = location.state?.result || {};
    const isSuccess = location.state?.success !== false;

    const totalScore = result.totalScore;
    const maxScore = result.maxScore;
    const isPublished = result.isPublished;
    const message = result.message || "";
    const errorMsg = location.state?.errorMessage || "";
    const timeTakenSeconds = result.timeTakenSeconds;

    // Calculate percentage for the progress ring
    const percentage = (isPublished && totalScore != null && maxScore)
        ? Math.round((totalScore / maxScore) * 100)
        : null;

    const getGradeColor = (pct) => {
        if (pct >= 80) return { ring: "text-green-500", bg: "bg-green-50", badge: "bg-green-100 text-green-700", label: "Xuất sắc" };
        if (pct >= 60) return { ring: "text-blue-500", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700", label: "Tốt" };
        if (pct >= 40) return { ring: "text-amber-500", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700", label: "Trung bình" };
        return { ring: "text-red-500", bg: "bg-red-50", badge: "bg-red-100 text-red-700", label: "Cần cố gắng" };
    };

    // ─── FAILURE SCREEN ───
    if (!isSuccess) {
        return (
            <div className="max-w-lg mx-auto py-12">
                <Card className="border-red-200 shadow-xl">
                    <CardContent className="p-10 text-center">
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-2xl font-black text-red-600 mb-3">Nộp bài thất bại</h2>
                        <p className="text-slate-600 mb-6 leading-relaxed">
                            {errorMsg || "Đã xảy ra lỗi khi nộp bài. Vui lòng thử lại hoặc liên hệ giáo viên."}
                        </p>
                        <div className="flex justify-center gap-3">
                            <Button variant="outline" onClick={() => nav(-1)}>
                                ← Quay lại
                            </Button>
                            <Button variant="primary" onClick={() => nav("/student/grades")}>
                                Xem bảng điểm
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── SUCCESS SCREEN ───
    const grade = percentage !== null ? getGradeColor(percentage) : null;

    return (
        <div className="max-w-lg mx-auto py-12">
            <Card className="border-green-200 shadow-xl overflow-hidden">
                {/* Success Header */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-10 text-center text-white">
                    <div className="text-6xl mb-3">🎉</div>
                    <h2 className="text-2xl font-black">Nộp bài thành công!</h2>
                    <p className="text-green-100 mt-2 text-sm">Bài làm của bạn đã được ghi nhận.</p>
                </div>

                <CardContent className="p-8 space-y-6">
                    {/* Score Display */}
                    {isPublished && totalScore != null && maxScore != null ? (
                        <div className="text-center space-y-4">
                            {/* Circular-ish Score Display */}
                            <div className={`mx-auto w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 ${grade?.ring?.replace('text-', 'border-')} ${grade?.bg}`}>
                                <div className={`text-4xl font-black ${grade?.ring}`}>{totalScore}</div>
                                <div className="text-sm text-slate-500 font-semibold">/ {maxScore}</div>
                            </div>
                            {percentage !== null && (
                                <div className="space-y-2">
                                    <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${grade?.badge}`}>
                                        {percentage}% — {grade?.label}
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${grade?.ring?.replace('text-', 'bg-')}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {timeTakenSeconds != null && (
                                <div className="text-sm font-bold text-slate-600 mt-4 border-t pt-4">
                                    Thời gian làm bài: <span className="text-blue-600 font-black">{formatTime(timeTakenSeconds)}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center bg-amber-50 border border-amber-200 rounded-xl p-5">
                            <div className="text-xl mb-1">⏳</div>
                            <div className="font-bold text-amber-800 text-sm">Điểm sẽ được công bố sau</div>
                            <div className="text-xs text-amber-600 mt-1">
                                {message || "Giáo viên sẽ công bố điểm khi đóng đề thi."}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-2">
                        {result.submissionId && (
                            <Button
                                variant="primary"
                                className="w-full py-3 text-base"
                                onClick={() => nav(`/student/attempts/${result.submissionId}/review`)}
                            >
                                Xem chi tiết bài làm
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => nav("/student/grades")}
                        >
                            Xem bảng điểm
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full text-slate-500"
                            onClick={() => nav("/student")}
                        >
                            Về trang chủ
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
