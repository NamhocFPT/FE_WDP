// src/component/pages/teacher/QuizQuestionManager.js
import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { Button, Card, CardContent, PageHeader, Badge } from "component/ui";

export default function QuizQuestionManager() {
    const { classId, quizId } = useParams();
    const location = useLocation();
    const quiz = location.state?.quiz;

    return (
        <div>
            <PageHeader
                title="Quản lý câu hỏi (UC_TEA_09)"
                subtitle={`classId: ${classId} • quizId: ${quizId}`}
                right={[<Button key="add">+ Thêm câu hỏi</Button>]}
            />

            <Card>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Badge tone="amber">draft</Badge>
                        <div className="text-sm font-semibold text-slate-900">
                            {quiz?.id ? `Quiz created: ${quiz.id}` : "Quiz is empty (no questions yet)."}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        Màn này là “placeholder” để bạn tiếp tục UC_TEA_09 (thêm câu hỏi, đáp án, điểm…).
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}