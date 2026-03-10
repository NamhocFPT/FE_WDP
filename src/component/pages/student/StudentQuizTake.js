import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAttemptState, saveAnswer, getAttemptSummary, submitAttempt } from "service/StudentQuizService";
import { Button, Card, CardContent, PageHeader } from "component/ui";

// Helper hook for debouncing
function useDebounceCallback(callback, delay) {
    const timeoutRef = useRef(null);
    return useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}

export default function StudentQuizTake() {
    const { submissionId } = useParams();
    const nav = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOptionId | [selectedOptionIds] | text }
    
    // Timer
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const timerRef = useRef(null);

    // Dùng ref lưu reference mới nhất cho current/answers tránh scope cũ trong timeout
    const currentDataRef = useRef({ submissionId, answers });
    useEffect(() => {
        currentDataRef.current = { submissionId, answers };
    }, [submissionId, answers]);

    // Lấy chi tiết bài khi mount
    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                const res = await getAttemptState(submissionId);
                const data = res?.data || res;
                // Giả map backend model:
                setQuestions(data.questions || []);
                setRemainingSeconds(data.remainingSeconds || null);
                setAnswers(data.savedAnswers || {}); // Khôi phục if resume
            } catch (err) {
                console.error(err);
                alert("Lỗi lấy dữ liệu bài thi");
            } finally {
                setLoading(false);
            }
        };
        fetchAttempt();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submissionId]);

    // Bộ đếm đếm ngược
    useEffect(() => {
        if (remainingSeconds === null || remainingSeconds <= 0) return;
        timerRef.current = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remainingSeconds]);

    // Luồng tự động khi hết giờ
    const handleTimeUp = async () => {
        try {
            setSubmitting(true);
            await submitAttempt(currentDataRef.current.submissionId);
            alert("Đã hết thời gian. Bài làm của bạn đã được tự động nộp.");
            nav(`/student/grades`); // Chuyển hướng tới grade hoặc summary closed
        } catch (err) {
            console.error("Auto Submit err", err);
            setSubmitError("Lỗi tự động thu bài, hãy báo cáo giảng viên.");
        } finally {
            setSubmitting(false);
        }
    };

    // Auto-save debounced wrapper (dùng debounce 300ms, có thể tăng)
    const debouncedSave = useDebounceCallback(async (questionId, payload) => {
        try {
            await saveAnswer(currentDataRef.current.submissionId, questionId, payload);
            console.log("Auto-save success:", questionId, payload);
        } catch (err) {
            console.error("Auto-save flag issue:", err);
            // Xử lý báo lỗi nhẹ
        }
    }, 500);

    const onOptionChange = (questionId, val, type) => {
        let payload = {};
        if (type === "single") {
            payload = { selectedOptionId: val };
            setAnswers(prev => ({ ...prev, [questionId]: val }));
        } else if (type === "multi") {
            setAnswers(prev => {
                const currentArr = Array.isArray(prev[questionId]) ? prev[questionId] : [];
                let newArr;
                if (currentArr.includes(val)) {
                    newArr = currentArr.filter(id => id !== val);
                } else {
                    newArr = [...currentArr, val];
                }
                payload = { selectedOptionIds: newArr };
                return { ...prev, [questionId]: newArr };
            });
        }

        debouncedSave(questionId, payload);
    };

    const handleFinish = () => {
        // Normal Flow b6, chuyển trang Summary
        nav(`/student/attempts/${submissionId}/summary`);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Đang tải câu hỏi...</div>;
    if (questions.length === 0) return <div className="p-8 text-center text-slate-500">Bài kiểm tra không có câu hỏi nào.</div>;

    const currentQ = questions[currentQuestionIndex];
    // Timer format mm:ss
    const formatTime = (secs) => {
        if (secs === null) return "--:--";
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const isExpiring = remainingSeconds !== null && remainingSeconds < 60; // Dưới 1 phút thì đỏ

    return (
        <div className="mx-auto flex max-w-[1200px] gap-6 py-6 items-start">
            
            {/* Left: Question Content */}
            <div className="flex-1 space-y-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="mb-4 text-sm font-bold text-slate-500">Câu hỏi {currentQuestionIndex + 1} / {questions.length}</div>
                        <div className="text-lg font-medium text-slate-900 mb-6">
                            {currentQ.content}
                        </div>
                        
                        <div className="space-y-3">
                            {/* RENDER DYNAMIC OPTIONS dựa trên Q-Type. Dưới đây tạm cho là single/radio */}
                            {currentQ.options?.map(opt => {
                                const isSelected = answers[currentQ.id] === opt.id;
                                return (
                                    <label key={opt.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-blue-50 border-blue-500' : 'border-slate-200'}`}>
                                        <input 
                                            type="radio" 
                                            name={`q_${currentQ.id}`} 
                                            checked={isSelected}
                                            onChange={() => onOptionChange(currentQ.id, opt.id, "single")}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span className="text-sm font-medium text-slate-700">{opt.content}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                    <Button 
                        variant="outline" 
                        disabled={currentQuestionIndex === 0} 
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    >
                        Trang trước
                    </Button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <Button variant="primary" onClick={handleFinish} disabled={submitting}>
                            Hoàn thành bài làm (Tới Summary)
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>
                            Trang tiếp theo
                        </Button>
                    )}
                </div>

                {submitError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                        {submitError}
                    </div>
                )}
            </div>

            {/* Right: Palette & Timer */}
            <div className="w-[300px] shrink-0 space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-sm font-semibold text-slate-500 mb-1">Thời gian còn lại</div>
                        <div className={`text-3xl font-bold font-mono tracking-tight ${isExpiring ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                            {formatTime(remainingSeconds)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-semibold text-slate-900 mb-3">Thanh điều hướng</div>
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => {
                                const isCurrent = currentQuestionIndex === idx;
                                const isAnswered = answers[q.id] !== undefined;

                                let cls = "h-10 w-10 flex items-center justify-center rounded border text-sm font-medium cursor-pointer transition-colors";
                                
                                if (isCurrent) {
                                    cls += " border-2 border-slate-900 bg-white";
                                } else if (isAnswered) {
                                  // Đã điền
                                  cls += " bg-blue-100/50 border-blue-200 text-blue-700 hover:bg-blue-100";
                                } else {
                                  // Trống
                                  cls += " bg-white border-slate-200 text-slate-500 hover:bg-slate-50";
                                }

                                return (
                                    <button 
                                        key={q.id} 
                                        onClick={() => setCurrentQuestionIndex(idx)} 
                                        className={cls}
                                        title={isAnswered ? "Đã trả lời" : "Chưa trả lời"}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 text-center text-xs text-slate-500">
                            Hệ thống tự động lưu nháp.
                        </div>
                        <Button className="w-full mt-4" variant="outline" onClick={handleFinish}>Nộp bài nhanh</Button>
                    </CardContent>
                </Card>
            </div>
            
        </div>
    );
}
