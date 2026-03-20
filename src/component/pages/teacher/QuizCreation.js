// src/component/pages/teacher/QuizCreation.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createQuiz, getTeacherClasses } from "service/TeacherQuizService";
import { Badge, Button, Card, CardContent, Input, PageHeader } from "component/ui";

function toISO(dtLocal) {
    if (!dtLocal) return null;
    const d = new Date(dtLocal);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

export default function QuizCreation() {
    const nav = useNavigate();
    const [sp] = useSearchParams();

    // Trigger từ màn quản lý khóa học có thể truyền ?classId=...
    const classIdFromQuery = sp.get("classId");

    const [teacherClasses, setTeacherClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [classError, setClassError] = useState("");

    const titleRef = useRef(null);

    const [form, setForm] = useState({
        classId: classIdFromQuery || "",

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

        // review
        reviewOption: "after_submit", // after_submit | after_close
    });

    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const setField = (k, v) => {
        setForm((p) => ({ ...p, [k]: v }));
        setErrors((p) => ({ ...p, [k]: undefined }));
        setGlobalError("");
    };

    const validateClient = () => {
        const e = {};

        // E1: title required
        if (!form.title.trim()) e.title = "Vui lòng nhập tên bài kiểm tra";

        // E2: close < open
        const openISO = toISO(form.openAtLocal);
        const closeISO = toISO(form.closeAtLocal);
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
        const fetchClasses = async () => {
            try {
                setLoadingClasses(true);
                const res = await getTeacherClasses();
                // Giả sử API trả về mảng trực tiếp hoặc nằm trong res.data
                const classesData = Array.isArray(res) ? res : res?.data || [];
                setTeacherClasses(classesData);

                // Nếu chưa có classId trong form thì set mặc định là lớp đầu tiên
                if (!form.classId && classesData.length > 0) {
                    setField("classId", classesData[0].id);
                }
            } catch (err) {
                setClassError("Không thể tải danh sách lớp học.");
            } finally {
                setLoadingClasses(false);
            }
        };

        fetchClasses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

            // CALL API UC_TEA_08
            const res = await createQuiz({ classId: form.classId, payload });
            const data = res.data; // The actual quiz object from the API response
            
            // backend data: { id, type, status:'draft', classId, next }

            // Postcondition: quiz created "Trống" (draft, chưa có câu hỏi)
            // Normal flow step 9: chuyển sang UC_TEA_09 quản lý câu hỏi
            if (goNext) {
                // ưu tiên dùng "next" từ BE (đúng spec)
                const next = data?.next || `/teacher/classes/${form.classId}/quizzes/${data.id}/questions`;
                nav(next, { replace: true, state: { quiz: data } });
            } else {
                // Save & Show (chưa có quiz detail thì đưa sang UC_TEA_09 luôn)
                const next = data?.next || `/teacher/classes/${form.classId}/quizzes/${data.id}/questions`;
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

    return (
        <div>
            <PageHeader
                title="Tạo Quiz Online"
                right={[
                    <Button key="cancel" variant="outline" onClick={onCancel} disabled={submitting}>
                        Hủy bỏ
                    </Button>,
                    <Button key="save" onClick={() => onSave({ goNext: false })} disabled={submitting}>
                        Lưu & Hiển thị
                    </Button>,
                    <Button key="save2" variant="primary" onClick={() => onSave({ goNext: true })} disabled={submitting}>
                        Lưu & Tiếp tục
                    </Button>,
                ]}
            />

            {globalError ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    {globalError}
                </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
                {/* LEFT: Form */}
                <div className="lg:col-span-2 space-y-4">
                    {/* General */}
                    <Card>
                        <CardContent className="space-y-3">
                            <div className="text-sm font-bold text-slate-900">Thông tin chung</div>

                            <div>
                                <div className="mb-1 text-xs font-semibold text-slate-600">
                                    Lớp áp dụng <span className="text-red-600">*</span>
                                </div>
                                {loadingClasses ? (
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
                    <Card>
                        <CardContent className="space-y-3">
                            <div className="text-sm font-bold text-slate-900">Thời gian (Timing)</div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <div className="mb-1 text-xs font-semibold text-slate-600">Thời gian mở (openAt)</div>
                                    <Input
                                        type="datetime-local"
                                        value={form.openAtLocal}
                                        onChange={(e) => setField("openAtLocal", e.target.value)}
                                        className={errors.openAtLocal ? "border-red-400" : ""}
                                    />
                                    {errors.openAtLocal ? (
                                        <div className="mt-1 text-xs font-semibold text-red-600">{errors.openAtLocal}</div>
                                    ) : null}
                                </div>

                                <div>
                                    <div className="mb-1 text-xs font-semibold text-slate-600">Thời gian đóng (closeAt)</div>
                                    <Input
                                        type="datetime-local"
                                        value={form.closeAtLocal}
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
                    <Card>
                        <CardContent className="space-y-3">
                            <div className="text-sm font-bold text-slate-900">Điểm số & Hành vi (Grade & Behavior)</div>

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
                                    <div className="mt-1 text-xs text-slate-500">* Unlimited sẽ gửi attemptLimit=0</div>
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
                            </div>

                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.shuffleQuestions}
                                    onChange={(e) => setField("shuffleQuestions", e.target.checked)}
                                />
                                Trộn câu hỏi (Shuffle within questions)
                            </label>
                        </CardContent>
                    </Card>

                    {/* Review Options */}
                    <Card>
                        <CardContent className="space-y-3">
                            <div className="text-sm font-bold text-slate-900">Tuỳ chọn xem lại (Review options)</div>

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
                                        <div className="text-xs text-slate-500">reviewOption = after_submit</div>
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
                                        <div className="text-xs text-slate-500">reviewOption = after_close</div>
                                    </div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: Preview / Summary */}
                <div className="space-y-4">
                    <Card>
                        <CardContent className="space-y-3">
                            <div className="text-sm font-bold text-slate-900">Tóm tắt cấu hình</div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Trạng thái</span>
                                    <Badge tone="amber">Trống (draft)</Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Time limit</span>
                                    <span className="font-semibold text-slate-900">{form.timeLimitMinutes || "-"} phút</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Attempts</span>
                                    <span className="font-semibold text-slate-900">
                                        {form.attemptLimit === "0" ? "Unlimited" : form.attemptLimit}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Grade method</span>
                                    <span className="font-semibold text-slate-900">{form.gradeMethod}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Shuffle</span>
                                    <span className="font-semibold text-slate-900">{form.shuffleQuestions ? "Yes" : "No"}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Review</span>
                                    <span className="font-semibold text-slate-900">{form.reviewOption}</span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                Sau khi “Lưu”, hệ thống sẽ tạo Quiz trạng thái <b>draft</b> (chưa có câu hỏi) và chuyển sang màn UC_TEA_09.
                            </div>

                            {submitting ? (
                                <div className="text-sm font-semibold text-slate-700">Đang lưu...</div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}