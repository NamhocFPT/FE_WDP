import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Input, Badge } from "component/ui";
import { Clock, CheckCircle, FileText, Settings2, Edit3, ArrowRight } from "lucide-react";

export default function EssayCreation() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const essayId = searchParams.get("essayId");
    const isEditMode = !!essayId;

    const [isLoading, setIsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);

    const initialFormState = {
        title: "",
        instructions: "",
        allow_from: "",
        due_at: "",
        cutoff_at: "",
        max_score: 100,
        status: "published",
        settings: {
            file_submission: true,
            max_files: 1,
            max_size_mb: 50,
            allowed_exts: ".pdf,.docx,.doc,.zip,.rar" 
        }
    };

    const [formData, setFormData] = useState(initialFormState);

    const formatDateForInput = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().substring(0, 16);
    };

    useEffect(() => {
        if (isEditMode) {
            const fetchDetail = async () => {
                try {
                    const token = localStorage.getItem("smartedu_token");
                    const res = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/assessments`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.success) {
                        const assessments = data.data.assessments || [];
                        const essay = assessments.find(a => a.id === essayId);
                        if (essay) {
                            setFormData({
                                title: essay.title,
                                instructions: essay.instructions || "",
                                allow_from: formatDateForInput(essay.allow_from),
                                due_at: formatDateForInput(essay.due_at),
                                cutoff_at: formatDateForInput(essay.cutoff_at),
                                max_score: essay.max_score || 100,
                                status: essay.status || "published",
                                settings: essay.settings_json || essay.settings || initialFormState.settings
                            });
                            setExistingFiles(essay.files || []);
                        }
                    }
                } catch (error) {
                    console.error("Lỗi lấy chi tiết bài tập:", error);
                }
            };
            fetchDetail();
        }
    }, [isEditMode, essayId, classId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSettingChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            settings: { ...(prev.settings || initialFormState.settings), [name]: type === 'checkbox' ? checked : value }
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(f => f.size <= 50 * 1024 * 1024);
        if (validFiles.length < files.length) {
            setMessage({ text: "Một số file vượt quá 50MB đã bị loại bỏ.", type: "error" });
        }
        setSelectedFiles(prev => [...prev, ...validFiles]);
        e.target.value = null; 
    };

    const removeFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

    const validateDates = () => {
        const allowFromDate = formData.allow_from ? new Date(formData.allow_from) : null;
        const dueAtDate = formData.due_at ? new Date(formData.due_at) : null;
        const cutoffAtDate = formData.cutoff_at ? new Date(formData.cutoff_at) : null;

        if (allowFromDate && dueAtDate && allowFromDate > dueAtDate) {
            setMessage({ text: "Thời gian mở cổng nộp bài phải diễn ra trước Hạn nộp.", type: "error" });
            return false;
        }
        if (dueAtDate && cutoffAtDate && dueAtDate > cutoffAtDate) {
            setMessage({ text: "Hạn nộp phải diễn ra trước Thời gian đóng cổng.", type: "error" });
            return false;
        }
        return true;
    }

    const onSubmit = async (e, customStatus = null) => {
        if (e) e.preventDefault();
        
        if (!validateDates()) return;

        setSubmitting(true);
        setMessage({ text: "", type: "" });

        try {
            const token = localStorage.getItem("smartedu_token");
            let uploadedFileUrls = [];

            if (selectedFiles.length > 0) {
                const uploadFormData = new FormData();
                selectedFiles.forEach(file => uploadFormData.append("files", file));
                const uploadRes = await fetch("http://localhost:9999/api/upload", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: uploadFormData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success) uploadedFileUrls = uploadData.data;
                else throw new Error(uploadData.message);
            }

            const payload = {
                ...formData,
                status: customStatus || formData.status,
                max_score: Number(formData.max_score),
                allow_from: formData.allow_from ? new Date(formData.allow_from).toISOString() : null,
                due_at: formData.due_at ? new Date(formData.due_at).toISOString() : null,
                cutoff_at: formData.cutoff_at ? new Date(formData.cutoff_at).toISOString() : null,
                settings: {
                    ...(formData.settings || initialFormState.settings),
                    file_submission: true,
                    max_files: Number(formData.settings?.max_files || 1),
                    max_size_mb: Number(formData.settings?.max_size_mb || 50),
                    allowed_exts: typeof formData.settings?.allowed_exts === 'string' 
                        ? formData.settings.allowed_exts.split(',').map(ext => ext.trim())
                        : (formData.settings?.allowed_exts || [".pdf", ".docx", ".zip"])
                },
                files: [
                    ...existingFiles.map(f => ({
                        file_url: f.file_url,
                        original_name: f.original_name,
                        mime_type: f.mime_type || "application/octet-stream"
                    })),
                    ...uploadedFileUrls.map((urlInfo, index) => {
                        const isStr = typeof urlInfo === 'string';
                        return {
                            file_url: isStr ? urlInfo : (urlInfo.url || urlInfo.file_url),
                            original_name: isStr || !urlInfo.original_name ? selectedFiles[index]?.name || "file" : urlInfo.original_name,
                            mime_type: isStr || !urlInfo.mime_type ? selectedFiles[index]?.type || "application/octet-stream" : urlInfo.mime_type,
                        };
                    })
                ]
            };

            const url = isEditMode 
                ? `http://localhost:9999/api/teacher/classes/${classId}/assessments/essay/${essayId}`
                : `http://localhost:9999/api/teacher/classes/${classId}/assessments/essay`;
            
            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setMessage({ text: isEditMode ? "Cập nhật thành công!" : "Tạo mới thành công!", type: "success" });
                setTimeout(() => {
                    navigate(`/teacher/classes/${classId}/assignments?type=essay`);
                }, 1000);
            } else {
                setMessage({ text: data.message || (data.error && data.error.validationErrors && data.error.validationErrors[0]?.message) || "Thao tác thất bại", type: "error" });
            }
        } catch (error) {
            setMessage({ text: error.message || "Lỗi kết nối", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <PageHeader
                title={isEditMode ? "Chỉnh sửa bài Tự luận" : "Tạo bài Tự luận mới"}
                subtitle="Cấu hình đề bài, thời hạn và định dạng nộp tin cho bài tập tự luận."
                icon={isEditMode ? <Edit3 className="text-blue-500" /> : <FileText className="text-blue-500" />}
                onBack={() => navigate(-1)}
            />

            {message.text && (
                <div className={`mb-4 rounded-xl border p-3 text-sm font-semibold ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                {/* LEFT: Form */}
                <div className="lg:col-span-2 space-y-4">
                    <form id="essay-form" onSubmit={(e) => onSubmit(e, "published")} className="space-y-4">
                        {/* 1. General */}
                        <Card className="hover:shadow-xl transition-all duration-300 border-white hover:border-blue-200 hover:-translate-y-1 bg-white/70 backdrop-blur-sm">
                            <CardContent className="space-y-4 p-5">
                                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">1. Thông tin chung</h3>
                                
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Tiêu đề bài tập <span className="text-red-500">*</span></label>
                                    <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="VD: Bài tập về nhà tuần 1" required />
                                </div>
                                
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Hướng dẫn / Yêu cầu đề bài</label>
                                    <textarea name="instructions" value={formData.instructions} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" rows="5" placeholder="Nhập nội dung yêu cầu chi tiết..." />
                                </div>
                                
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Tải lên file đính kèm (Cho Sinh viên)</label>
                                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <div className="text-sm text-slate-600">
                                            <span className="text-blue-600 font-semibold">Tải lên</span> hoặc kéo thả file vào đây (Tối đa 50MB)
                                        </div>
                                    </div>
                                    
                                    {/* Hiển thị file cũ */}
                                    {existingFiles.map((f) => (
                                        <div key={f.id} className="flex justify-between p-2 mt-2 bg-slate-100 rounded-lg text-sm border border-slate-200 items-center">
                                            <span className="font-medium text-slate-700">📎 {f.original_name} <span className="text-xs text-slate-400">(File cũ)</span></span>
                                            <button type="button" onClick={() => setExistingFiles(prev => prev.filter(x => x.id !== f.id))} className="text-red-500 hover:text-red-700 font-bold p-1">Xóa</button>
                                        </div>
                                    ))}
                                    {selectedFiles.map((f, i) => (
                                        <div key={i} className="flex justify-between p-2 mt-2 bg-blue-50 rounded-lg text-sm border border-blue-100 items-center">
                                            <span className="font-medium text-slate-700">{f.name} ({(f.size/1024/1024).toFixed(2)} MB)</span>
                                            <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 font-bold p-1">Xóa</button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Timing & Grade */}
                        <Card className="hover:shadow-xl transition-all duration-300 border-white hover:border-blue-200 hover:-translate-y-1 bg-white/70 backdrop-blur-sm">
                            <CardContent className="space-y-4 p-5">
                                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">2. Thời hạn & Điểm số</h3>
                                
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Mở cổng nộp bài từ</label>
                                        <input type="datetime-local" name="allow_from" value={formData.allow_from} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                                        <p className="text-xs text-slate-400 mt-1">Học sinh không thể nộp bài trước thời điểm này</p>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Hạn nộp (Due Date) <span className="text-red-500">*</span></label>
                                        <input type="datetime-local" name="due_at" value={formData.due_at} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" required />
                                        <p className="text-xs text-slate-400 mt-1">Nộp sau hạn sẽ bị đánh dấu là nộp muộn</p>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Thời gian đóng cổng nộp bài</label>
                                        <input type="datetime-local" name="cutoff_at" value={formData.cutoff_at} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                                        <p className="text-xs text-slate-400 mt-1">Hệ thống chặn nộp bài sau thời gian này</p>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Thang điểm tối đa</label>
                                        <Input type="number" name="max_score" value={formData.max_score} onChange={handleInputChange} min="0" step="0.5" />

                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Settings */}
                        <Card className="hover:shadow-xl transition-all duration-300 border-white hover:border-blue-200 hover:-translate-y-1 bg-white/70 backdrop-blur-sm">
                            <CardContent className="space-y-4 p-5">
                                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">3. Hình thức nộp bài: Định dạng File đính kèm</h3>
                                
                                <div className="grid gap-4 md:grid-cols-3 mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-600">Số file tối đa</label>
                                        <Input type="number" name="max_files" value={formData.settings?.max_files || 1} onChange={handleSettingChange} min="1" max="20" className="bg-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-600">Dung lượng/file (MB)</label>
                                        <Input type="number" name="max_size_mb" value={formData.settings?.max_size_mb || 50} onChange={handleSettingChange} min="1" max="50" className="bg-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-600">Định dạng file</label>
                                        <Input type="text" name="allowed_exts" value={formData.settings?.allowed_exts || ".pdf,.docx"} onChange={handleSettingChange} placeholder=".pdf,.docx,.zip" className="bg-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>

                {/* RIGHT: Preview / Summary */}
                <div className="space-y-4">
                    <Card className="border-blue-100 shadow-sm sticky top-6">
                        <div className="bg-blue-50 rounded-t-xl px-5 py-3 border-b border-blue-100 flex items-center gap-2 text-blue-800">
                            <Settings2 size={18} />
                            <span className="font-bold">Tóm tắt cấu hình</span>
                        </div>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-3.5 text-sm">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium text-xs">Phân loại</span>
                                    <Badge tone="indigo">Tự luận (Essay)</Badge>
                                </div>

                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium text-xs flex items-center gap-1.5"><Clock size={14}/> Mở nhận bài</span>
                                    <span className="font-bold text-slate-800">{formData.allow_from ? new Date(formData.allow_from).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}) : "Mở ngay lập tức"}</span>
                                </div>

                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium text-xs flex items-center gap-1.5"><Clock size={14} className="text-red-500"/> Hạn chót</span>
                                    <span className="font-bold text-red-600">{formData.due_at ? new Date(formData.due_at).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}) : "Chưa cài đặt"}</span>
                                </div>

                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium text-xs">Thang điểm</span>
                                    <span className="font-bold text-slate-800">{formData.max_score} điểm</span>
                                </div>
                                
                                <div className="flex flex-col gap-1 pb-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium text-xs">Phương thức nộp</span>
                                    <div className="flex flex-col gap-1 mt-1">
                                        <span className="text-emerald-600 font-medium flex items-center gap-1">✓ Nộp file đính kèm (max {formData.settings?.max_files} file)</span>
                                    </div>
                                </div>
                            </div>

                            {submitting ? (
                                <div className="text-center pt-2 text-sm font-semibold text-blue-600 animate-pulse">Đang lưu thông tin...</div>
                            ) : null}

                            <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                                <Button type="submit" form="essay-form" className="w-full justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition-all duration-200" disabled={submitting}>
                                    <CheckCircle size={18} className="mr-1.5" /> 
                                    {isEditMode ? "Cập nhật bài tập" : "Lưu & Công bố"}
                                </Button>
                                {!isEditMode && (
                                    <Button variant="outline" className="w-full justify-center py-2.5 bg-white shadow-sm hover:bg-slate-50 transition-colors rounded-xl font-medium text-slate-700" onClick={(e) => onSubmit(e, "draft")} disabled={submitting}>
                                        Lưu nháp (Ẩn với user)
                                    </Button>
                                )}
                                <Button variant="ghost" className="w-full justify-center py-2.5 text-slate-500 hover:bg-slate-50 transition-colors rounded-xl" onClick={() => navigate(-1)} disabled={submitting}>
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
