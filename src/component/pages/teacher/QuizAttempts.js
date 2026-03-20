import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Table, Th, Td, Badge, Input, Modal } from "component/ui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { ChevronLeft, RefreshCw, Trash2, Eye, Search, Filter, BarChart3, Users as UsersIcon } from "lucide-react";
import * as TeacherQuizService from "service/TeacherQuizService";
import { toast } from "sonner";

export default function QuizAttempts() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState({
        assessment: null,
        attempts: [],
        scoreDistribution: []
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isRegrading, setIsRegrading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await TeacherQuizService.getQuizAttempts(assessmentId);
            if (res.success) {
                setData(res.data);
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
                subtitle={data.assessment?.title || "Duyệt điểm sinh viên"}
                right={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Quay lại
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
                                <span>Hoàn thành: {(data.attempts || []).filter(a => a.status === 'completed').length}</span>
                                <span>Đang làm: {(data.attempts || []).filter(a => a.status === 'in_progress').length}</span>
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
                                <option value="completed">Đã nộp</option>
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
                                        <Th>Bắt đầu</Th>
                                        <Th>Nộp bài</Th>
                                        <Th>Thời gian</Th>
                                        <Th>Điểm</Th>
                                        <Th className="text-right">Hành động</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAttempts.length > 0 ? (
                                        filteredAttempts.map((attempt) => (
                                            <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                                                <Td>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{attempt.Student?.full_name}</div>
                                                        <div className="text-xs text-slate-500">{attempt.Student?.email}</div>
                                                    </div>
                                                </Td>
                                                <Td className="text-xs text-slate-600">
                                                    {new Date(attempt.started_at).toLocaleString('vi-VN')}
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
                                                        </span>
                                                        <span className="text-xs text-slate-400">/ {data.assessment?.max_score}</span>
                                                    </div>
                                                </Td>
                                                <Td className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button 
                                                            size="sm" variant="ghost" className="h-8 w-8 p-0"
                                                            title="Xem chi tiết"
                                                            onClick={() => navigate(`/teacher/quiz-attempts/${attempt.id}/review`)}
                                                            disabled={attempt.status !== 'completed'}
                                                        >
                                                            <Eye className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                        <Button 
                                                            size="sm" variant="ghost" className="h-8 w-8 p-0"
                                                            title="Xóa lượt làm"
                                                            onClick={() => handleDeleteAttempt(attempt.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-rose-500" />
                                                        </Button>
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
