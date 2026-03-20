// src/component/pages/teacher/GradingPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Table, Th, Td, Badge, Button } from "component/ui";

export default function GradingPage() {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("needs_grading"); // needs_grading / graded

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("smartedu_token");
                const res = await fetch("http://localhost:9999/api/teacher/grading/overview", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) {
                    setAssessments(result.data || []);
                }
            } catch (error) {
                console.error("Lỗi lấy tổng quan chấm điểm:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Lọc theo Tab
    const filteredList = assessments.filter(a => {
        if (activeTab === 'needs_grading') {
            return a.needsGradingCount > 0;
        } else {
            return a.gradedCount > 0;
        }
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quản lý chấm điểm"
                subtitle="Xem danh sách bài nộp chờ chấm và các bài đã được chấm điểm."
            />

            {/* Tabs Phân loại */}
            <div className="flex gap-2 border-b border-slate-200 pb-0">
                <button
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'needs_grading' ? 'border-b-blue-600 text-blue-600 bg-white' : 'border-b-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    onClick={() => setActiveTab('needs_grading')}
                >
                    Chờ chấm {assessments.some(a => a.needsGradingCount > 0)}
                </button>
                <button
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'graded' ? 'border-b-blue-600 text-blue-600 bg-white' : 'border-b-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    onClick={() => setActiveTab('graded')}
                >
                    Đã chấm Điểm
                </button>
            </div>

            <Card className="overflow-hidden border-t-0 rounded-t-none">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr className="bg-slate-50">
                                    <Th className="w-1/3">Tên Bài tập / Quiz</Th>
                                    <Th>Lớp học</Th>
                                    <Th>Loại</Th>
                                    <Th className="text-center">{activeTab === 'needs_grading' ? "Bài chờ chấm" : "Bài đã chấm"}</Th>
                                    <Th className="text-right">Thao tác</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <Td colSpan="5" className="text-center py-12 text-slate-500 font-medium">
                                            <div className="animate-pulse">Đang tải danh sách...</div>
                                        </Td>
                                    </tr>
                                ) : filteredList.length > 0 ? (
                                    filteredList.map((g) => (
                                        <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                                            <Td className="font-bold text-slate-900">{g.title}</Td>
                                            <Td className="text-sm text-slate-600">{g.className || "---"}</Td>
                                            <Td>
                                                <Badge tone={g.type === 'QUIZ' ? 'blue' : 'indigo'}>
                                                    {g.type === 'QUIZ' ? 'Quiz' : 'Tự luận'}
                                                </Badge>
                                            </Td>
                                            <Td className="text-center">
                                                {activeTab === 'needs_grading' ? (
                                                    <Badge tone="amber" className="font-bold">{g.needsGradingCount} bài nộp</Badge>
                                                ) : (
                                                    <Badge tone="green" className="font-bold">{g.gradedCount} bài đã chấm</Badge>
                                                )}
                                            </Td>
                                            <Td className="text-right">
                                                <Button
                                                    size="sm"
                                                    className={g.type === 'QUIZ' ? "bg-purple-600 hover:bg-purple-700 text-white font-semibold" : "bg-blue-600 hover:bg-blue-700 text-white font-semibold"}
                                                    onClick={() => {
                                                        if (g.type === 'QUIZ') {
                                                            navigate(`/teacher/assessments/${g.id}/quiz-attempts`);
                                                        } else {
                                                            navigate(`/teacher/assessments/${g.id}/submissions`);
                                                        }
                                                    }}
                                                >
                                                    {activeTab === 'needs_grading' ? "Chấm bài" : "Xem điểm"}
                                                </Button>
                                            </Td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <Td colSpan="5" className="text-center py-16 text-slate-400 italic">
                                            {activeTab === 'needs_grading'
                                                ? "🎉 Tuyệt vời! Bạn đã chấm hết toàn bộ bài nộp."
                                                : "Chưa có bài tập nào có điểm được chấm."}
                                        </Td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}