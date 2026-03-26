import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Input, Badge, Modal } from "component/ui";
import {
    Plus, Trash2, Edit2, Save, X, Sparkles,
    ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
    FileText, HelpCircle, LayoutList, Download
} from "lucide-react";
import * as TeacherQuizService from "service/TeacherQuizService";
import { toast } from "sonner";
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

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
    const [aiFile, setAiFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef(null);
    const [mathpadTemp, setMathpadTemp] = useState("");
    const questionTextRef = useRef(null);
    
    // NEW STATES
    const [quizMeta, setQuizMeta] = useState(null);
    const [classMeta, setClassMeta] = useState(null);
    
    useEffect(() => {
        import("mathlive");
        async function fetchMetadata() {
            try {
                if (quizId && quizId !== "undefined") {
                    const resQuiz = await TeacherQuizService.getQuizDetail(classId, quizId);
                    if (resQuiz && resQuiz.data) setQuizMeta(resQuiz.data);
                }
                const resClasses = await TeacherQuizService.getTeacherClasses();
                const clsList = Array.isArray(resClasses) ? resClasses : (resClasses?.data || []);
                const currentCls = clsList.find(c => c.id === classId);
                if (currentCls) setClassMeta(currentCls);
            } catch (err) { }
        }
        fetchMetadata();
    }, [classId, quizId]);

    const initialQuestionState = {
        question_text: "",
        points: 1,
        options: [
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false }
        ]
    };

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            const formData = new FormData();
            formData.append("prompt", aiPrompt);
            if (aiFile) {
                formData.append("file", aiFile);
            }

            const res = await TeacherQuizService.generateAIQuestions(quizId, formData);
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

    const handleExport = (format, includeAnswers) => {
        const url = TeacherQuizService.downloadQuizExport(quizId, format, includeAnswers);
        window.open(url, "_blank");
        setShowExportMenu(false);
        toast.success(`Đang chuẩn bị file ${format.toUpperCase()}...`);
    };

    return (
        <div className="space-y-6">
            {/* Header Redesign */}
            <div className="relative rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-8 text-white shadow-2xl">
                {/* Decorative Background */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white opacity-5 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-48 w-48 rounded-full bg-blue-500 opacity-10 blur-2xl"></div>
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-blue-200">
                            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm border border-blue-400/30">
                                {classMeta?.name || `Lớp: ${classId}`}
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tight">{quizMeta?.title || quizInfo?.title || `Bài Quiz: ${quizId}`}</h1>
                        <p className="mt-2 text-indigo-200 text-sm max-w-xl">Quản lý ngân hàng câu hỏi, soạn thảo công thức Toán học / Vật Lý nâng cao trực tiếp bằng Virtual Keyboard.</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 max-w-sm">
                        <Button variant="ghost" className="border border-indigo-400/30 bg-indigo-500/10 text-white hover:bg-white hover:text-indigo-900 transition-colors rounded-xl font-semibold" onClick={() => navigate(-1)}>
                            Lưu & Thoát
                        </Button>
                        <Button variant="danger" className="bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-500/20 rounded-xl" onClick={handleCancelQuiz}>
                            Hủy đề
                        </Button>
                        <Button onClick={handlePublishQuiz} className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 border-none rounded-xl">
                            <Save className="h-4 w-4 mr-2" /> Hoàn tất & Công bố
                        </Button>
                    </div>
                </div>
                
                <div className="relative z-10 mt-8 flex flex-wrap gap-3">
                    <Button variant="ghost" onClick={handleAddQuestion} disabled={!!editingQuestion} className="bg-white text-indigo-900 hover:bg-slate-50 border-none shadow-lg rounded-xl h-11 px-5">
                        <Plus className="h-5 w-5 mr-2 text-indigo-600" /> Tạo câu hỏi thủ công
                    </Button>
                    <Button variant="ghost" className="bg-gradient-to-r from-purple-500 hover:from-purple-400 to-pink-500 hover:to-pink-400 text-white border-none shadow-lg shadow-purple-500/25 rounded-xl h-11 px-5" onClick={() => setShowAIModal(true)}>
                        <Sparkles className="h-5 w-5 mr-2" /> Sáng tạo bằng Gemini AI
                    </Button>
                    
                    {/* Export Menu */}
                    <div className="relative" ref={exportMenuRef}>
                        <Button 
                            variant="ghost" 
                            className="bg-indigo-600/20 backdrop-blur-md text-white border border-indigo-400/30 hover:bg-indigo-600/40 shadow-lg rounded-xl h-11 px-5"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                        >
                            <Download className="h-5 w-5 mr-2" /> Xuất Quiz
                            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </Button>
                        
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-1 animate-in fade-in zoom-in duration-200">
                                <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">Định dạng PDF</div>
                                <button onClick={() => handleExport('pdf', false)} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-red-500" /> Chỉ đề bài (.pdf)
                                </button>
                                <button onClick={() => handleExport('pdf', true)} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-red-600" /> Đề bài + Đáp án (.pdf)
                                </button>
                                
                                <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mt-1">Định dạng WORD</div>
                                <button onClick={() => handleExport('docx', false)} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                                    <LayoutList className="h-4 w-4 text-blue-500" /> Chỉ đề bài (.docx)
                                </button>
                                <button onClick={() => handleExport('docx', true)} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                                    <LayoutList className="h-4 w-4 text-blue-600" /> Đề bài + Đáp án (.docx)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
                                                <div className="font-bold text-slate-900 mb-4 text-lg">
                                                    <Latex>{q.question_text}</Latex>
                                                </div>
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    {(Array.isArray(q.options) ? q.options : []).map((opt, i) => (
                                                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm border overflow-hidden ${opt.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                                            {opt.is_correct ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0"></div>}
                                                            <div className="flex-1 overflow-hidden pointer-events-none">
                                                                <Latex>{opt.option_text || ""}</Latex>
                                                            </div>
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
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung câu hỏi</label>
                                            </div>
                                            <textarea
                                                ref={questionTextRef}
                                                className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px]"
                                                placeholder="VD: Để chèn công thức Toán học, dùng đoạn mã $$x^2$$ bên trong câu hỏi này..."
                                                value={editingQuestion.question_text}
                                                onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                                            />
                                        </div>

                                        <div className="p-4 rounded-xl border border-dashed border-purple-300 bg-purple-50/50">
                                            <label className="text-xs font-bold text-purple-700 uppercase tracking-wider block mb-2">Bảng nháp công thức (Virtual Keyboard)</label>
                                            <div className="flex items-stretch gap-2">
                                                <div className="flex-1 rounded-xl border-2 border-purple-100 bg-white overflow-hidden p-1">
                                                    <math-field 
                                                        style={{ width: '100%', fontSize: '1.1rem', backgroundColor: 'transparent', border: 'none', outline: 'none', padding: '8px' }}
                                                        onInput={(e) => setMathpadTemp(e.target.value)}
                                                    >
                                                        {mathpadTemp}
                                                    </math-field>
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    className="border-purple-200 text-purple-700 bg-white"
                                                    onClick={() => {
                                                        if (mathpadTemp.includes("\\placeholder")) {
                                                            return toast.error("Vui lòng gõ số/chữ vào ô vuông trống trong Bảng nháp cho hoàn chỉnh trước khi Chèn!");
                                                        }
                                                        const latexToAdd = ` $${mathpadTemp}$ `;

                                                        if (questionTextRef.current) {
                                                            const start = questionTextRef.current.selectionStart;
                                                            const end = questionTextRef.current.selectionEnd;
                                                            const text = editingQuestion.question_text || "";
                                                            const newText = text.substring(0, start) + latexToAdd + text.substring(end);
                                                            setEditingQuestion({ ...editingQuestion, question_text: newText });
                                                            
                                                            setTimeout(() => {
                                                                if (questionTextRef.current) {
                                                                    questionTextRef.current.focus();
                                                                    questionTextRef.current.setSelectionRange(start + latexToAdd.length, start + latexToAdd.length);
                                                                }
                                                            }, 0);
                                                        } else {
                                                            setEditingQuestion({ ...editingQuestion, question_text: (editingQuestion.question_text || "") + latexToAdd });
                                                        }
                                                        toast.success("Đã chèn lệnh Toán vào câu hỏi!");
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" /> Chèn
                                                </Button>
                                            </div>
                                            <p className="text-[11px] text-purple-600 mt-2">Dùng bảng phụ này để gõ Phân số, Căn,... Sau đó bấm nút "Chèn" để thêm mã Toán học vào câu hỏi.</p>
                                        </div>

                                        <div className="w-1/2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Điểm số mỗi câu (Tự động chia đều)</label>
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 h-11 px-3 py-2 text-sm text-slate-600 flex items-center font-semibold">
                                                {quizMeta?.max_score ? (quizMeta.max_score / Math.max(1, questions.length + (typeof editingQuestion.id === 'string' && editingQuestion.id.startsWith('temp-') ? 1 : 0))).toFixed(2).replace(/\.00$/, '') : 1}
                                            </div>
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
                                                            placeholder={`Lựa chọn ${idx + 1} (Có thể dùng $$ $$)`}
                                                            value={opt.option_text}
                                                            onChange={(e) => handleOptionChange(idx, 'option_text', e.target.value)}
                                                            className="flex-1 bg-white h-11 rounded-xl"
                                                        />
                                                        <button className="text-slate-400 hover:text-red-500 p-2" onClick={() => removeOption(idx)}>
                                                            <Trash2 className="h-5 w-5" />
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

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block">Đính kèm tài liệu tham khảo (Tùy chọn)</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-white hover:bg-slate-50 transition-colors relative">
                            <input 
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setAiFile(e.target.files[0]);
                                    }
                                }}
                            />
                            {aiFile ? (
                                <div className="text-sm font-semibold text-purple-700">{aiFile.name} ({(aiFile.size/1024).toFixed(1)} KB)</div>
                            ) : (
                                <div className="text-sm text-slate-500">Kéo thả hoặc click để chọn file PDF, Word, TXT (Tối đa 10MB)</div>
                            )}
                        </div>
                        {aiFile && (
                            <div className="text-right">
                                <button className="text-xs text-red-500 hover:text-red-700 font-semibold" onClick={() => setAiFile(null)}>Gỡ bỏ file</button>
                            </div>
                        )}
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