import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Input, Badge, Modal } from "component/ui";
import {
    Plus, Trash2, Edit2, Save, X, Sparkles,
    ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
    FileText, HelpCircle, LayoutList
} from "lucide-react";
import * as TeacherQuizService from "service/TeacherQuizService";
import { toast } from "sonner";

export default function QuizQuestionManager() {
    const { classId, quizId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const quizInfo = location.state?.quiz;

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const initialQuestionState = {
        question_text: "",
        points: 1,
        options: [
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false }
        ]
    };

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await TeacherQuizService.getQuizQuestions(quizId);
            if (res.success || res.code === 200) {
                const fetchedQuestions = res.data?.questions || (Array.isArray(res.data) ? res.data : []);
                setQuestions(fetchedQuestions);
            }
        } catch (error) {
            console.error("Error fetching questions:", error);
            toast.error("Không thể tải danh sách câu hỏi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("QuizQuestionManager Params:", { classId, quizId });
        if (quizId && quizId !== "undefined") {
            fetchQuestions();
        } else {
            console.error("Quiz ID is missing or undefined");
            setLoading(false);
        }
    }, [quizId]);


    const handleAddQuestion = () => {
        setEditingQuestion({ ...initialQuestionState, id: 'temp-' + Date.now() });
    };

    const handleEditQuestion = (q) => {
        setEditingQuestion({ ...q });
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
        try {
            const res = await TeacherQuizService.deleteQuestion(id);
            if (res.success) {
                toast.success("Đã xóa câu hỏi");
                fetchQuestions();
            }
        } catch (error) {
            toast.error("Lỗi khi xóa câu hỏi");
        }
    };

    const handleSaveQuestion = async () => {
        // Validation
        if (!editingQuestion.question_text.trim()) {
            return toast.error("Nội dung câu hỏi không được để trống");
        }
        if (editingQuestion.options.length < 2) {
            return toast.error("Cần ít nhất 2 phương án trả lời");
        }
        if (!editingQuestion.options.some(o => o.is_correct)) {
            return toast.error("Phải có ít nhất 1 đáp án đúng");
        }
        if (editingQuestion.options.some(o => !o.option_text.trim())) {
            return toast.error("Nội dung phương án không được để trống");
        }

        try {
            let res;
            const payloadToSend = {
                ...editingQuestion,
                options: editingQuestion.options.map((opt, idx) => ({
                    ...opt,
                    display_order: idx + 1
                }))
            };

            if (typeof editingQuestion.id === 'string' && editingQuestion.id.startsWith('temp-')) {
                // Create
                const { id, ...payload } = payloadToSend;
                res = await TeacherQuizService.createQuestion(quizId, payload);
            } else {
                // Update
                res = await TeacherQuizService.updateQuestion(editingQuestion.id, payloadToSend);
            }

            if (res && res.success) {
                toast.success("Đã lưu câu hỏi");
                setEditingQuestion(null);
                fetchQuestions();
            } else {
                toast.error(res?.message || "Lỗi khi lưu câu hỏi");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Lỗi khi lưu câu hỏi. Vui lòng thử lại.");
        }
    };

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...editingQuestion.options];
        newOptions[index][field] = value;
        setEditingQuestion({ ...editingQuestion, options: newOptions });
    };

    const addOption = () => {
        setEditingQuestion({
            ...editingQuestion,
            options: [...editingQuestion.options, { option_text: "", is_correct: false }]
        });
    };

    const removeOption = (index) => {
        if (editingQuestion.options.length <= 2) return toast.error("Cần tối thiểu 2 lựa chọn");
        const newOptions = editingQuestion.options.filter((_, i) => i !== index);
        setEditingQuestion({ ...editingQuestion, options: newOptions });
    };

    const handleAIGenerate = async () => {
        if (!aiPrompt.trim()) return toast.error("Vui lòng nhập yêu cầu cho AI");
        if (!quizId || quizId === "undefined") {
            return toast.error("Quiz ID không hợp lệ. Vui lòng quay lại và chọn đúng bài Quiz.");
        }
        setIsGenerating(true);
        try {
            const res = await TeacherQuizService.generateAIQuestions(quizId, { prompt: aiPrompt });
            if (res.success) {
                const aiQuestions = res.data;
                if (window.confirm(`AI đã tạo ${aiQuestions.length} câu hỏi. Bạn có muốn lưu tất cả vào Quiz không?`)) {
                    await TeacherQuizService.bulkSaveQuestions(quizId, aiQuestions);
                    toast.success("Đã lưu các câu hỏi từ AI");
                    setShowAIModal(false);
                    setAiPrompt("");
                    fetchQuestions();
                }
            } else {
                toast.error(res.message || "AI không thể tạo câu hỏi. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error("AI Generate Error:", error);
            toast.error("Lỗi khi tạo câu hỏi bằng AI");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePublishQuiz = async () => {
        if (questions.length === 0) {
            return toast.error("Đề thi chưa có câu hỏi nào!");
        }
        if (!window.confirm("Bạn có chắc chắn muốn Lưu lại và Hoàn tất đề thi này?")) return;
        
        try {
            const res = await TeacherQuizService.updateQuizStatus(classId, quizId, "published");
            if (res && res.success) {
                toast.success("Đã hoàn tất đề thi!");
                navigate(`/teacher/classes/${classId}/assignments`);
            } else {
                toast.error(res?.message || "Không thể hoàn tất đề thi");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Lỗi khi lưu đề thi");
        }
    };

    const handleCancelQuiz = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn HỦY đề thi này? Mọi dữ liệu (bao gồm câu hỏi) sẽ bị XÓA vĩnh viễn.")) return;
        
        try {
            const res = await TeacherQuizService.deleteQuiz(classId, quizId);
            if (res && res.success) {
                toast.success("Đã hủy đề thi");
                navigate(`/teacher/classes/${classId}/assignments`);
            } else {
                toast.error(res?.message || "Không thể hủy đề thi");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Lỗi khi hủy đề thi");
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Cấu trúc đề Quiz" 
                subtitle={`Lớp: ${classId} • Đề: ${quizInfo?.title || quizId}`}
                right={[
                    <Button key="back" variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>,
                    <Button key="cancel" variant="danger" className="text-red-600 border-red-100 hover:bg-red-50" onClick={handleCancelQuiz}>
                        Hủy đề
                    </Button>,
                    <Button key="save" onClick={handlePublishQuiz} className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-blue-700">
                        <Save className="h-4 w-4 mr-2" /> Lưu đề
                    </Button>,
                    <Button key="ai" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none ml-2 shadow-sm" onClick={() => setShowAIModal(true)}>
                        <Sparkles className="h-4 w-4 mr-2" /> Soạn bằng AI (Gemini)
                    </Button>,
                    <Button key="add" onClick={handleAddQuestion} disabled={!!editingQuestion} className="ml-2">
                        <Plus className="h-4 w-4 mr-2" /> Thêm câu hỏi
                    </Button>
                ]}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left side: List of questions */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="p-20 text-center bg-white rounded-2xl border border-slate-100">
                            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-500">Đang tải danh sách câu hỏi...</p>
                        </div>
                    ) : questions.length === 0 && !editingQuestion ? (
                        <div className="p-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">Chưa có câu hỏi nào</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mb-6">Bắt đầu soạn đề bằng cách thêm câu hỏi thủ công hoặc sử dụng AI để gợi ý câu hỏi.</p>
                            <Button onClick={handleAddQuestion}>Tạo câu hỏi đầu tiên</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(Array.isArray(questions) ? questions : []).map((q, index) => (
                                <Card key={q.id} className="hover:shadow-md transition-shadow group">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge tone="blue">Câu {index + 1}</Badge>
                                                    <Badge tone="slate">{q.points} điểm</Badge>
                                                </div>
                                                <h4 className="font-bold text-slate-900 mb-4">{q.question_text}</h4>
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    {(Array.isArray(q.options) ? q.options : []).map((opt, i) => (
                                                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm border ${opt.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                                            {opt.is_correct ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border border-slate-300"></div>}
                                                            {opt.option_text}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="xs" variant="outline" onClick={() => handleEditQuestion(q)}>
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="xs" variant="danger" className="text-red-600 border-red-100 hover:bg-red-50" onClick={() => handleDeleteQuestion(q.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right side: Edit/Add form */}
                <div className="lg:col-span-1">
                    {editingQuestion ? (
                        <div className="sticky top-6">
                            <Card className="border-blue-200 shadow-lg ring-4 ring-blue-50">
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex justify-between items-center border-b pb-4">
                                        <h3 className="font-extrabold text-blue-900">
                                            {typeof editingQuestion.id === 'string' && editingQuestion.id.startsWith('temp-') ? 'THÊM MỚI' : 'CHỈNH SỬA'}
                                        </h3>
                                        <Button size="xs" variant="outline" onClick={() => setEditingQuestion(null)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nội dung câu hỏi</label>
                                            <textarea
                                                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                                placeholder="Nhập câu hỏi tại đây..."
                                                value={editingQuestion.question_text}
                                                onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                                            />
                                        </div>

                                        <div className="w-1/2">
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Điểm số</label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={editingQuestion.points}
                                                onChange={(e) => setEditingQuestion({ ...editingQuestion, points: Number(e.target.value) })}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-slate-500 uppercase block">Phương án trả lời</label>
                                                <Button size="xs" variant="outline" className="text-blue-600 border-blue-100" onClick={addOption}>
                                                    + Thêm
                                                </Button>
                                            </div>

                                            {(Array.isArray(editingQuestion?.options) ? editingQuestion.options : []).map((opt, idx) => (
                                                <div key={idx} className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 border-slate-300 text-blue-600 rounded"
                                                            checked={opt.is_correct}
                                                            onChange={(e) => handleOptionChange(idx, 'is_correct', e.target.checked)}
                                                        />
                                                        <Input
                                                            placeholder={`Lựa chọn ${idx + 1}`}
                                                            value={opt.option_text}
                                                            onChange={(e) => handleOptionChange(idx, 'option_text', e.target.value)}
                                                            className="flex-1 bg-white"
                                                        />
                                                        <button className="text-slate-400 hover:text-red-500" onClick={() => removeOption(idx)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t">
                                        <Button variant="outline" className="flex-1" onClick={() => setEditingQuestion(null)}>Hủy</Button>
                                        <Button className="flex-1 bg-blue-600 text-white" onClick={handleSaveQuestion}>
                                            <Save className="h-4 w-4 mr-2" /> Lưu lại
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="sticky top-6">
                            <Card className="bg-slate-50 border-dashed border-2">
                                <CardContent className="p-10 text-center space-y-4">
                                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                        <HelpCircle className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500">Chọn một câu hỏi để chỉnh sửa hoặc nhấn "Thêm câu hỏi" để bắt đầu soạn mới.</p>
                                    <Button variant="outline" onClick={handleAddQuestion}>Thêm câu hỏi mới</Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Generation Modal */}
            <Modal
                title="Sáng tạo đề bằng Gemini AI"
                open={showAIModal}
                onClose={() => !isGenerating && setShowAIModal(false)}
            >
                <div className="space-y-6">
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex gap-4">
                        <div className="h-10 w-10 bg-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-sm text-purple-900 leading-relaxed">
                            <p className="font-bold">Mẹo soạn đề nhanh:</p>
                            Mô tả chi tiết chủ đề (VD: "10 câu hỏi Java cơ bản về Class và Interface, độ khó trung bình") để AI cho kết quả chính xác nhất.
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Yêu cầu của bạn</label>
                        <textarea
                            className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500 outline-none min-h-[120px] shadow-inner"
                            placeholder="VD: Tạo 5 câu hỏi về React Hooks..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowAIModal(false)} disabled={isGenerating}>Hủy</Button>
                        <Button
                            className="bg-purple-600 text-white hover:bg-purple-700 min-w-[140px]"
                            onClick={handleAIGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Đang tạo...
                                </>
                            ) : (
                                <>Tạo câu hỏi <Sparkles className="h-4 w-4 ml-2" /></>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}