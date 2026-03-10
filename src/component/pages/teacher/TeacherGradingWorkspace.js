import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, Button, Badge } from "component/ui";

export default function TeacherGradingWorkspace() {
    const { submissionId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [score, setScore] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("manual"); // 'manual' hoặc 'ai'

    useEffect(() => {
        // Giả lập Fetch Data (Thay bằng link API thực tế của bạn)
        fetchData();
    }, [submissionId]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("smartedu_token");
            const res = await fetch(`http://localhost:9999/api/teachers/submissions/${submissionId}/grading`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setData(result.data);
                if (result.data.grade) {
                    setScore(result.data.grade.final_score || "");
                    setFeedback(result.data.grade.final_feedback || "");
                }
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
        }
    };

    // Hàm tải file (Dùng chung logic đã fix lúc nãy)
    const handleDownload = (fileUrl, originalName) => {
        window.open(fileUrl, '_blank'); 
        // Lắp hàm handleDownload Blob thông minh vào đây
    };

    const handleSaveGrade = async (isPublished = false) => {
        // --- THÊM ĐOẠN VALIDATION NÀY VÀO ĐẦU HÀM ---
        const scoreNum = parseFloat(score);
        if (scoreNum < 0) {
            alert("Điểm không được là số âm!");
            return;
        }
        if (scoreNum > data.assessment.max_score) {
            alert(`Điểm số (${scoreNum}) không được vượt quá thang điểm tối đa (${data.assessment.max_score})!`);
            return;
        }
        if (scoreNum >= 10000) {
            alert("Điểm số quá lớn, hệ thống không hỗ trợ!");
            return;
        }
        setIsSaving(true);
        try {
            const token = localStorage.getItem("smartedu_token");
            const res = await fetch(`http://localhost:9999/api/teachers/submissions/${submissionId}/grade`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    final_score: score,
                    final_feedback: feedback,
                    is_published: isPublished
                })
            });
            const result = await res.json();
            if (result.success) {
                alert("Đã lưu điểm thành công!");
                // Nếu muốn Save & Next thì gọi API lấy ID sinh viên tiếp theo và navigate
            }
        } catch (error) {
            alert("Lỗi khi lưu điểm");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResubmit = async () => {
        if(window.confirm("Bạn có chắc chắn muốn cho phép sinh viên này nộp lại bài?")) {
            // Gọi API allowResubmit ở Backend
            alert("Đã mở lại quyền nộp bài cho sinh viên.");
            navigate(-1);
        }
    };

    if (!data) return <div className="p-10 text-center">Đang tải không gian chấm bài...</div>;

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* TOP HEADER */}
            <header className="bg-white border-b px-6 py-3 flex justify-between items-center shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => navigate(-1)}>⬅ Trở về</Button>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800">{data.assessment.title}</h1>
                        <p className="text-sm text-slate-500">
                            Sinh viên: <span className="font-bold text-blue-600">{data.student.full_name}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge tone={data.status === 'graded' ? 'green' : 'amber'}>
                        {data.status === 'graded' ? 'Đã chấm' : 'Cần chấm'}
                    </Badge>
                </div>
            </header>

            {/* SPLIT SCREEN WORKSPACE */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* TRÁI: DOCUMENT VIEWER (2/3 Màn hình) */}
                <div className="flex-1 bg-slate-100 p-6 overflow-y-auto border-r border-slate-200">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <h2 className="font-bold text-slate-700 flex items-center gap-2">
                            📄 Các file sinh viên đã nộp
                        </h2>
                        
                        {data.files && data.files.length > 0 ? (
                            <div className="grid gap-3">
                                {data.files.map(file => (
                                    <Card key={file.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl text-blue-500">📎</span>
                                                <div>
                                                    <p className="font-bold text-slate-700">{file.original_name}</p>
                                                    <p className="text-xs text-slate-400">Nhấn tải về để xem nội dung</p>
                                                </div>
                                            </div>
                                            <Button onClick={() => handleDownload(file.file_url, file.original_name)}>
                                                Tải về xem
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-10 text-center rounded-xl border border-dashed text-slate-500">
                                Sinh viên không đính kèm file nào. <br/>
                                <span className="text-sm">Nội dung text: {data.content_text}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* PHẢI: GRADING PANEL (1/3 Màn hình) */}
                <div className="w-[400px] bg-white flex flex-col shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
                    {/* Tabs */}
                    <div className="flex border-b">
                        <button 
                            className={`flex-1 py-3 text-sm font-bold ${activeTab === 'manual' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
                            onClick={() => setActiveTab('manual')}
                        >
                            Chấm thủ công
                        </button>
                        <button 
                            className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'ai' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-slate-500'}`}
                            onClick={() => setActiveTab('ai')}
                        >
                            ✨ AI Đề xuất
                        </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        {activeTab === 'manual' ? (
                            <>
                                {/* Validation Điểm (BR_GRD_01) */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Điểm số (Tối đa: {data.assessment.max_score})</label>
<input 
    type="number" 
    step="0.1" 
    max={data.assessment.max_score}
    value={score}
    onChange={(e) => setScore(e.target.value)}
    // Vô hiệu hóa lăn chuột làm thay đổi điểm
    onWheel={(e) => e.target.blur()} 
    // Các class Tailwind giúp ẩn hoàn toàn nút mũi tên (spinner)
    className="w-full text-2xl font-bold border-2 border-slate-200 rounded-lg p-3 text-blue-600 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    placeholder="Nhập điểm số..."
/>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nhận xét chi tiết</label>
                                    <textarea 
                                        rows="6"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none resize-none"
                                        placeholder="Nhập lời phê cho sinh viên..."
                                    ></textarea>
                                </div>
                            </>
                        ) : (
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <h4 className="font-bold text-purple-800 mb-2">Phân tích từ AI</h4>
                                <p className="text-sm text-purple-700 mb-4">Tính năng quét nội dung file và tự động chấm điểm đang được tích hợp.</p>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Chạy AI Quét bài</Button>
                            </div>
                        )}
                    </div>

                    {/* Action Footer */}
                    <div className="p-4 border-t bg-slate-50 space-y-3">
                        <Button 
                            className="w-full bg-blue-600 text-white py-4 font-bold text-lg"
                            disabled={isSaving || !score}
                            onClick={() => handleSaveGrade(true)}
                        >
                            {isSaving ? "Đang lưu..." : "Lưu & Công bố điểm"}
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={handleResubmit}>
                                Yêu cầu nộp lại
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}