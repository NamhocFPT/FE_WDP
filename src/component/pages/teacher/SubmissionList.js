import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge, Input } from "component/ui";

export default function SubmissionList() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    
    const [submissions, setSubmissions] = useState([]);
    const [stats, setStats] = useState({ total: 0, submitted: 0, graded: 0 });
    const [isFetching, setIsFetching] = useState(true);
    const [filter, setFilter] = useState("all"); // all, submitted, graded, pending
    const [searchTerm, setSearchTerm] = useState("");

    const fetchSubmissions = async () => {
        try {
            const token = localStorage.getItem("smartedu_token");
            const res = await fetch(`http://localhost:9999/api/teachers/assessments/${assessmentId}/submissions`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            
            if (result.success) {
                const data = result.data;
                setSubmissions(data);
                
                // THỐNG KÊ LOGIC MỚI
                // Đã nộp bao gồm: nộp đúng hạn, nộp muộn, và đã chấm
                const submittedStatuses = ['submitted', 'submitted_late', 'graded'];
                const submittedCount = data.filter(s => submittedStatuses.includes(s.status)).length;
                
                // Đã chấm bao gồm: status graded HOẶC có điểm thực tế
                const gradedCount = data.filter(s => s.status === 'graded' || (s.grade && s.grade.final_score !== null)).length;
                
                setStats({ 
                    total: data.length, 
                    submitted: submittedCount, 
                    graded: gradedCount 
                });
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách bài nộp:", error);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => { 
        if (assessmentId) fetchSubmissions(); 
    }, [assessmentId]);

    // BỘ LỌC THÔNG MINH
    const filteredData = submissions.filter(s => {
        let statusMatch = true;
        
        if (filter === "submitted") {
            statusMatch = ['submitted', 'submitted_late', 'graded'].includes(s.status);
        }
        if (filter === "pending") {
            // Cần chấm = Đã nộp (đúng hạn/muộn) NHƯNG chưa có điểm
            statusMatch = ['submitted', 'submitted_late'].includes(s.status) && (!s.grade || s.grade.final_score === null || s.grade.final_score === undefined);
        }
        if (filter === "graded") {
            // Đã chấm = Có status graded HOẶC đã có điểm lưu trong db
            statusMatch = s.status === "graded" || (s.grade && s.grade.final_score !== null);
        }
        
        const nameMatch = s.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.student?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        return statusMatch && nameMatch;
    });

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Danh sách bài nộp" 
                subtitle={`Mã bài tập: ${assessmentId.substring(0, 8)}...`}
                right={[
                    <Button key="back" variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>,
                    <Button key="dl" className="bg-slate-800 text-white">Tải xuống tất cả (.zip)</Button>
                ]}
            />

            {/* KHỐI THỐNG KÊ NHANH */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Tổng sinh viên</p>
                        <p className="text-3xl font-black text-blue-700">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-green-600 font-bold uppercase mb-1">Đã nộp bài</p>
                        <p className="text-3xl font-black text-green-700">{stats.submitted}</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-amber-600 font-bold uppercase mb-1">Cần chấm điểm</p>
                        {/* Ngăn hiển thị số âm (Math.max(0, ...)) */}
                        <p className="text-3xl font-black text-amber-700">{Math.max(0, stats.submitted - stats.graded)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* BỘ LỌC VÀ BẢNG DỮ LIỆU */}
            <Card>
                <CardContent className="p-0">
                    <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center bg-slate-50 rounded-t-xl">
                        <div className="flex gap-2">
                            <Button size="sm" variant={filter === 'all' ? 'primary' : 'outline'} onClick={() => setFilter('all')}>Tất cả</Button>
                            <Button size="sm" variant={filter === 'submitted' ? 'primary' : 'outline'} onClick={() => setFilter('submitted')}>Đã nộp</Button>
                            <Button size="sm" variant={filter === 'pending' ? 'primary' : 'outline'} onClick={() => setFilter('pending')}>Cần chấm</Button>
                            <Button size="sm" variant={filter === 'graded' ? 'primary' : 'outline'} onClick={() => setFilter('graded')}>Đã chấm</Button>
                        </div>
                        <Input 
                            placeholder="Tìm tên hoặc email sinh viên..." 
                            className="max-w-xs bg-white" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Sinh viên</Th>
                                    <Th>Trạng thái bài</Th>
                                    <Th>Điểm số</Th>
                                    <Th>Thời gian nộp</Th>
                                    <Th className="text-right">Thao tác</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {isFetching ? (
                                    <tr><Td colSpan="5" className="text-center py-10 text-slate-500">Đang tải dữ liệu bài nộp...</Td></tr>
                                ) : filteredData.length > 0 ? filteredData.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <Td>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-600">
                                                    {s.student?.full_name?.charAt(0) || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{s.student?.full_name || "Unknown User"}</p>
                                                    <p className="text-xs text-slate-500">{s.student?.email || "No email"}</p>
                                                </div>
                                            </div>
                                        </Td>
                                        
                                        {/* TRẠNG THÁI BÀI */}
                                        <Td>
                                            <Badge tone={
                                                s.status === 'graded' ? 'green' : 
                                                s.status === 'submitted_late' ? 'amber' :
                                                s.status === 'submitted' ? 'blue' : 'slate'
                                            }>
                                                {
                                                    s.status === 'graded' ? 'Đã chấm' : 
                                                    s.status === 'submitted_late' ? 'Nộp muộn' :
                                                    s.status === 'submitted' ? 'Chờ chấm' : 'Chưa nộp'
                                                }
                                            </Badge>
                                        </Td>

                                        {/* ĐIỂM SỐ */}
                                        <Td>
                                            <Badge tone={s.grade?.final_score !== undefined && s.grade?.final_score !== null ? 'green' : 'slate'}>
                                                {s.grade?.final_score !== undefined && s.grade?.final_score !== null 
                                                    ? `Điểm: ${s.grade.final_score}` 
                                                    : 'Chưa có điểm'}
                                            </Badge>
                                        </Td>

                                        {/* THỜI GIAN NỘP */}
                                        <Td className="text-xs font-medium text-slate-600">
                                            {s.submitted_at ? new Date(s.submitted_at).toLocaleString('vi-VN') : '-'}
                                        </Td>

                                        {/* NÚT THAO TÁC */}
                                        <Td className="text-right">
                                            <Button 
                                                size="sm" 
                                                className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                                onClick={() => navigate(`/teacher/grading/${s.id}`)}
                                                disabled={!['submitted', 'submitted_late', 'graded'].includes(s.status)}
                                            >
                                                {s.status === 'graded' ? 'Xem / Sửa điểm' : 'Chấm điểm'}
                                            </Button>
                                        </Td>
                                    </tr>
                                )) : (
                                    <tr><Td colSpan="5" className="text-center py-10 text-slate-500">Không tìm thấy sinh viên nào phù hợp.</Td></tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}