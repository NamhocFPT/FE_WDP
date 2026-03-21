import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Table, Th, Td, Badge, Input, Modal, cn } from "component/ui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { ChevronLeft, RefreshCw, Trash2, Eye, Search, Filter, BarChart3, Users as UsersIcon, Download } from "lucide-react";
import * as TeacherQuizService from "service/TeacherQuizService";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function QuizAttempts() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState({
        assessment: null,
        attempts: [],
        scoreDistribution: [],
        summary: {},
        gradeMethod: "highest"
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isRegrading, setIsRegrading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await TeacherQuizService.getQuizAttempts(assessmentId);
            if (res.success && res.data) {
                setData({
                    assessment: res.data.quiz || null,
                    summary: res.data.summary || {},
                    gradeMethod: res.data.grade_method || "highest",
                    attempts: (res.data.attempts || []).map(a => {
                        let rawScore = a.total_score ?? a.grade?.final_score;
                        return {
                            ...a,
                            Student: a.student,
                            final_score: (rawScore !== null && rawScore !== undefined) ? Math.round(Number(rawScore) * 100) / 100 : null
                        };
                    }),
                    scoreDistribution: (res.data.score_distribution || []).map(d => ({
                        ...d,
                        scoreRange: d.label
                    }))
                });
            } else {
                toast.error(res.message || "Không thể tải danh sách lượt làm bài");
            }
        } catch (error) {
            console.error("Error fetching quiz attempts:", error);
            toast.error("Lỗi kết nối máy chủ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (assessmentId) fetchData();
    }, [assessmentId]);

    const handleRegradeAll = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn chấm lại toàn bộ bài làm? Hành động này sẽ cập nhật lại điểm dựa trên đáp án hiện tại.")) return;

        setIsRegrading(true);
        try {
            const res = await TeacherQuizService.regradeAll(assessmentId);
            if (res.success) {
                toast.success("Đã chấm lại toàn bộ thành công");
                fetchData();
            } else {
                toast.error(res.message || "Chấm lại thất bại");
            }
        } catch (error) {
            toast.error("Lỗi khi chấm lại");
        } finally {
            setIsRegrading(false);
        }
    };

    const handleDeleteAttempt = async (submissionId) => {
        if (!window.confirm("Xóa lượt làm bài này? Thao tác này không thể hoàn tác.")) return;

        try {
            const res = await TeacherQuizService.deleteSubmission(submissionId);
            if (res.success) {
                toast.success("Đã xóa lượt làm bài");
                fetchData();
            } else {
                toast.error(res.message || "Xóa thất bại");
            }
        } catch (error) {
            toast.error("Lỗi khi xóa bài làm");
        }
    };

    const filteredAttempts = (data.attempts || []).filter(attempt => {
        const matchesSearch =
            attempt.Student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            attempt.Student?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || attempt.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleExportExcel = () => {
        if (!data.attempts || data.attempts.length === 0) {
            toast.error("Không có dữ liệu để xuất");
            return;
        }

        const exportData = filteredAttempts.map((attempt, index) => ({
            "STT": index + 1,
            "Họ tên": attempt.Student?.full_name || "N/A",
            "Email": attempt.Student?.email || "N/A",
            "Số lượt làm": attempt.attempt_count || 1,
            "Nộp bài lần cuối": attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('vi-VN') : "Chưa nộp",
            "Điểm (Theo cách lấy điểm)": attempt.final_score !== null && attempt.final_score !== undefined ? attempt.final_score : "---",
            "Cách lấy điểm": data.gradeMethod,
            "Trạng thái": attempt.status === 'graded' ? "Đã Làm" : "Chưa làm",
            "Gian lận": attempt.is_cheat ? "CÓ" : "Không"
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);

        const colWidths = [
            { wch: 5 },  // STT
            { wch: 25 }, // Họ tên
            { wch: 30 }, // Email
            { wch: 20 }, // Bắt đầu
            { wch: 20 }, // Nộp bài
            { wch: 20 }, // Thời gian làm bài
            { wch: 15 }, // Điểm
            { wch: 15 }, // Điểm tối đa
            { wch: 15 }, // Trạng thái
        ];
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Danh sách điểm");

        const fileName = `Diem_Quiz_${data.assessment?.title ? data.assessment.title.replace(/[\/\\?%*:|"<>]/g, '-') : 'Quiz'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-bold text-slate-800">Khoảng điểm: {label}</p>
                    <p className="text-blue-600 font-semibold">Số lượng: {payload[0].value} bài</p>
                </div>
            );
        }
        return null;
    };

    if (loading && !data.assessment) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Kết quả Quiz"
                subtitle={
                    <div className="flex items-center gap-2">
                        <span>{data.assessment?.title || "Duyệt điểm sinh viên"}</span>
                        <Badge tone="blue" className="text-[10px] uppercase font-bold py-0.5">
                            Cách lấy điểm: {
                                data.gradeMethod === "highest" ? "Cao nhất" :
                                data.gradeMethod === "last" ? "Lần cuối" :
                                data.gradeMethod === "average" ? "Trung bình" : data.gradeMethod
                            }
                        </Badge>
                    </div>
                }
                right={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Quay lại
                        </Button>
                        <Button
                            variant="outline"
                            className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                            onClick={handleExportExcel}
                        >
                            <Download className="mr-2 h-4 w-4" /> Xuất Excel
                        </Button>
                        <Button
                            className="bg-indigo-600 text-white hover:bg-indigo-700"
                            onClick={handleRegradeAll}
                            disabled={isRegrading}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isRegrading ? 'animate-spin' : ''}`} />
                            {isRegrading ? "Đang chấm lại..." : "Chấm lại tất cả"}
                        </Button>
                    </div>
                }
            />

            {/* Quick Stats & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-indigo-200">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Tổng số lượt làm</p>
                                    <h3 className="text-4xl font-black mt-1">{data.attempts?.length || 0}</h3>
                                </div>
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <UsersIcon className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                                <span>Sinh viên: {data.summary?.unique_students || 0}</span>
                                <span>Tổng lượt: {data.summary?.total_attempts || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-slate-500" /> Phổ điểm
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.scoreDistribution || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="scoreRange"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        />
                                        <YAxis hide />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {(Array.isArray(data.scoreDistribution) ? data.scoreDistribution : []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#4f46e5' : '#e2e8f0'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Danh sách bài làm</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Tìm sinh viên..."
                                    className="pl-9 w-64 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="graded">Đã nộp / Có điểm</option>
                                <option value="in_progress">Đang làm</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Sinh viên</Th>
                                        <Th>Lượt làm</Th>
                                        <Th>Nộp bài gần nhất</Th>
                                        <Th>Thời gian</Th>
                                        <Th>Điểm ({data.gradeMethod === 'average' ? 'Avg' : 'Best'})</Th>
                                        <Th className="text-right">Hành động</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAttempts.length > 0 ? (
                                        filteredAttempts.map((attempt) => (
                                            <tr key={attempt.id} className={cn(
                                                "hover:bg-slate-50 transition-colors",
                                                attempt.is_cheat && "bg-rose-50 hover:bg-rose-100/80"
                                            )}>
                                                <Td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-bold text-slate-900">{attempt.Student?.full_name}</div>
                                                                {attempt.is_cheat && (
                                                                    <Badge tone="red" className="text-[10px] px-1 py-0 h-4 border-rose-200">GIAN LẬN</Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{attempt.Student?.email}</div>
                                                        </div>
                                                    </div>
                                                </Td>
                                                <Td className="text-center font-bold text-indigo-600">
                                                    {attempt.attempt_count || 1}
                                                </Td>
                                                <Td className="text-xs text-slate-600">
                                                    {attempt.submitted_at
                                                        ? new Date(attempt.submitted_at).toLocaleString('vi-VN')
                                                        : <Badge tone="amber">Đang làm</Badge>
                                                    }
                                                </Td>
                                                <Td className="text-xs font-medium">
                                                    {attempt.submitted_at ? (
                                                        Math.ceil((new Date(attempt.submitted_at) - new Date(attempt.started_at)) / 60000) + " phút"
                                                    ) : "-"}
                                                </Td>
                                                <Td>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-bold ${attempt.final_score >= (data.assessment?.max_score / 2) ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {attempt.final_score ?? "---"}
                                                            {attempt.is_average && <span className="text-[10px] ml-1 font-normal opacity-70">(Avg)</span>}
                                                        </span>
                                                        <span className="text-xs text-slate-400">/ {data.assessment?.max_score}</span>
                                                    </div>
                                                </Td>
                                                <Td className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            className="h-8 w-8 flex items-center justify-center rounded text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                                            title="Xem chi tiết"
                                                            onClick={() => navigate(`/teacher/quiz-attempts/${attempt.id}/review`)}
                                                            disabled={attempt.status !== 'graded' && attempt.status !== 'submitted'}
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            className="h-8 w-8 flex items-center justify-center rounded text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
                                                            title="Xóa lượt làm"
                                                            onClick={() => handleDeleteAttempt(attempt.id)}
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </Td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <Td colSpan="6" className="text-center py-12 text-slate-400 italic">
                                                Không có dữ liệu lượt làm bài nào
                                            </Td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
