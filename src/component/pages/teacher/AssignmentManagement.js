// src/component/pages/teacher/AssignmentManagement.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Đã thêm useNavigate
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge, Input } from "component/ui";
import { Eye, EyeOff } from "lucide-react";


export default function AssignmentManagement() {
    const { classId } = useParams(); 
    const navigate = useNavigate(); // Khởi tạo hook điều hướng

    const [assignments, setAssignments] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null); 
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [selectedFiles, setSelectedFiles] = useState([]);

    const initialFormState = {
        title: "",
        instructions: "",
        allow_from: "",
        due_at: "",
        cutoff_at: "",
        max_score: 100,
        status: "published",
        settings: {
            online_text: true,
            file_submission: true,
            max_files: 1,
            max_size_mb: 50,
            allowed_exts: ".pdf,.docx,.zip" 
        }
    };

    const [formData, setFormData] = useState(initialFormState);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem("smartedu_token");
            const response = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/assessments`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setAssignments(data.data);
        } catch (error) {
            console.error("Lỗi lấy danh sách bài tập:", error);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (classId) fetchAssignments();
    }, [classId]);

    // UC_TEA_13: Xóa bài tập
    const onDelete = async (assessmentId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài tập này không? Hành động này không thể hoàn tác.")) return;
        
        try {
            const token = localStorage.getItem("smartedu_token");
            const response = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/assessments/${assessmentId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ text: "Đã xóa bài tập thành công!", type: "success" });
                fetchAssignments();
            } else {
                setMessage({ text: data.message || "Không thể xóa bài tập.", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Lỗi kết nối khi xóa.", type: "error" });
        }
    };

    // Tính năng: Xuất bản nhanh bài tập đang ở trạng thái Draft
    const onQuickPublish = async (assignment) => {
        try {
            const token = localStorage.getItem("smartedu_token");
            const response = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/assessments/essay/${assignment.id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    ...assignment, 
                    settings: assignment.settings_json, // Đảm bảo key khớp với BE
                    status: 'published' 
                })
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ text: "Bài tập đã được xuất bản!", type: "success" });
                fetchAssignments();
            }
        } catch (error) {
            console.error("Lỗi xuất bản nhanh:", error);
        }
    };

    const handleEditClick = (assignment) => {
        setEditingId(assignment.id);
        setFormData({
            title: assignment.title,
            instructions: assignment.instructions || "",
            allow_from: assignment.allow_from ? assignment.allow_from.substring(0, 16) : "",
            due_at: assignment.due_at ? assignment.due_at.substring(0, 16) : "",
            cutoff_at: assignment.cutoff_at ? assignment.cutoff_at.substring(0, 16) : "",
            max_score: assignment.max_score,
            status: assignment.status,
            settings: assignment.settings_json || assignment.settings || initialFormState.settings
        });
        setIsCreating(true);
    };

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

    const onSubmit = async (e, customStatus = null) => {
        if (e) e.preventDefault();
        setIsLoading(true);
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
                    max_files: Number(formData.settings?.max_files || 1),
                    max_size_mb: Number(formData.settings?.max_size_mb || 50),
                    allowed_exts: typeof formData.settings?.allowed_exts === 'string' 
                        ? formData.settings.allowed_exts.split(',').map(ext => ext.trim())
                        : (formData.settings?.allowed_exts || [".pdf", ".docx", ".zip"])
                },
                files: uploadedFileUrls 
            };

            const url = editingId 
                ? `http://localhost:9999/api/teacher/classes/${classId}/assessments/essay/${editingId}`
                : `http://localhost:9999/api/teacher/classes/${classId}/assessments/essay`;
            
            const method = editingId ? "PUT" : "POST";

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
                setMessage({ text: editingId ? "Cập nhật thành công!" : "Tạo mới thành công!", type: "success" });
                setTimeout(() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setFormData(initialFormState);
                    setMessage({ text: "", type: "" });
                    setSelectedFiles([]);
                    fetchAssignments();
                }, 1500);
            } else {
                setMessage({ text: data.message || "Thao tác thất bại", type: "error" });
            }
        } catch (error) {
            setMessage({ text: error.message || "Lỗi kết nối", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    if (isCreating) {
        return (
            <div className="space-y-4">
                <PageHeader 
                    title={editingId ? "Chỉnh sửa bài tập" : "Tạo bài tập tự luận"} 
                    subtitle="Thiết lập đề bài, thời gian và cấu hình nộp bài." 
                    right={[<Button key="c" variant="outline" onClick={() => {setIsCreating(false); setEditingId(null); setFormData(initialFormState);}}>Hủy</Button>]} 
                />

                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={(e) => onSubmit(e, "published")} className="space-y-6">
                            <div className="space-y-4 rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
                                <h3 className="font-bold text-slate-800 border-b pb-2">1. Thông tin chung</h3>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Tiêu đề bài tập <span className="text-red-500">*</span></label>
                                    <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="VD: Assignment 1" required />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Hướng dẫn / Yêu cầu đề bài</label>
                                    <textarea name="instructions" value={formData.instructions} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" rows="4" placeholder="Nhập nội dung đề bài..." />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Tải lên file đính kèm mới</label>
                                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <p className="text-sm text-slate-600">Kéo thả file vào đây để thay thế (Tối đa 50MB)</p>
                                    </div>
                                    {selectedFiles.map((f, i) => (
                                        <div key={i} className="flex justify-between p-2 mt-2 bg-blue-50 rounded-lg text-sm border border-blue-100">
                                            <span>{f.name} ({(f.size/1024/1024).toFixed(2)} MB)</span>
                                            <button type="button" onClick={() => removeFile(i)} className="text-red-500 font-bold">Xóa</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
                                <h3 className="font-bold text-slate-800 border-b pb-2">2. Thời gian & Điểm số</h3>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Mở cổng nộp bài từ</label>
                                        <input type="datetime-local" name="allow_from" value={formData.allow_from} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Hạn nộp (Due Date) <span className="text-red-500">*</span></label>
                                        <input type="datetime-local" name="due_at" value={formData.due_at} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Đóng cổng (Cut-off)</label>
                                        <input type="datetime-local" name="cutoff_at" value={formData.cutoff_at} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                <div className="w-1/3">
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Thang điểm tối đa</label>
                                    <Input type="number" name="max_score" value={formData.max_score} onChange={handleInputChange} min="0" />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
                                <h3 className="font-bold text-slate-800 border-b pb-2">3. Hình thức nộp bài</h3>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                        <input type="checkbox" name="online_text" checked={formData.settings?.online_text ?? true} onChange={handleSettingChange} className="w-4 h-4 text-blue-600 rounded" />
                                        Gõ văn bản trực tiếp
                                    </label>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                        <input type="checkbox" name="file_submission" checked={formData.settings?.file_submission ?? true} onChange={handleSettingChange} className="w-4 h-4 text-blue-600 rounded" />
                                        Nộp file đính kèm
                                    </label>
                                </div>

                                {formData.settings.file_submission && (
                                    <div className="grid gap-4 md:grid-cols-3 mt-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Số file tối đa</label>
                                            <Input type="number" name="max_files" value={formData.settings?.max_files || 1} onChange={handleSettingChange} min="1" max="20" />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Dung lượng tối đa (MB)</label>
                                            <Input type="number" name="max_size_mb" value={formData.settings?.max_size_mb || 50} onChange={handleSettingChange} min="1" max="50" />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Định dạng file</label>
                                            <Input type="text" name="allowed_exts" value={formData.settings?.allowed_exts || ".pdf,.docx,.zip"} onChange={handleSettingChange} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {message.text && <div className={`p-3 rounded-lg text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{message.text}</div>}
                            <div className="flex gap-3">
                                <Button type="submit" disabled={isLoading} className="bg-blue-600 text-white min-w-[140px]">
                                    {isLoading ? "Đang lưu..." : (editingId ? "Cập nhật" : "Lưu & Xuất bản")}
                                </Button>
                                {!editingId && (
                                    <Button type="button" variant="outline" disabled={isLoading} onClick={(e) => onSubmit(e, "draft")}>
                                        Lưu nháp
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <PageHeader title="Quản lý Bài tập" subtitle={`Lớp ID: ${classId}`} right={[<Button key="n" onClick={() => {setEditingId(null); setFormData(initialFormState); setIsCreating(true);}}>+ Tạo Bài Tập Mới</Button>]} />
            <Card>
                <CardContent>
                    {isFetching ? <p className="p-10 text-center text-slate-500">Đang tải dữ liệu...</p> : (
                        <div className="overflow-x-auto">
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Tiêu đề</Th>
                                        <Th>Hạn nộp</Th>
                                        <Th>Thang điểm</Th>
                                        <Th>Trạng thái</Th>
                                        <Th className="text-right">Thao tác</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.length > 0 ? assignments.map((a) => (
                                        <tr key={a.id} className="hover:bg-slate-50 group">
                                            {/* SỬA ĐỔI CHÍNH NẰM Ở CỘT NÀY */}
                                            <Td>
                                                <div 
                                                    className="font-semibold text-blue-600 cursor-pointer hover:underline flex items-center gap-2"
                                                    onClick={() => {
                                                        if (a.type === 'quiz') {
                                                            navigate(`/teacher/assessments/${a.id}/quiz-attempts`);
                                                        } else {
                                                            navigate(`/teacher/assessments/${a.id}/submissions`);
                                                        }
                                                    }}
                                                >
                                                    {a.is_published ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-amber-500" />}
                                                    {a.title}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">ID: {a.id.substring(0,8)}... {a.type === 'quiz' ? '(Quiz)' : '(Essay)'}</div>
                                            </Td>
                                            <Td>{a.due_at ? new Date(a.due_at).toLocaleString('vi-VN') : "Không có hạn"}</Td>
                                            <Td><Badge tone="amber">{a.max_score || 100}</Badge></Td>
                                            <Td>
                                                <Badge tone={a.is_published ? 'green' : 'slate'}>
                                                    {a.is_published ? 'Published' : 'Draft/Hidden'}
                                                </Badge>
                                            </Td>
                                            <Td className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button 
                                                        size="xs" 
                                                        variant="outline"
                                                        className={a.is_published ? "text-amber-600 border-amber-200" : "text-emerald-600 border-emerald-200"}
                                                        onClick={() => navigate(`/teacher/classes/${classId}/gradebook`)}
                                                    >
                                                        {a.is_published ? 'Ẩn' : 'Công bố'}
                                                    </Button>
                                                    {a.status === 'draft' && (
                                                        <Button 
                                                            size="xs" 
                                                            className="bg-green-600 text-white hover:bg-green-700" 
                                                            onClick={() => onQuickPublish(a)}
                                                        >
                                                            Public
                                                        </Button>
                                                    )}
                                                    <Button size="xs" variant="outline" onClick={() => handleEditClick(a)}>
                                                        Sửa
                                                    </Button>
                                                    <Button 
                                                        size="xs" 
                                                        variant="danger" 
                                                        className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                                                        onClick={() => onDelete(a.id)}
                                                    >
                                                        Xóa
                                                    </Button>
                                                    {a.type === 'quiz' && (
                                                        <Button 
                                                            size="xs" 
                                                            className="bg-slate-800 text-white hover:bg-black"
                                                            onClick={() => {
                                                                const qId = a.id || a._id;
                                                                console.log("Navigating to Quiz Manager with ID:", qId, a);
                                                                if (!qId || qId === "undefined") {
                                                                    alert("Không tìm thấy ID bài tập. Vui lòng tải lại trang.");
                                                                    return;
                                                                }
                                                                navigate(`/teacher/classes/${classId}/quizzes/${qId}/questions`, { state: { quiz: a } });
                                                            }}
                                                        >
                                                            Soạn đề
                                                        </Button>
                                                    )}
                                                </div>
                                            </Td>
                                        </tr>
                                    )) : <tr><Td colSpan="5" className="text-center text-slate-400 py-10">Lớp chưa có bài tập nào.</Td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}