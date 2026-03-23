import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge, Input, cn } from "component/ui";
import * as XLSX from "xlsx";

export default function SubmissionList() {
    const { classId, assessmentId } = useParams();
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
                    total: result.data.studentCount || 0, 
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

    // Hàm tải file thông minh: Tự động đoán và gắn lại đuôi file nếu bị mất
    const handleDownload = async (fileUrl, originalName) => {
        const BASE_URL = "http://localhost:9999";
        try {
            let targetUrl = fileUrl?.startsWith('http') ? fileUrl : `${BASE_URL}${fileUrl}`;
            
            const response = await fetch(targetUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            let finalName = originalName || "document";
            
            if (!/\.(pdf|doc|docx|png|jpg|jpeg|zip|rar)$/i.test(finalName)) {
                const extMatch = targetUrl.match(/\.(pdf|doc|docx|png|jpg|jpeg|zip|rar)(?:\?|#|$)/i);
                if (extMatch) {
                    finalName = `${finalName}${extMatch[0]}`;
                } else {
                    const mimeType = blob.type;
                    if (mimeType === 'application/pdf') finalName += '.pdf';
                    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') finalName += '.docx';
                    else if (mimeType === 'application/msword') finalName += '.doc';
                    else if (mimeType.startsWith('image/')) finalName += '.png'; 
                    else finalName += '.zip'; 
                }
            }

            link.setAttribute('download', finalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Lỗi fetch blob, mở link trực tiếp:", error);
            let finalName = originalName || "document";
            let downloadUrl = fileUrl;
            
            if (downloadUrl && downloadUrl.includes('/upload/') && downloadUrl.includes('res.cloudinary.com')) {
                downloadUrl = downloadUrl.replace('/upload/', `/upload/fl_attachment:${encodeURIComponent(finalName)}/`);
            } else if (downloadUrl && !downloadUrl.startsWith('http')) {
                 downloadUrl = `${BASE_URL}${downloadUrl}`;
            }
            window.open(downloadUrl, '_blank'); 
        }
    };

    const handleExportExcel = () => {
        if (!submissions || submissions.length === 0) return;

        const data = [
            ["Học sinh", "Email", "Trạng thái nộp", "Trạng thái chấm", "Điểm số", "Thời gian nộp"]
        ];

        submissions.forEach(s => {
            const hasSubmitted = ['submitted', 'submitted_late', 'graded'].includes(s.status);
            const isGraded = s.status === 'graded' || (s.grade && s.grade.final_score !== null);
            const isLate = s.status === 'submitted_late' || (assessment?.due_at && s.submitted_at && new Date(s.submitted_at) > new Date(assessment.due_at));

            const statusNop = !hasSubmitted ? 'Chưa nộp' : (isLate ? 'Nộp muộn' : 'Đúng hạn');
            const statusCham = !hasSubmitted ? '-' : (isGraded ? 'Đã chấm' : 'Chưa chấm');
            const diem = isGraded ? s.grade.final_score : '---';
            const thoiGian = s.submitted_at ? new Date(s.submitted_at).toLocaleString('vi-VN') : '-';

            data.push([
                s.student?.full_name || '-',
                s.student?.email || '-',
                statusNop,
                statusCham,
                diem,
                thoiGian
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Danh sách nộp bài");

        XLSX.writeFile(wb, `${assessment?.title || 'Diem_Bai_Tap'}_Bang_Diem.xlsx`);
    };

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
                right={[
                    <Button key="back" variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>,
                    <Button key="dl" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleExportExcel}>Xuất điểm Excel</Button>
                ]}
            />

            {/* HIỂN THỊ THÔNG TIN CHI TIẾT BÀI TẬP */}
            {assessment && (
                <Card className="border-blue-100 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">{assessment.title}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4 border-b pb-4">
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
                    onClick={() => handleDownload(file.file_url, file.original_name)}
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-blue-50 border-blue-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Tổng học sinh lớp</p>
                        <p className="text-2xl font-black text-blue-700">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-green-600 font-bold uppercase mb-1">Đã nộp bài</p>
                        <p className="text-2xl font-black text-green-700">{stats.submitted}</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-red-600 font-bold uppercase mb-1">Chưa nộp bài</p>
                        <p className="text-2xl font-black text-red-700">{Math.max(0, stats.total - stats.submitted)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Đã chấm điểm</p>
                        <p className="text-2xl font-black text-emerald-700">{stats.graded}</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-amber-600 font-bold uppercase mb-1">Chưa chấm điểm</p>
                        <p className="text-2xl font-black text-amber-700">{Math.max(0, stats.submitted - stats.graded)}</p>
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
                                    <Th>Học sinh</Th>
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
                                        <tr key={s.id} className={cn(
                                            "hover:bg-slate-50 transition-colors",
                                            s.is_cheat && "bg-rose-50 hover:bg-rose-100/80"
                                        )}>
                                            <Td>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-600">
                                                        {s.student?.full_name?.charAt(0) || "U"}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-sm text-slate-900">{s.student?.full_name || "Unknown User"}</p>
                                                            {s.is_cheat && (
                                                                <Badge tone="red" className="text-[10px] px-1 py-0 h-4 border-rose-200">GIAN LẬN</Badge>
                                                            )}
                                                        </div>
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
                                                {hasSubmitted && (
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                                        onClick={() => navigate(`/teacher/classes/${classId}/assessments/${assessmentId}/submissions/${s.id}/grade`, { state: { submissionIds: filteredData.map(sub => sub.id) } })}
                                                    >
                                                        {isGraded ? 'Xem / Sửa điểm' : 'Chấm điểm'}
                                                    </Button>
                                                )}
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