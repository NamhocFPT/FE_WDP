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
    
    // Quản lý Tab & AI
    const [activeTab, setActiveTab] = useState("manual"); // 'manual' hoặc 'ai'
    const [isAILoading, setIsAILoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    useEffect(() => {
        if (submissionId) fetchData();
    }, [submissionId]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("smartedu_token");
            const res = await fetch(`http://localhost:9999/api/teacher/submissions/${submissionId}/grading`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            
            if (result.success) {
                setData(result.data);
                // Nếu đã từng chấm điểm thì fill dữ liệu vào form
                if (result.data.grade) {
                    setScore(result.data.grade.final_score !== null ? result.data.grade.final_score : "");
                    setFeedback(result.data.grade.final_feedback || "");
                }
            } else {
                alert("Lỗi từ server: " + (result.message || "Không thể tải dữ liệu"));
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
            alert("Lỗi kết nối đến máy chủ! Vui lòng kiểm tra lại Backend.");
        }
    };

    // Hàm tải file thông minh: Tự động đoán và gắn lại đuôi file nếu bị mất
    const handleDownload = async (fileUrl, originalName) => {
        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            let finalName = originalName || "submission_document";
            
            if (!/\.(pdf|doc|docx|png|jpg|jpeg|zip|rar)$/i.test(finalName)) {
                const extMatch = fileUrl.match(/\.(pdf|doc|docx|png|jpg|jpeg|zip|rar)(?:\?|#|$)/i);
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
            window.open(fileUrl, '_blank'); 
        }
    };

    // Hàm lưu điểm (Đã bọc Validation an toàn tuyệt đối)
    const handleSaveGrade = async (isPublished = false) => {
        const scoreNum = parseFloat(score);
        if (isNaN(scoreNum) || scoreNum < 0) {
            alert("Điểm không hợp lệ hoặc là số âm!");
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
            const res = await fetch(`http://localhost:9999/api/teacher/submissions/${submissionId}/grade`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    final_score: scoreNum,
                    final_feedback: feedback,
                    is_published: isPublished
                })
            });
            const result = await res.json();
            if (result.success) {
                alert("Đã lưu điểm thành công!");
                fetchData(); // Load lại data để cập nhật badge trạng thái
            } else {
                alert("Lỗi khi lưu điểm: " + result.message);
            }
        } catch (error) {
            alert("Lỗi kết nối khi lưu điểm.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResubmit = async () => {
        if(window.confirm("Bạn có chắc chắn muốn cho phép sinh viên này nộp lại bài? Trạng thái bài làm sẽ quay về 'Chờ nộp'.")) {
            // TODO: Gắn API gọi hàm allowResubmit ở Backend vào đây
            alert("Tính năng đang được cập nhật...");
        }
    };

    // Hàm gọi AI chấm bài
    const handleRunAI = async () => {
        setIsAILoading(true);
        setAiResult(null);
        try {
            const token = localStorage.getItem("smartedu_token");
            const res = await fetch(`http://localhost:9999/api/teacher/submissions/${submissionId}/ai-grade`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            
            if (result.success) {
                setAiResult(result.data); 
            } else {
                alert("Lỗi AI: " + result.message);
            }
        } catch (error) {
            console.error("Lỗi AI:", error);
            alert("Lỗi kết nối máy chủ khi gọi AI!");
        } finally {
            setIsAILoading(false);
        }
    };

    if (!data) return <div className="p-10 text-center text-slate-500 font-medium animate-pulse">Đang tải không gian chấm bài...</div>;

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* TOP HEADER */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="font-semibold" onClick={() => navigate(-1)}>⬅ Trở về</Button>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800">{data.assessment.title}</h1>
                        <p className="text-sm text-slate-500">
                            Sinh viên: <span className="font-bold text-blue-600">{data.student.full_name}</span> 
                            <span className="text-xs text-slate-400 ml-2">({data.student.email})</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge tone={data.status === 'graded' ? 'green' : (data.status === 'submitted_late' ? 'amber' : 'blue')}>
                        {data.status === 'graded' ? 'Đã chấm điểm' : (data.status === 'submitted_late' ? 'Nộp muộn' : 'Cần chấm')}
                    </Badge>
                </div>
            </header>

            {/* SPLIT SCREEN WORKSPACE */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* TRÁI: DOCUMENT VIEWER */}
                <div className="flex-1 bg-slate-100 p-8 overflow-y-auto border-r border-slate-200">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <h2 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                            📄 File bài làm đính kèm
                        </h2>
                        
                        {data.files && data.files.length > 0 ? (
                            <div className="grid gap-4">
                                {data.files.map(file => (
                                    <Card key={file.id} className="hover:shadow-md transition-shadow border-slate-200">
                                        <CardContent className="p-5 flex justify-between items-center bg-white">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
                                                    📎
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{file.original_name}</p>
                                                    <p className="text-xs text-slate-400 mt-1">Đã nộp lúc: {new Date(data.submitted_at).toLocaleString('vi-VN')}</p>
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
                            <div className="bg-white p-12 text-center rounded-2xl border-2 border-dashed border-slate-300 text-slate-500">
                                <div className="text-4xl mb-3">📝</div>
                                <p className="font-bold text-slate-700 mb-1">Sinh viên không đính kèm file nào</p>
                                <p className="text-sm">Nội dung text gửi kèm: <span className="italic">"{data.content_text}"</span></p>
                            </div>
                        )}
                    </div>
                </div>

                {/* PHẢI: GRADING PANEL */}
                <div className="w-[450px] bg-white flex flex-col shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
                    {/* Tabs */}
                    <div className="flex border-b">
                        <button 
                            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'manual' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
                            onClick={() => setActiveTab('manual')}
                        >
                            Chấm thủ công
                        </button>
                        <button 
                            className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'ai' ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
                            onClick={() => setActiveTab('ai')}
                        >
                            ✨ AI Đề xuất
                        </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        {activeTab === 'manual' ? (
                            <div className="animate-in fade-in duration-300 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Điểm số (Tối đa: {data.assessment.max_score})</label>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        max={data.assessment.max_score}
                                        value={score}
                                        onChange={(e) => setScore(e.target.value)}
                                        onWheel={(e) => e.target.blur()} 
                                        className="w-full text-3xl font-black border-2 border-slate-200 rounded-xl p-4 text-blue-600 focus:border-blue-500 outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0.0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nhận xét chi tiết</label>
                                    <textarea 
                                        rows="8"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="w-full border-2 border-slate-200 rounded-xl p-4 text-sm focus:border-blue-500 outline-none resize-none transition-colors"
                                        placeholder="Nhập lời phê, góp ý cho sinh viên tại đây..."
                                    ></textarea>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-in fade-in duration-300">
                                <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-2xl border border-purple-100 relative overflow-hidden">
                                    <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2 text-lg">
                                        ✨ Trợ lý Gemini
                                    </h4>
                                    <p className="text-sm text-purple-700 mb-5 leading-relaxed">
                                        AI sẽ phân tích nội dung file đính kèm của sinh viên, đối chiếu với yêu cầu của bài tập và đưa ra điểm số kèm nhận xét chi tiết.
                                    </p>
                                    <Button 
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200 shadow-xl py-6 font-bold text-md"
                                        onClick={handleRunAI}
                                        disabled={isAILoading || !data.files || data.files.length === 0}
                                    >
                                        {isAILoading ? "🧠 Trí tuệ nhân tạo đang phân tích..." : "Phân Tích Bài Làm"}
                                    </Button>
                                    
                                    {(!data.files || data.files.length === 0) && (
                                        <p className="text-xs text-red-500 mt-3 text-center font-semibold">Cần có file đính kèm để AI phân tích.</p>
                                    )}
                                </div>

                                {/* Khối hiển thị kết quả AI trả về */}
                                {aiResult && (
                                    <div className="border-2 border-purple-200 rounded-2xl p-5 bg-white shadow-sm animate-in zoom-in-95 duration-300">
                                        <div className="flex justify-between items-end mb-4 border-b border-purple-100 pb-4">
                                            <div>
                                                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Điểm đề xuất</p>
                                                <p className="text-4xl font-black text-purple-700">{aiResult.suggested_score} <span className="text-lg text-purple-300">/ {data.assessment.max_score}</span></p>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                className="bg-purple-100 text-purple-700 hover:bg-purple-200 font-bold"
                                                onClick={() => {
                                                    setScore(aiResult.suggested_score);
                                                    setFeedback(aiResult.feedback);
                                                    setActiveTab('manual');
                                                }}
                                            >
                                                Dùng điểm này
                                            </Button>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Nhận xét tự động:</p>
                                            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                {aiResult.feedback}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Footer */}
                    <div className="p-5 border-t bg-slate-50 space-y-3">
                        <Button 
                            className="w-full bg-blue-600 text-white py-6 font-bold text-lg shadow-blue-200 shadow-xl hover:bg-blue-700 transition-all hover:-translate-y-1"
                            disabled={isSaving || score === ""}
                            onClick={() => handleSaveGrade(true)}
                        >
                            {isSaving ? "Đang xử lý..." : "Lưu & Công Bố Điểm"}
                        </Button>
                        <Button variant="outline" className="w-full py-4 text-slate-500 border-slate-300 hover:bg-slate-100" onClick={handleResubmit}>
                            Yêu cầu nộp lại bài
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}