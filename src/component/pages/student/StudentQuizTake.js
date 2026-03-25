import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getAttemptState, saveAnswer } from "service/StudentQuizService";
import { Button, Card, CardContent } from "component/ui";
import Latex from "react-latex-next";
import "katex/dist/katex.min.css";

// Debounce helper
function useDebounceCallback(callback, delay) {
    const timeoutRef = useRef(null);
    return useCallback((...args) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}

function formatTime(secs) {
    if (secs === null || secs === undefined) return "--:--:--";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StudentQuizTake() {
    const { submissionId } = useParams();
    const nav = useNavigate();
    const location = useLocation();
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [quizTitle, setQuizTitle] = useState("Bài kiểm tra");
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    
    // answers: { [questionId]: string | string[] }
    const [answers, setAnswers] = useState({});
    const [savingStatus, setSavingStatus] = useState({}); // { [questionId]: 'saving' | 'saved' | 'error' }
    
    // Timer
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const [timeExpired, setTimeExpired] = useState(false);
    const timerRef = useRef(null);

    // Anti-Cheat
    const [isScreenHidden, setIsScreenHidden] = useState(false);
    const [cheatWarning, setCheatWarning] = useState("");
    const violationCountRef = useRef(0);
    const isAutoSubmittingRef = useRef(false);

    // Keep stable reference to avoid stale closures
    const stateRef = useRef({ submissionId, answers });
    useEffect(() => {
        stateRef.current = { submissionId, answers };
    }, [submissionId, answers]);

    // -------------------------------------------------------
    // Load attempt state
    // -------------------------------------------------------
    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                const res = await getAttemptState(submissionId);
                // res shape: { success, message, statusCode, data: { attempt, quiz, questions } }
                if (!res?.success) {
                    alert(res?.message || "Lỗi tải dữ liệu bài thi. Vui lòng thử lại.");
                    nav("/student");
                    return;
                }
                const data = res.data;
                
                if (data?.autoSubmitted) {
                    alert("Bài làm của bạn đã hết hạn và được tự động nộp.");
                    nav("/student/grades");
                    return;
                }
                
                setQuizTitle(data?.quiz?.title || "Bài kiểm tra");

                const qs = data?.questions || [];
                setQuestions(qs);

                // Restore saved answers from the attempt state
                const restoredAnswers = {};
                qs.forEach(q => {
                    const ans = q.answer;
                    if (!ans) return;
                    if (ans.selectedOptionIds) {
                        restoredAnswers[String(q.id)] = ans.selectedOptionIds.map(String);
                    } else if (ans.selectedOptionId) {
                        restoredAnswers[String(q.id)] = String(ans.selectedOptionId);
                    } else if (ans.answerText) {
                        restoredAnswers[String(q.id)] = ans.answerText;
                    }
                });
                setAnswers(restoredAnswers);
                
                // Use remainingSeconds from state (passed from start page) or from API
                const remFromState = location.state?.remainingSeconds;
                const remFromApi = data?.attempt?.remainingSeconds;
                const rem = remFromState !== undefined ? remFromState : remFromApi;
                setRemainingSeconds(rem ?? null);
                
            } catch (err) {
                console.error("Error fetching attempt:", err);
                alert("Lỗi tải dữ liệu bài thi. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };
        fetchAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submissionId]);

    // -------------------------------------------------------
    // Countdown timer
    // -------------------------------------------------------
    useEffect(() => {
        if (remainingSeconds === null || timeExpired) return;
        if (remainingSeconds <= 0) {
            handleTimeUp();
            return;
        }
        timerRef.current = setInterval(() => {
            setRemainingSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remainingSeconds === null ? null : Math.floor(remainingSeconds / 60), timeExpired]);

    useEffect(() => {
        if (remainingSeconds === 0 && !timeExpired) {
            handleTimeUp();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remainingSeconds]);

    // -------------------------------------------------------
    // Auto-submit when time expires
    // -------------------------------------------------------
    const handleTimeUp = async (reason = "Đã hết thời gian") => {
        if (timeExpired || isAutoSubmittingRef.current) return;
        isAutoSubmittingRef.current = true;
        setTimeExpired(true);
        clearInterval(timerRef.current);
        try {
            setSubmitting(true);
            const { post } = await import("../../../utils/request");
            
            // If the reason includes "gian lận", we signal the backend to force-publish the immediate result
            const isCheat = reason.toLowerCase().includes("gian lận");
            const res = await post(`api/student/attempts/${stateRef.current.submissionId}/submit`, {
                cheat_detected: isCheat
            });

            nav("/student/quiz-result", {
                state: {
                    success: res?.success !== false,
                    result: { ...res?.data, message: `${reason}. Bài làm của bạn đã được tự động nộp.` }
                },
                replace: true
            });
        } catch (err) {
            console.error("Auto-submit error:", err);
            setSubmitError("Lỗi tự động nộp bài. Vui lòng báo cáo giáo viên.");
            try {
                nav("/student/quiz-result", {
                    state: { success: false, errorMessage: "Lỗi hệ thống khi tự động nộp bài. Báo cáo giáo viên." },
                    replace: true
                });
            } catch (e) {
                window.location.href = '/student/quiz-result';
            }
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------------------------------------------
    // Auto-save with debounce
    // -------------------------------------------------------
    const doSave = useCallback(async (questionId, payload) => {
        setSavingStatus(prev => ({ ...prev, [questionId]: 'saving' }));
        try {
            await saveAnswer(stateRef.current.submissionId, questionId, payload);
            setSavingStatus(prev => ({ ...prev, [questionId]: 'saved' }));
            // Clear "saved" indicator after 2s
            setTimeout(() => {
                setSavingStatus(prev => {
                    if (prev[questionId] === 'saved') {
                        const next = { ...prev };
                        delete next[questionId];
                        return next;
                    }
                    return prev;
                });
            }, 2000);
        } catch (err) {
            console.error("Auto-save error:", err);
            setSavingStatus(prev => ({ ...prev, [questionId]: 'error' }));
        }
    }, []);

    const debouncedSave = useDebounceCallback(doSave, 500);

    // -------------------------------------------------------
    // Answer handlers
    // -------------------------------------------------------
    const onSingleChoice = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: String(optionId) }));
        debouncedSave(String(questionId), { selectedOptionId: optionId });
    };

    const onMultiChoice = (questionId, optionId) => {
        setAnswers(prev => {
            const cur = Array.isArray(prev[questionId]) ? prev[questionId] : [];
            const oid = String(optionId);
            const next = cur.includes(oid) ? cur.filter(x => x !== oid) : [...cur, oid];
            debouncedSave(String(questionId), { selectedOptionIds: next });
            return { ...prev, [questionId]: next };
        });
    };

    const onTextAnswer = (questionId, text) => {
        setAnswers(prev => ({ ...prev, [questionId]: text }));
        debouncedSave(String(questionId), { answerText: text });
    };

    // -------------------------------------------------------
    // Detect question type from options
    // -------------------------------------------------------
    const getQuestionType = (q) => {
        if (!q.options || q.options.length === 0) return 'text';
        // Count correct options to determine if single or multi
        // Since FE doesn't know which are correct, we use question_type field if available
        // Fallback: if backend doesn't send type, default to single
        return q.question_type || q.type || 'single_choice';
    };

    const isAnswered = (q) => {
        const ans = answers[String(q.id)];
        if (Array.isArray(ans)) return ans.length > 0;
        return ans !== undefined && ans !== null && ans !== '';
    };

    // -------------------------------------------------------
    // Navigation
    // -------------------------------------------------------
    const goToSummary = () => {
        nav(`/student/attempts/${submissionId}/summary`);
    };

    // -------------------------------------------------------
    // Anti-Cheat Logic (no fullscreen required)
    // Detection: tab switching & screenshot attempts
    // -------------------------------------------------------
    useEffect(() => {
        // Prevent accidental tab closing or navigation
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "Bạn đang làm bài thi. Nếu thoát bây giờ, bài thi sẽ bị tính là tự động nộp hoặc mất kết quả!";
            return e.returnValue;
        };

        const handleContextMenu = (e) => e.preventDefault();
        
        const handleCopy = (e) => {
            e.preventDefault();
            e.clipboardData?.setData('text/plain', 'Cheating is not allowed');
        };

        const handleViolation = (reason) => {
            if (isAutoSubmittingRef.current) return;
            
            violationCountRef.current += 1;
            const count = violationCountRef.current;
            
            if (count >= 2) {
                // Double violation: LOCK DOWN and SUBMIT
                setIsScreenHidden(true);
                setCheatWarning(`PHÁT HIỆN GIAN LẬN: ${reason}. Vi phạm lần 2, hệ thống sẽ tự động thu bài và chấm điểm ngay lập tức.`);
                
                // Cleanup all listeners immediately to prevent multiple triggers
                cleanupListeners();
                
                // Trigger auto-submit with short delay for UI feedback
                setTimeout(() => {
                    handleTimeUp("Phát hiện gian lận (vi phạm lần 2)");
                }, 1500);
            } else {
                setIsScreenHidden(true);
                setCheatWarning(`CẢNH BÁO LẦN 1: ${reason}. Vi phạm lần nữa bài thi sẽ bị thu lại ngay lập tức!`);
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) handleViolation("Chuyển tab hoặc ẩn cửa sổ trình duyệt");
        };

        const handleWindowBlur = () => {
            handleViolation("Rời khỏi cửa sổ bài thi (chụp màn hình hoặc chuyển ứng dụng)");
        };

        const handleWindowFocus = () => {
            if (violationCountRef.current < 2) {
                setIsScreenHidden(false);
                setCheatWarning("");
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
                e.preventDefault();
                navigator.clipboard.writeText("Cấm chụp màn hình").catch(()=>{});
                handleViolation("Sử dụng phím Chụp màn hình (PrintScreen)");
            }
            if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c'].includes(e.key.toLowerCase())) e.preventDefault();
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) e.preventDefault();
        };

        const cleanupListeners = () => {
            window.removeEventListener("contextmenu", handleContextMenu);
            window.removeEventListener("copy", handleCopy);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleWindowBlur);
            window.removeEventListener("focus", handleWindowFocus);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };

        window.addEventListener("contextmenu", handleContextMenu);
        window.addEventListener("copy", handleCopy);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleWindowBlur);
        window.addEventListener("focus", handleWindowFocus);
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return cleanupListeners;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // -------------------------------------------------------
    // Render
    // -------------------------------------------------------
    if (loading) {
        return (
            <div className="flex items-center justify-center h-80 text-slate-500">
                <div className="text-center space-y-3">
                    <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div className="font-medium">Đang tải câu hỏi...</div>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return <div className="p-8 text-center text-slate-500">Bài kiểm tra không có câu hỏi nào.</div>;
    }

    const currentQ = questions[currentIdx];
    const qId = String(currentQ.id);
    const qType = getQuestionType(currentQ);
    const curAnswer = answers[qId];
    const isExpiring = remainingSeconds !== null && remainingSeconds <= 120;
    const isCritical = remainingSeconds !== null && remainingSeconds <= 30;
    const currentSaveStatus = savingStatus[qId];

    // Determine if multiple correct answer question
    const isMultiChoice = qType === 'multiple_choice' || qType === 'multi_choice';
    const isTextType = qType === 'text' || qType === 'essay' || (currentQ.options?.length === 0);

    return (
        <div className="relative min-h-screen bg-slate-50 select-none pb-10">
            {/* Anti-Print Style */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print { html, body { display: none !important; } }
            `}} />

            {/* Anti-Cheat Overlay */}
            {isScreenHidden && (
                <div 
                    className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center text-white p-8 text-center cursor-pointer"
                    onClick={() => {
                        if (violationCountRef.current < 2) {
                            setIsScreenHidden(false);
                            setCheatWarning("");
                        }
                    }}
                >
                    <div className="text-8xl mb-6">⚠️</div>
                    <h2 className="text-4xl font-black text-red-500 mb-4">HỆ THỐNG PHÁT HIỆN GIAN LẬN</h2>
                    <p className="text-2xl mb-8 font-medium">{cheatWarning}</p>
                    {violationCountRef.current < 2 && (
                        <p className="text-lg text-slate-400">Nhấn vào đây hoặc quay lại tab này để tiếp tục làm bài.</p>
                    )}
                </div>
            )}

            <div className={`mx-auto flex max-w-[1280px] gap-5 py-6 items-start px-4 ${isScreenHidden ? 'opacity-0 pointer-events-none' : ''}`}>
                {/* ─── LEFT: Question Content ─── */}
                <div className="flex-1 min-w-0 space-y-4">

                {/* Quiz Title Bar */}
                <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-5 py-3 shadow-sm">
                    <h1 className="font-bold text-slate-800 text-base truncate">{quizTitle}</h1>
                    <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                        {currentSaveStatus === 'saving' && (
                            <span className="flex items-center gap-1 text-blue-500 font-semibold">
                                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse inline-block"></span>
                                Đang lưu...
                            </span>
                        )}
                        {currentSaveStatus === 'saved' && (
                            <span className="flex items-center gap-1 text-green-600 font-semibold">
                                ✓ Đã lưu
                            </span>
                        )}
                        {currentSaveStatus === 'error' && (
                            <span className="flex items-center gap-1 text-red-500 font-semibold">
                                ✕ Lỗi lưu
                            </span>
                        )}
                    </div>
                </div>

                {/* Question Card */}
                <Card className="shadow-sm">
                    <CardContent className="p-6">
                        
                        {/* Question Header */}
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div>
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-full">
                                    Câu hỏi {currentIdx + 1}/{questions.length}
                                </span>
                                {currentQ.points != null && (
                                    <span className="ml-2 text-xs font-semibold text-slate-500">
                                        ({currentQ.points} điểm)
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium text-slate-400 shrink-0 mt-1">
                                {isMultiChoice ? "Chọn nhiều đáp án" : isTextType ? "Trả lời ngắn" : "Chọn một đáp án"}
                            </span>
                        </div>

                        {/* Question Text */}
                        <div className="text-base font-medium text-slate-900 leading-relaxed mb-6 whitespace-pre-wrap">
                            <Latex>{currentQ.text || currentQ.question_text || currentQ.content}</Latex>
                        </div>
                        
                        {/* ─── SINGLE CHOICE ─── */}
                        {!isMultiChoice && !isTextType && currentQ.options?.length > 0 && (
                            <div className="space-y-3">
                                {currentQ.options.map((opt, oi) => {
                                    const oid = String(opt.id);
                                    const isSelected = curAnswer === oid;
                                    return (
                                        <label
                                            key={oid}
                                            className={`flex items-start gap-3.5 rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-sm group
                                                ${isSelected
                                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`q_${qId}`}
                                                checked={isSelected}
                                                onChange={() => onSingleChoice(qId, oid)}
                                                className="mt-0.5 h-4 w-4 text-blue-600 accent-blue-600 shrink-0"
                                                disabled={timeExpired || submitting}
                                            />
                                            <span className={`text-sm font-medium leading-relaxed ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                                                <span className="font-bold mr-2 text-slate-400">
                                                    {String.fromCharCode(65 + oi)}.
                                                </span>
                                                <Latex>{opt.text || opt.option_text || opt.content}</Latex>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {/* ─── MULTIPLE CHOICE ─── */}
                        {isMultiChoice && currentQ.options?.length > 0 && (
                            <div className="space-y-3">
                                {currentQ.options.map((opt, oi) => {
                                    const oid = String(opt.id);
                                    const curArr = Array.isArray(curAnswer) ? curAnswer : [];
                                    const isChecked = curArr.includes(oid);
                                    return (
                                        <label
                                            key={oid}
                                            className={`flex items-start gap-3.5 rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-sm
                                                ${isChecked
                                                    ? 'border-purple-500 bg-purple-50 shadow-sm'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => onMultiChoice(qId, oid)}
                                                className="mt-0.5 h-4 w-4 text-purple-600 accent-purple-600 shrink-0"
                                                disabled={timeExpired || submitting}
                                            />
                                            <span className={`text-sm font-medium leading-relaxed ${isChecked ? 'text-purple-800' : 'text-slate-700'}`}>
                                                <span className="font-bold mr-2 text-slate-400">
                                                    {String.fromCharCode(65 + oi)}.
                                                </span>
                                                <Latex>{opt.text || opt.option_text || opt.content}</Latex>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {/* ─── TEXT / SHORT ANSWER ─── */}
                        {isTextType && (
                            <textarea
                                value={typeof curAnswer === 'string' ? curAnswer : ''}
                                onChange={(e) => onTextAnswer(qId, e.target.value)}
                                placeholder="Nhập câu trả lời của bạn tại đây..."
                                rows={5}
                                disabled={timeExpired || submitting}
                                className="w-full rounded-xl border-2 border-slate-200 p-4 text-sm text-slate-800 focus:border-blue-400 focus:outline-none resize-y transition-colors disabled:bg-slate-50"
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        disabled={currentIdx === 0 || submitting || timeExpired}
                        onClick={() => setCurrentIdx(prev => prev - 1)}
                    >
                        ← Trang trước
                    </Button>

                    {currentIdx === questions.length - 1 ? (
                        <Button
                            variant="primary"
                            onClick={goToSummary}
                            disabled={submitting || timeExpired}
                            className="bg-green-600 hover:bg-green-700 border-green-600"
                        >
                            Hoàn thành bài làm ✓
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={() => setCurrentIdx(prev => prev + 1)}
                            disabled={submitting || timeExpired}
                        >
                            Trang tiếp theo →
                        </Button>
                    )}
                </div>

                {submitError && (
                    <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                        {submitError}
                    </div>
                )}
                
                {timeExpired && (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700 text-center">
                        ⏰ Đã hết giờ. Bài làm đang được tự động nộp...
                    </div>
                )}
            </div>

            {/* ─── RIGHT: Timer & Palette ─── */}
            <div className="w-[280px] shrink-0 space-y-4 sticky top-6">
                
                {/* Timer */}
                <Card className={`overflow-hidden border-2 ${isCritical ? 'border-red-400' : isExpiring ? 'border-amber-400' : 'border-slate-200'}`}>
                    <div className={`text-center px-4 py-4 ${isCritical ? 'bg-red-50' : isExpiring ? 'bg-amber-50' : 'bg-white'}`}>
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                            {remainingSeconds === null ? "Không có giới hạn thời gian" : "Thời gian còn lại"}
                        </div>
                        <div className={`text-4xl font-black font-mono tracking-tight mt-1
                            ${isCritical ? 'text-red-600 animate-pulse' : isExpiring ? 'text-amber-600' : 'text-slate-900'}`}
                        >
                            {formatTime(remainingSeconds)}
                        </div>
                    </div>
                </Card>

                {/* Question Palette */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-bold text-slate-800">Câu hỏi</div>
                            <div className="text-xs text-slate-400">
                                {questions.filter(q => isAnswered(q)).length}/{questions.length} đã làm
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5">
                            {questions.map((q, idx) => {
                                const isCurrent = currentIdx === idx;
                                const answered = isAnswered(q);
                                let btnClass = "h-9 w-full flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer transition-all ";
                                if (isCurrent) {
                                    btnClass += "ring-2 ring-slate-800 ring-offset-1 bg-slate-900 text-white";
                                } else if (answered) {
                                    btnClass += "bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200";
                                } else {
                                    btnClass += "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100";
                                }
                                return (
                                    <button
                                        key={String(q.id)}
                                        onClick={() => setCurrentIdx(idx)}
                                        className={btnClass}
                                        title={answered ? `Câu ${idx + 1}: Đã trả lời` : `Câu ${idx + 1}: Chưa trả lời`}
                                        disabled={timeExpired || submitting}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Legend */}
                        <div className="mt-4 flex flex-col gap-1.5 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded bg-blue-200 border border-blue-300 shrink-0"></div>
                                <span>Đã trả lời</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded bg-slate-100 border border-slate-300 shrink-0"></div>
                                <span>Chưa trả lời</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded bg-slate-900 shrink-0"></div>
                                <span>Đang xem</span>
                            </div>
                        </div>

                        <div className="text-center text-xs text-slate-400 mt-3 italic border-t pt-3">
                            Bài làm được tự động lưu
                        </div>
                        
                        <Button
                            className="w-full mt-3"
                            variant="outline"
                            onClick={goToSummary}
                            disabled={submitting || timeExpired}
                        >
                            Nộp bài →
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
        </div>
    );
}
