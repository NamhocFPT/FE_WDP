import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { startAttempt } from "service/StudentQuizService";
import { Button, Card, CardContent, PageHeader } from "component/ui";

export default function StudentQuizStart() {
    const { quizId } = useParams();
    const nav = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleStart = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await startAttempt(quizId);
            const submissionId = res?.id || res?.submissionId; // Adjust based on actual API response
            if (submissionId) {
                nav(`/student/attempts/${submissionId}/take`);
            } else {
                throw new Error("Không lấy được ID bài làm");
            }
        } catch (err) {
            setError(err?.body?.message || err?.message || "Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            <PageHeader title="Bắt đầu bài kiểm tra" />
            
            <Card className="mt-6">
                <CardContent className="text-center py-10">
                    <h2 className="text-xl font-bold mb-4">Bạn đã sẵn sàng?</h2>
                    <p className="text-slate-600 mb-8">
                        Bài kiểm tra có giới hạn thời gian. Thời gian sẽ bắt đầu đếm ngược ngay khi bạn nhấn nút Bắt đầu.
                    </p>
                    
                    {error && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
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
                        >
                            {loading ? "Đang tải..." : "Bắt đầu làm bài"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
