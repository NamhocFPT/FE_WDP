import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge, Input } from "component/ui";

export default function SubmissionList() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    
    const [assessment, setAssessment] = useState(null); // Thêm state lưu thông tin bài tập
    const [submissions, setSubmissions] = useState([]);
    const [stats, setStats] = useState({ total: 0, submitted: 0, graded: 0 });
    const [isFetching, setIsFetching] = useState(true);
    const [filter, setFilter] = useState("all"); 
    const [searchTerm, setSearchTerm] = useState("");

const fetchSubmissions = async () => {
        setIsFetching(true);
        try {
            const token = localStorage.getItem("smartedu_token");
            const res = await fetch(`http://localhost:9999/api/teacher/assessments/${assessmentId}/submissions`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            
            if (result.success) {
                // Backend giờ trả về { assessment, submissions } nằm trong result.data
                const assessmentData = result.data.assessment;
                const submissionsList = result.data.submissions;

                setAssessment(assessmentData); // Set dữ liệu bài tập để render khối thông tin
                setSubmissions(submissionsList);
                
                // THỐNG KÊ LOGIC
                const submittedStatuses = ['submitted', 'submitted_late', 'graded'];
                const submittedCount = submissionsList.filter(s => submittedStatuses.includes(s.status)).length;
                
                const gradedCount = submissionsList.filter(s => s.status === 'graded' || (s.grade && s.grade.final_score !== null && s.grade.final_score !== undefined)).length;
                
                setStats({ 
                    total: submissionsList.length, 
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
        const isGraded = s.status === "graded" || (s.grade && s.grade.final_score !== null && s.grade.final_score !== undefined);
        const isSubmitted = ['submitted', 'submitted_late', 'graded'].includes(s.status);

        if (filter === "submitted") statusMatch = isSubmitted;
        if (filter === "pending") statusMatch = isSubmitted && !isGraded;
        if (filter === "graded") statusMatch = isGraded;
        
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

            {/* HIỂN THỊ THÔNG TIN CHI TIẾT BÀI TẬP */}
            {assessment && (
                <Card className="border-blue-100 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">{assessment.title}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 border-b pb-4">
                            <div>
                                <p className="text-slate-500 font-semibold mb-1">Môn học</p>
                                <p className="font-medium">{assessment.Course?.name || '---'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-semibold mb-1">Hạn nộp bài</p>
                                <p className="font-medium text-red-600">
                                    {assessment.due_at ? new Date(assessment.due_at).toLocaleString('vi-VN') : 'Không giới hạn'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-semibold mb-1">Hạn chót đóng cổng</p>
                                <p className="font-medium">
                                    {assessment.cutoff_at ? new Date(assessment.cutoff_at).toLocaleString('vi-VN') : 'Không có'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-semibold mb-1">Điểm tối đa</p>
                                <p className="font-medium">{assessment.max_score || 10}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-500 font-semibold mb-2 text-sm">Hướng dẫn / Yêu cầu:</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                {assessment.instructions || "Không có hướng dẫn thêm."}
                            </p>
                        </div>
                        {/* THÊM KHỐI FILE ĐÍNH KÈM VÀO ĐÂY */}
{assessment.files && assessment.files.length > 0 && (
    <div className="mt-6 border-t pt-4">
        <p className="text-slate-500 font-semibold mb-3 text-sm">Tài liệu đính kèm:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assessment.files.map((file) => (
                <button 
                    key={file.id}
                    onClick={() => window.open(file.file_url, '_blank')}
                    className="flex items-center text-left gap-3 p-3 rounded-xl border border-blue-50 bg-blue-50/20 hover:bg-blue-50 hover:border-blue-200 transition-all group w-full"
                >
                    <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
                    <div className="overflow-hidden">
                        <div className="text-sm font-semibold text-blue-700 truncate">
                            {file.original_name || "Tài liệu câu hỏi"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">BẤM ĐỂ TẢI VỀ</div>
                    </div>
                </button>
            ))}
        </div>
    </div>
    )}
                    </CardContent>
                </Card>
            )}

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
                            placeholder="Tìm tên hoặc email..." 
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
                                    <Th>Trạng thái nộp</Th>  
                                    <Th>Trạng thái chấm</Th>  
                                    <Th>Điểm số</Th>
                                    <Th>Thời gian nộp</Th>
                                    <Th className="text-right">Thao tác</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {isFetching ? (
                                    <tr><Td colSpan="6" className="text-center py-10 text-slate-500">Đang tải dữ liệu bài nộp...</Td></tr>
                                ) : filteredData.length > 0 ? filteredData.map((s) => {
                                    
                                    // LOGIC KIỂM TRA TRẠNG THÁI
                                    const hasSubmitted = ['submitted', 'submitted_late', 'graded'].includes(s.status);
                                    const isGraded = s.status === 'graded' || (s.grade && s.grade.final_score !== null && s.grade.final_score !== undefined);
                                    
                                    // Kiểm tra nộp muộn: Dựa vào status của backend HOẶC tự so sánh giờ nộp với hạn cuối
                                    const isLate = s.status === 'submitted_late' || 
                                                  (assessment?.due_at && s.submitted_at && new Date(s.submitted_at) > new Date(assessment.due_at));

                                    return (
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
                                            
                                            {/* TRẠNG THÁI NỘP (Đúng hạn / Muộn / Chưa nộp) */}
                                            <Td>
                                                {!hasSubmitted ? (
                                                    <Badge tone="slate">Chưa nộp</Badge>
                                                ) : isLate ? (
                                                    <Badge tone="amber">Nộp muộn</Badge>
                                                ) : (
                                                    <Badge tone="blue">Đúng hạn</Badge>
                                                )}
                                            </Td>

                                            {/* TRẠNG THÁI CHẤM (Đã chấm / Chưa chấm) */}
                                            <Td>
                                                {!hasSubmitted ? (
                                                    <span className="text-slate-400 text-xs italic">-</span>
                                                ) : isGraded ? (
                                                    <Badge tone="green">Đã chấm</Badge>
                                                ) : (
                                                    <Badge tone="slate">Chưa chấm</Badge>
                                                )}
                                            </Td>

                                            {/* ĐIỂM SỐ */}
                                            <Td>
                                                <Badge tone={isGraded ? 'green' : 'slate'}>
                                                    {isGraded ? `Điểm: ${s.grade.final_score}` : '---'}
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
                                                    onClick={() => navigate(`/teacher/grading/${s.id}`, { state: { submissionIds: filteredData.map(sub => sub.id) } })}
                                                    disabled={!hasSubmitted}
                                                >
                                                    {isGraded ? 'Xem / Sửa điểm' : 'Chấm điểm'}
                                                </Button>
                                            </Td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><Td colSpan="6" className="text-center py-10 text-slate-500">Không tìm thấy sinh viên nào phù hợp.</Td></tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}