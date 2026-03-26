// src/component/pages/teacher/QuizCreation.js
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createQuiz, getTeacherClasses, getQuizDetail, updateQuiz } from "service/TeacherQuizService";
import { Badge, Button, Card, CardContent, Input, PageHeader } from "component/ui";
import { Clock, Users, ArrowRight, Settings2, Edit3, PlusCircle } from "lucide-react";

function toISO(dtLocal) {
    if (!dtLocal) return null;
    const d = new Date(dtLocal);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

function fromISOToLocal(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

function getMinDateTimeLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().slice(0, 16);
}


export default function QuizCreation() {
    const nav = useNavigate();
    const { classId: classIdFromParams } = useParams();
    const [sp] = useSearchParams();

    // Trigger từ màn quản lý khóa học có thể truyền ?classId=...&quizId=...
    const classIdFromQuery = sp.get("classId");
    const quizIdFromQuery = sp.get("quizId");
    const isEditMode = !!quizIdFromQuery;

    const [teacherClasses, setTeacherClasses] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [classError, setClassError] = useState("");

    const titleRef = useRef(null);

    const [form, setForm] = useState({
        classId: classIdFromQuery || classIdFromParams || "",

        title: "",
        instructions: "",

        // timing
        timeLimitMinutes: 45,

        // open/close time (E2)
        openAtLocal: "",
        closeAtLocal: "",

        // grade & behavior
        attemptLimit: "1", // "1" | "2" | "0"(unlimited)
        gradeMethod: "highest", // highest | average | last
        shuffleQuestions: false,

        reviewOption: "after_submit", // after_submit | after_close

        // points
        maxScore: 10,
    });

    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [isUpcomingClass, setIsUpcomingClass] = useState(false);

    const setField = (k, v) => {
        setForm((p) => ({ ...p, [k]: v }));
        setErrors((p) => ({ ...p, [k]: undefined }));
        setGlobalError("");
    };

    const validateClient = () => {
        const e = {};

        // E1: title required
        if (!form.title.trim()) e.title = "Vui lòng nhập tên bài kiểm tra";

        const openISO = toISO(form.openAtLocal);
        const closeISO = toISO(form.closeAtLocal);

        const now = Date.now();
        // Prevent past dates only on creation
        if (!isEditMode) {
            if (openISO && new Date(openISO).getTime() < now - 60000) {
                e.openAtLocal = "Thời gian bắt đầu không thể ở quá khứ";
            }
            if (closeISO && new Date(closeISO).getTime() < now - 60000) {
                e.closeAtLocal = "Thời gian kết thúc không thể ở quá khứ";
            }
        }

        // E2: close < open
        if (openISO && closeISO) {

            const open = new Date(openISO).getTime();
            const close = new Date(closeISO).getTime();
            if (close <= open) e.closeAtLocal = "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu";
        }

        if (form.timeLimitMinutes !== "" && Number(form.timeLimitMinutes) <= 0) {
            e.timeLimitMinutes = "Time limit phải > 0";
        }

        if (!form.classId) e.classId = "Vui lòng chọn lớp";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoadingData(true);
                // 1. Fetch classes
                const resClasses = await getTeacherClasses();
                const classesData = Array.isArray(resClasses) ? resClasses : resClasses?.data || [];
                setTeacherClasses(classesData);

                let selectedClassId = form.classId;

                if (!selectedClassId && classesData.length > 0) {
                    selectedClassId = classesData[0].id;
                    setField("classId", selectedClassId);
                }

                // 2. Fetch quiz details if in edit mode
                if (isEditMode && quizIdFromQuery && (classIdFromQuery || selectedClassId)) {
                    const cid = classIdFromQuery || selectedClassId;
                    const resQuiz = await getQuizDetail(cid, quizIdFromQuery);
                    const quizData = resQuiz.data || resQuiz;

                    if (quizData) {
                        const settings = quizData.settings_json || {};
                        const parsedInstruct = quizData.instructions ? quizData.instructions.split("\n\n---")[0] : "";

                        setForm(prev => ({
                            ...prev,
                            classId: quizData.class_id || prev.classId,
                            title: quizData.title || "",
                            instructions: parsedInstruct,
                            timeLimitMinutes: quizData.time_limit_minutes || "",
                            openAtLocal: fromISOToLocal(settings.openAt),
                            closeAtLocal: fromISOToLocal(quizData.due_at),
                            attemptLimit: quizData.attempt_limit === null ? "0" : String(quizData.attempt_limit || "1"),
                            gradeMethod: settings.gradeMethod || "highest",
                            shuffleQuestions: !!settings.shuffleQuestions,
                            reviewOption: settings.reviewOption || "after_submit",
                            maxScore: quizData.max_score || 10
                        }));
                    }
                }
            } catch (err) {
                console.error("Error fetching initial data", err);
                setClassError("Không thể tải thông tin. Vui lòng thử lại.");
            } finally {
                setLoadingData(false);
            }
        };

        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, quizIdFromQuery, classIdFromQuery]);

    useEffect(() => {
        if (form.classId && teacherClasses.length > 0) {
            const cls = teacherClasses.find(c => String(c.id) === String(form.classId));
            setIsUpcomingClass(cls && cls.status === "upcoming");
        } else {
            setIsUpcomingClass(false);
        }
    }, [form.classId, teacherClasses]);

    const mapServerValidation = (errBody) => {
        const validationErrors = errBody?.error?.validationErrors;
        if (!Array.isArray(validationErrors)) return;

        const e = {};
        let g = "";

        for (const item of validationErrors) {
            const field = item.field;
            const msg = item.message;

            // field có thể là "title", "closeAt",...
            if (!field) {
                g = msg;
                continue;
            }
            if (field === "openAt") e.openAtLocal = msg;
            else if (field === "closeAt") e.closeAtLocal = msg;
            else e[field] = msg;
        }

        setErrors((p) => ({ ...p, ...e }));
        if (g) setGlobalError(g);
    };

    const buildPayload = () => {
        const openAt = toISO(form.openAtLocal);
        const closeAt = toISO(form.closeAtLocal);

        return {
            title: form.title.trim(),
            instructions: form.instructions?.trim() || "",

            timeLimitMinutes: form.timeLimitMinutes === "" ? null : Number(form.timeLimitMinutes),

            // 0 => unlimited (backend sẽ lưu NULL)
            attemptLimit: Number(form.attemptLimit),

            gradeMethod: form.gradeMethod,
            shuffleQuestions: !!form.shuffleQuestions,

            reviewOption: form.reviewOption,

            openAt,
            closeAt,
            max_score: Number(form.maxScore),
        };
    };

    const onCancel = () => {
        nav(-1);
    };

    const onSave = async ({ goNext }) => {
        setGlobalError("");
        if (!validateClient()) {
            titleRef.current?.focus?.();
            return;
        }

        setSubmitting(true);
        try {
            const payload = buildPayload();
            let res, data;

            if (isEditMode) {
                // CALL API UPDATE QUIZ
                res = await updateQuiz(form.classId, quizIdFromQuery, payload);
                data = res.data || res;
            } else {
                // CALL API CREATE QUIZ
                res = await createQuiz({ classId: form.classId, payload });
                data = res.data || res;
            }

            // Postcondition: quiz created/updated
            if (goNext) {
                const next = data?.next || `/teacher/classes/${form.classId}/quizzes/${data.id || quizIdFromQuery}/questions`;
                nav(next, { replace: true, state: { quiz: data } });
            } else {
                const next = data?.next || `/teacher/classes/${form.classId}/quizzes/${data.id || quizIdFromQuery}/questions`;
                nav(next, { replace: true, state: { quiz: data } });
            }
        } catch (err) {
            // E3: mất mạng / lỗi kết nối
            if (err?.message === "NETWORK_ERROR") {
                setGlobalError("Lỗi kết nối, vui lòng thử lại");
            } else if (err?.status === 400) {
                // map validation error từ backend (E1/E2)
                mapServerValidation(err.body);
                if (!globalError && err.body?.message) setGlobalError(err.body.message);
            } else {
                setGlobalError(err?.body?.message || err?.message || "Có lỗi xảy ra, vui lòng thử lại");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingData) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-slate-500 animate-pulse font-medium">Đang tải cấu hình Quiz...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <PageHeader
                title={isEditMode ? "Chỉnh sửa Quiz" : "Tạo Quiz Mới"}
                subtitle={isEditMode ? "Cập nhật thông tin cấu hình cho bài trắc nghiệm" : "Thiết lập các thông số cơ bản cho bài trắc nghiệm"}
                icon={isEditMode ? <Edit3 className="text-blue-500" /> : <PlusCircle className="text-blue-500" />}
            />

            {globalError ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    {globalError}
                </div>
            ) : null}

            {isUpcomingClass && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-700 flex items-center gap-2">
                    <Clock size={16} />
                    <span>Lớp học chưa bắt đầu (Sắp tới). Bạn không thể tạo hoặc chỉnh sửa Quiz cho lớp này.</span>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                {/* LEFT: Form */}
                <div className="lg:col-span-2 space-y-4">
                    {/* General */}
                    <Card className="hover:shadow-xl transition-all duration-300 border-white hover:border-blue-200 hover:-translate-y-1 bg-white/70 backdrop-blur-sm">
                        <CardContent className="space-y-3">
                            <div className="text-sm font-bold text-slate-900">Thông tin chung</div>

                            <div>
                                <div className="mb-1 text-xs font-semibold text-slate-600">
                                    Lớp áp dụng <span className="text-red-600">*</span>
                                </div>
                                {loadingData ? (
                                    <div className="text-sm text-slate-500">Đang tải danh sách lớp...</div>
                                ) : classError ? (
                                    <div className="text-sm text-red-500">{classError}</div>
                                ) : (
                                    <select
                                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm ${errors.classId ? "border-red-400" : "border-slate-200"
                                            }`}
                                        value={form.classId}
                                        onChange={(e) => setField("classId", e.target.value)}
                                        disabled={teacherClasses.length === 0}
                                    >
                                        <option value="" disabled>-- Chọn lớp học --</option>
                                        {teacherClasses.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {errors.classId ? <div className="mt-1 text-xs font-semibold text-red-600">{errors.classId}</div> : null}
                            </div>

                            <div>
                                <div className="mb-1 text-xs font-semibold text-slate-600">
                                    Tên bài kiểm tra <span className="text-red-600">*</span>
                                </div>
                                <Input
                                    ref={titleRef}
                                    value={form.title}
                                    onChange={(e) => setField("title", e.target.value)}
                                    placeholder="Ví dụ: Quiz 01 — Chapter 1"
                                    className={errors.title ? "border-red-400" : ""}
                                />
                                {errors.title ? <div className="mt-1 text-xs font-semibold text-red-600">{errors.title}</div> : null}
                            </div>

                            <div>
                                <div className="mb-1 text-xs font-semibold text-slate-600">Mô tả / Hướng dẫn (tuỳ chọn)</div>
                                <textarea
                                    className="w-full min-h-[110px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                                    value={form.instructions}
                                    onChange={(e) => setField("instructions", e.target.value)}
                                    placeholder="Gợi ý: thời gian, quy tắc, lưu ý khi làm bài..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timing */}
                    <Card className="hover:shadow-xl transition-all duration-300 border-white hover:border-blue-200 hover:-translate-y-1 bg-white/70 backdrop-blur-sm">
                        <CardContent className="space-y-3">
                            <div className="text-sm font-bold text-slate-900">Thời gian</div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <div className="mb-1 text-xs font-semibold text-slate-600">Thời gian mở</div>
                                    <Input
                                        type="datetime-local"
                                        value={form.openAtLocal}
                                        min={!isEditMode ? getMinDateTimeLocal() : undefined}
                                        onChange={(e) => setField("openAtLocal", e.target.value)}

                                        className={errors.openAtLocal ? "border-red-400" : ""}
                                    />
                                    {errors.openAtLocal ? (
                                        <div className="mt-1 text-xs font-semibold text-red-600">{errors.openAtLocal}</div>
                                    ) : null}
                                </div>

                                <div>
                                    <div className="mb-1 text-xs font-semibold text-slate-600">Thời gian đóng</div>
                                    <Input
                                        type="datetime-local"
                                        value={form.closeAtLocal}
                                        min={form.openAtLocal || (!isEditMode ? getMinDateTimeLocal() : undefined)}
                                        onChange={(e) => setField("closeAtLocal", e.target.value)}

                                        className={errors.closeAtLocal ? "border-red-400" : ""}
                                    />
                                    {errors.closeAtLocal ? (
                                        <div className="mt-1 text-xs font-semibold text-red-600">{errors.closeAtLocal}</div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="max-w-xs">
                                <div className="mb-1 text-xs font-semibold text-slate-600">Giới hạn thời gian làm bài (phút)</div>
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.timeLimitMinutes}
                                    onChange={(e) => setField("timeLimitMinutes", e.target.value)}
                                    className={errors.timeLimitMinutes ? "border-red-400" : ""}
                                />
                                {errors.timeLimitMinutes ? (
                                    <div className="mt-1 text-xs font-semibold text-red-600">{errors.timeLimitMinutes}</div>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Grade & Behavior */}
                    <Card className="hover:shadow-xl transition-all duration-300 border-white hover:border-blue-200 hover:-translate-y-1 bg-white/70 backdrop-blur-sm">
                        <CardContent className="space-y-3">
                            <div className="text-sm font-bold text-slate-900">Điểm số & Hành vi</div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <div className="mb-1 text-xs font-semibold text-slate-600">Số lần làm bài</div>
                                    <select
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                        value={form.attemptLimit}
                                        onChange={(e) => setField("attemptLimit", e.target.value)}
                                    >
                                        <option value="1">1 lần</option>
                                        <option value="2">2 lần</option>
                                        <option value="0">Không giới hạn</option>
                                    </select>
                                </div>

                                <div>
                                    <div className="mb-1 text-xs font-semibold text-slate-600">Cách tính điểm</div>
                                    <select
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                        value={form.gradeMethod}
                                        onChange={(e) => setField("gradeMethod", e.target.value)}
                                    >
                                        <option value="highest">Lấy điểm cao nhất</option>
                                        <option value="average">Lấy điểm trung bình</option>
                                        <option value="last">Lấy điểm lần cuối</option>
                                    </select>
                                </div>

                                <div>
                                    <div className="mb-1 text-xs font-semibold text-slate-600">Thang điểm tối đa</div>
                                    <Input
                                        type="number"
                                        value={form.maxScore}
                                        onChange={(e) => setField("maxScore", e.target.value)}
                                        min="0"
                                        step="0.5"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.shuffleQuestions}
                                    onChange={(e) => setField("shuffleQuestions", e.target.checked)}
                                />
                                Trộn câu hỏi
                            </label>
                        </CardContent>
                    </Card>

                    {/* Review Options */}
                    <Card className="hover:shadow-xl transition-all duration-300 border-white hover:border-blue-200 hover:-translate-y-1 bg-white/70 backdrop-blur-sm">
                        <CardContent className="space-y-3">
                            <div className="text-sm font-bold text-slate-900">Tuỳ chọn xem lại</div>

                            <div className="space-y-2 text-sm text-slate-700">
                                <label className="flex items-start gap-2">
                                    <input
                                        type="radio"
                                        name="reviewOption"
                                        checked={form.reviewOption === "after_submit"}
                                        onChange={() => setField("reviewOption", "after_submit")}
                                    />
                                    <div>
                                        <div className="font-semibold">Xem điểm/đáp án ngay sau khi nộp</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-2">
                                    <input
                                        type="radio"
                                        name="reviewOption"
                                        checked={form.reviewOption === "after_close"}
                                        onChange={() => setField("reviewOption", "after_close")}
                                    />
                                    <div>
                                        <div className="font-semibold">Chỉ xem sau khi đóng đề</div>
                                    </div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: Preview / Summary */}
                <div className="space-y-4">
                    <Card className="border-blue-100 shadow-sm sticky top-6">
                        <div className="bg-blue-50 rounded-t-xl px-5 py-3 border-b border-blue-100 flex items-center gap-2 text-blue-800">
                            <Settings2 size={18} />
                            <span className="font-bold">Tóm tắt cấu hình</span>
                        </div>
                        <CardContent className="space-y-4 pt-4">
                            {!isEditMode && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 shadow-sm">
                                    <div className="font-bold flex items-center gap-1.5"><Clock size={16} /> Lưu ý quan trọng:</div>
                                    <div className="mt-1 opacity-90 leading-snug">Sau khi <b className="font-semibold">Lưu cấu hình</b>, hệ thống sẽ tạo một Quiz <b>trống</b> và tự động chuyển bạn sang giao diện Soạn Câu Hỏi.</div>
                                </div>
                            )}

                            <div className="space-y-3.5 text-sm">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Trạng thái</span>
                                    {isEditMode ? <Badge tone="green">Đang biên soạn</Badge> : <Badge tone="amber">Mới (Draft)</Badge>}
                                </div>

                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Thời gian mở</span>
                                    <span className="font-bold text-slate-800">{form.openAtLocal ? new Date(form.openAtLocal).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : "Tự do chờ mở"}</span>
                                </div>

                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium flex items-center gap-1.5"><Clock size={14} /> Giới hạn làm</span>
                                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">{form.timeLimitMinutes || "-"} phút</span>
                                </div>

                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium flex items-center gap-1.5"><Users size={14} /> Số lần làm</span>
                                    <span className="font-semibold text-slate-800">
                                        {form.attemptLimit === "0" ? "Không giới hạn" : `${form.attemptLimit} lần`}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Thang điểm tối đa</span>
                                    <span className="font-bold text-slate-800">{form.maxScore || "10"} điểm</span>
                                </div>


                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Lấy điểm</span>
                                    <span className="font-semibold text-slate-800 text-right">
                                        {form.gradeMethod === "highest" && "Cao nhất"}
                                        {form.gradeMethod === "average" && "Trung bình"}
                                        {form.gradeMethod === "last" && "Lần cuối"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Trộn câu hỏi</span>
                                    <span className="font-semibold text-slate-800">{form.shuffleQuestions ? "Có" : "Không"}</span>
                                </div>
                            </div>

                            {submitting ? (
                                <div className="text-center pt-2 text-sm font-semibold text-blue-600 animate-pulse">Đang lưu cấu hình...</div>
                            ) : null}

                            <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                                <Button className="w-full justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition-all duration-200" onClick={() => onSave({ goNext: true })} disabled={submitting || isUpcomingClass}>
                                    {isEditMode ? "Lưu biên soạn đề" : "Lưu & Bắt đầu soạn đề"} <ArrowRight size={18} className="ml-1.5 animate-pulse" />
                                </Button>
                                <Button variant="outline" className="w-full justify-center py-2.5 bg-white shadow-sm hover:bg-slate-50 transition-colors rounded-xl" onClick={onCancel} disabled={submitting}>
                                    Hủy bỏ
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}