// src/component/pages/teacher/MaterialsManagement.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "service/api";
import { PageHeader, Card, Button, Badge, Modal, Input, cn } from "component/ui";
import { toast } from "sonner";
import { 
    FileText, 
    File, 
    MonitorPlay, 
    Table as TableIcon, 
    Image, 
    Film, 
    Archive, 
    Link as LinkIcon, 
    Eye, 
    EyeOff, 
    Pencil, 
    Trash2, 
    Upload, 
    ChevronDown, 
    ChevronUp,
    Text as TextIcon,
    FolderOpen
} from "lucide-react";
import { format } from "date-fns";

const getTypeIcon = (type) => {
    switch (type) {
        case 'pdf': return { icon: <FileText size={18} className="text-red-500" />, bg: 'bg-red-50' };
        case 'doc': case 'docx': return { icon: <File size={18} className="text-blue-500" />, bg: 'bg-blue-50' };
        case 'slide': case 'pptx': case 'ppt': return { icon: <MonitorPlay size={18} className="text-orange-500" />, bg: 'bg-orange-50' };
        case 'spreadsheet': case 'xls': case 'xlsx': return { icon: <TableIcon size={18} className="text-green-500" />, bg: 'bg-green-50' };
        case 'image': return { icon: <Image size={18} className="text-purple-500" />, bg: 'bg-purple-50' };
        case 'video': return { icon: <Film size={18} className="text-cyan-500" />, bg: 'bg-cyan-50' };
        case 'archive': case 'zip': case 'rar': return { icon: <Archive size={18} className="text-amber-700" />, bg: 'bg-amber-50' };
        case 'link': return { icon: <LinkIcon size={18} className="text-slate-500" />, bg: 'bg-slate-100' };
        case 'text': return { icon: <TextIcon size={18} className="text-slate-500" />, bg: 'bg-slate-50' };
        default: return { icon: <File size={18} className="text-slate-500" />, bg: 'bg-slate-50' };
    }
};

const formatBytes = (bytes) => {
    if (bytes === null || bytes === undefined) return null;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
        return format(new Date(dateString), "dd/MM/yyyy");
    } catch {
        return dateString;
    }
};

export default function MaterialsManagement() {
    const { classId } = useParams();
    const [selectedClassId, setSelectedClassId] = useState(classId || "");
    const [classes, setClasses] = useState([]);
    
    // Data
    const [general, setGeneral] = useState([]);
    const [bySession, setBySession] = useState([]);
    
    // Modal Upload
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadMode, setUploadMode] = useState("file"); // "file" | "link"
    const [selectedFile, setSelectedFile] = useState(null);
    const [linkUrl, setLinkUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [sessionId, setSessionId] = useState(""); 
    const [isUploading, setIsUploading] = useState(false);

    // Modal Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);

    // Confirm Delete
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deletingMaterialId, setDeletingMaterialId] = useState(null);

    // Loading
    const [isLoading, setIsLoading] = useState(false);

    // Accordion State
    const [expandedSections, setExpandedSections] = useState({ general: true });

    const toggleSection = (id) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get("/teacher/schedule/classes");
            if (res.ok && res.data?.data) {
                setClasses(res.data.data);
            }
        } catch (err) {
            toast.error("Lỗi khi tải danh sách lớp học");
        }
    };

    const fetchMaterials = async () => {
        if (!selectedClassId) return;
        setIsLoading(true);
        try {
            const res = await api.get(`/teacher/classes/${selectedClassId}/materials`);
            if (res.ok && res.data?.data) {
                setGeneral(res.data.data.general || []);
                setBySession(res.data.data.by_session || []);
            } else {
                toast.error(res.data?.message || "Lỗi tải danh sách tài liệu");
            }
        } catch (err) {
            toast.error("Lỗi khi tải danh sách tài liệu");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!classId) {
            fetchClasses();
        }
    }, [classId]);

    useEffect(() => {
        if (selectedClassId) {
            fetchMaterials();
        } else {
            setGeneral([]);
            setBySession([]);
        }
    }, [selectedClassId]);

    const handleToggleVisibility = async (materialId, currentVisibility) => {
        try {
            const res = await api.patch(`/teacher/materials/${materialId}/visibility`);
            if (res.ok) {
                toast.success(res.data?.data?.message || "Cập nhật trạng thái thành công");
                const newVisibility = res.data?.data?.is_visible !== undefined ? res.data.data.is_visible : !currentVisibility;
                updateMaterialInState(materialId, { is_visible: newVisibility });
            } else {
                toast.error(res.data?.message || "Lỗi khi ẩn/hiện tài liệu");
            }
        } catch (err) {
            toast.error("Lỗi khi kết nối đến máy chủ");
        }
    };

    const updateMaterialInState = (id, updates) => {
        setGeneral(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
        setBySession(prev => prev.map(s => ({
            ...s,
            materials: s.materials.map(m => m.id === id ? { ...m, ...updates } : m)
        })));
    };

    const handleUploadFile = async () => {
        if (!title.trim()) return toast.error("Vui lòng nhập tên tài liệu");
        if (!selectedFile) return toast.error("Vui lòng chọn file");
        
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", title.trim());
        if (description) formData.append("description", description.trim());
        if (sessionId) formData.append("session_id", sessionId);

        try {
            setIsUploading(true);
            const res = await api.post(`/teacher/classes/${selectedClassId}/materials`, formData);
            if (res.ok) {
                toast.success("Tải lên thành công!");
                closeUploadModal();
                fetchMaterials();
            } else {
                if (res.data?.code === "FILE_TOO_LARGE") {
                    toast.error("File vượt quá 100MB!");
                } else if (res.data?.code === "INVALID_FILE_TYPE") {
                    toast.error(res.data?.message || "Định dạng file không được hỗ trợ");
                } else {
                    toast.error(res.data?.message || "Lỗi khi tải lên tài liệu");
                }
            }
        } catch (err) {
            toast.error("Lỗi kết nối khi tải lên tài liệu");
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadLink = async () => {
        if (!title.trim()) return toast.error("Vui lòng nhập tên tài liệu");
        if (!linkUrl.trim()) return toast.error("Vui lòng nhập Link URL");

        try {
            setIsUploading(true);
            const res = await api.post(`/teacher/classes/${selectedClassId}/materials`, {
                title: title.trim(),
                url: linkUrl.trim(),
                description: description?.trim() || null,
                session_id: sessionId || null,
            });
            if (res.ok) {
                toast.success("Thêm link thành công!");
                closeUploadModal();
                fetchMaterials();
            } else {
                toast.error(res.data?.message || "Lỗi khi thêm link.");
            }
        } catch (err) {
            toast.error("Lỗi kết nối khi thêm link");
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadSubmit = () => {
        if (uploadMode === "file") handleUploadFile();
        else handleUploadLink();
    };

    const handleUpdate = async () => {
        if (!title.trim()) return toast.error("Vui lòng nhập tên tài liệu");
        
        const body = {};
        if (title !== editingMaterial.title) body.title = title.trim();
        if (description !== (editingMaterial.description || "")) body.description = description?.trim() || null;
        if (editingMaterial.type === "link" && linkUrl !== editingMaterial.file_url) body.url = linkUrl;
        
        const currentSessionId = editingMaterial.session_id || "";
        if (sessionId !== currentSessionId) body.session_id = sessionId || null;

        try {
            const res = await api.put(`/teacher/materials/${editingMaterial.id}`, body);
            if (res.ok) {
                toast.success("Cập nhật thành công!");
                closeEditModal();
                fetchMaterials();
            } else {
                toast.error(res.data?.message || "Lỗi khi cập nhật tài liệu");
            }
        } catch (err) {
            toast.error("Lỗi kết nối khi cập nhật");
        }
    };

    const handleDelete = async () => {
        if (!deletingMaterialId) return;
        try {
            const res = await api.delete(`/teacher/materials/${deletingMaterialId}`);
            if (res.ok) {
                toast.success("Đã xóa tài liệu.");
                setIsDeleteConfirmOpen(false);
                setDeletingMaterialId(null);
                fetchMaterials();
            } else {
                toast.error(res.data?.message || "Lỗi khi xóa tài liệu");
            }
        } catch (err) {
            toast.error("Lỗi kết nối khi xóa");
        }
    };

    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
        setTitle("");
        setDescription("");
        setLinkUrl("");
        setSelectedFile(null);
        setSessionId("");
        setUploadMode("file");
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingMaterial(null);
        setTitle("");
        setDescription("");
        setLinkUrl("");
        setSessionId("");
    };

    const openEditModal = (material) => {
        setEditingMaterial(material);
        setTitle(material.title || "");
        setDescription(material.description || "");
        setLinkUrl(material.file_url || "");
        setSessionId(material.session_id || "");
        setIsEditModalOpen(true);
    };

    const confirmDelete = (id) => {
        setDeletingMaterialId(id);
        setIsDeleteConfirmOpen(true);
    };

    const renderMaterialRow = (m) => {
        const typeInfo = getTypeIcon(m.type);
        const sizeStr = formatBytes(m.file_size);
        const dateStr = formatDate(m.created_at);

        return (
            <div key={m.id} className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-100 last:border-b-0 group hover:bg-slate-50 transition-colors",
                !m.is_visible && "opacity-60 bg-slate-50"
            )}>
                <div className="flex items-start gap-4 flex-1">
                    <div className={cn("mt-1 p-2 rounded-lg flex-shrink-0", typeInfo.bg)}>
                        {typeInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <a href={m.file_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-900 hover:text-blue-600 truncate underline-offset-2 hover:underline">
                                {m.title}
                            </a>
                            {!m.is_visible && <Badge tone="slate" className="text-[10px]">Đã ẩn</Badge>}
                        </div>
                        {m.description && (
                            <div className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">{m.description}</div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                            {sizeStr && <span>{sizeStr}</span>}
                            {sizeStr && <span className="w-1 h-1 rounded-full bg-slate-300"></span>}
                            <span>{dateStr}</span>
                            {m.type === 'link' && <span className="w-1 h-1 rounded-full bg-slate-300"></span>}
                            {m.type === 'link' && <span className="truncate max-w-[200px] text-blue-500">{m.file_url}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 mt-4 sm:mt-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button 
                        variant="ghost" 
                        title={m.is_visible ? "Tài liệu đang hiện. Click để ẩn" : "Tài liệu đang ẩn. Click để hiện"}
                        className={cn("px-2 py-1.5", m.is_visible ? "text-blue-600" : "text-slate-500")}
                        onClick={() => handleToggleVisibility(m.id, m.is_visible)}
                    >
                        {m.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        <span className="ml-1.5 sm:hidden">{m.is_visible ? "Hiện" : "Ẩn"}</span>
                    </Button>
                    <Button 
                        variant="ghost" 
                        title="Chỉnh sửa"
                        className="px-2 py-1.5 text-slate-600 hover:text-blue-600"
                        onClick={() => openEditModal(m)}
                    >
                        <Pencil size={16} />
                        <span className="ml-1.5 sm:hidden">Sửa</span>
                    </Button>
                    <Button 
                        variant="ghost" 
                        title="Xóa tài liệu"
                        className="px-2 py-1.5 text-slate-600 hover:text-red-600"
                        onClick={() => confirmDelete(m.id)}
                    >
                        <Trash2 size={16} />
                        <span className="ml-1.5 sm:hidden">Xóa</span>
                    </Button>
                </div>
            </div>
        );
    };

    if (isLoading && general.length === 0 && bySession.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 animate-pulse">
                Đang tải danh sách tài liệu...
            </div>
        );
    }

    const isEmpty = general.length === 0 && bySession.every(s => !s.materials || s.materials.length === 0);

    return (
        <div className="pb-10">
            <PageHeader 
                title={
                    <div className="flex items-center gap-2">
                        <LinkIcon className="text-slate-400" /> 
                        <span>Quản lý tài liệu</span>
                    </div>
                } 
                subtitle={
                    !classId ? (
                        <div className="mt-2 text-sm max-w-xs">
                            <select 
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 outline-none focus:ring-2 focus:ring-slate-200 text-slate-700"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                <option value="">-- Chọn lớp học --</option>
                                {classes.map(c => (
                                    <option key={c.class_id} value={c.class_id}>
                                        {c.class_name || "Lớp: " + c.class_id} {c.course_code ? `- ${c.course_code}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        "Lớp học / Tài liệu"
                    )
                } 
                right={[
                    <Button key="up" onClick={() => setIsUploadModalOpen(true)} className="gap-2" disabled={!selectedClassId}>
                        <Upload size={16} /> Tải lên
                    </Button>
                ]} 
            />

            <div className="space-y-6">
                {!selectedClassId ? (
                    <Card className="p-10 text-center border-dashed bg-slate-50/50">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                            <LinkIcon className="text-slate-300 mb-3" size={48} />
                            <h3 className="text-lg font-medium text-slate-700">Chưa chọn lớp học</h3>
                            <p className="text-sm mb-4">Vui lòng chọn một lớp học ở trên để xem và quản lý tài liệu.</p>
                        </div>
                    </Card>
                ) : isEmpty ? (
                    <Card className="p-10 text-center border-dashed bg-slate-50/50">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                            <FolderOpen className="text-slate-300 mb-3" size={48} />
                            <h3 className="text-lg font-medium text-slate-700">Chưa có tài liệu nào</h3>
                            <p className="text-sm mb-4">Bấm "Tải lên" để thêm tài liệu mới cho lớp học</p>
                            <Button onClick={() => setIsUploadModalOpen(true)}>
                                <Upload size={16} className="mr-2" /> Tải lên tài liệu
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <>
                        {/* GENERAL MATERIALS */}
                        {general.length > 0 && (
                            <section>
                                <div 
                                    className="flex items-center justify-between px-2 py-3 cursor-pointer bg-slate-100 rounded-lg mb-2"
                                    onClick={() => toggleSection('general')}
                                >
                                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                                        <Archive size={18} className="text-slate-500" />
                                        TÀI LIỆU CHUNG
                                    </div>
                                    <Button variant="ghost" className="p-1 h-auto text-slate-500 hover:text-slate-800 hover:bg-slate-200">
                                        {expandedSections['general'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </Button>
                                </div>
                                
                                {expandedSections['general'] && (
                                    <Card>
                                        <div className="divide-y divide-slate-100">
                                            {general.map(m => renderMaterialRow(m))}
                                        </div>
                                    </Card>
                                )}
                            </section>
                        )}

                        {/* BY SESSION MATERIALS */}
                        {bySession.map((sessionGroup) => {
                            const { session, materials } = sessionGroup;
                            const sectionId = `session_${session.id}`;
                            const isExpanded = expandedSections[sectionId] !== false; // Default expanded

                            return (
                                <section key={session.id}>
                                    <div 
                                        className="flex items-center justify-between px-2 py-3 cursor-pointer bg-slate-50 rounded-lg mb-2 border border-slate-200"
                                        onClick={() => toggleSection(sectionId)}
                                    >
                                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="text-slate-500">📅</span>
                                            BUỔI {session.index} — {formatDate(session.start_time)} — {session.topic || "Chưa có chủ đề"}
                                        </div>
                                        <Button variant="ghost" className="p-1 h-auto text-slate-500 hover:text-slate-800 hover:bg-slate-200">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </Button>
                                    </div>
                                    
                                    {isExpanded && (
                                        <Card>
                                            {materials && materials.length > 0 ? (
                                                <div className="divide-y divide-slate-100">
                                                    {materials.map(m => renderMaterialRow(m))}
                                                </div>
                                            ) : (
                                                <div className="p-4 text-center text-sm text-slate-500 flex flex-col items-center justify-center py-6">
                                                    <span className="mb-2">Chưa có tài liệu cho buổi này.</span>
                                                    <Button variant="outline" className="text-xs" onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSessionId(session.id);
                                                        setIsUploadModalOpen(true);
                                                    }}>
                                                        + Thêm tài liệu cho buổi này
                                                    </Button>
                                                </div>
                                            )}
                                        </Card>
                                    )}
                                </section>
                            );
                        })}
                    </>
                )}
            </div>

            {/* UPLOAD MODAL */}
            <Modal open={isUploadModalOpen} onClose={closeUploadModal} title="📎 Tải lên tài liệu">
                <div className="space-y-4">
                    <div className="flex gap-4 border-b border-slate-100 pb-2">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input 
                                type="radio" 
                                name="uploadMode" 
                                checked={uploadMode === "file"} 
                                onChange={() => setUploadMode("file")}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            File từ máy tính
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input 
                                type="radio" 
                                name="uploadMode" 
                                checked={uploadMode === "link"} 
                                onChange={() => setUploadMode("link")}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            Link URL
                        </label>
                    </div>

                    {uploadMode === "file" ? (
                        <div className="space-y-2">
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                <input 
                                    type="file" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            const file = e.target.files[0];
                                            setSelectedFile(file);
                                            if (!title) setTitle(file.name);
                                        }
                                    }}
                                />
                                <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                                <div className="text-sm font-medium text-slate-700">Kéo thả file vào đây hoặc click để chọn</div>
                                <div className="text-xs text-slate-500 mt-1">Hỗ trợ PDF, DOCX, PPTX, XLSX, ZIP, JPG, MP4... (Tối đa 100MB)</div>
                            </div>
                            {selectedFile && (
                                <div className="flex items-center justify-between bg-blue-50 text-blue-700 text-sm p-2 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-2 truncate">
                                        <FileText size={16} className="text-blue-500" />
                                        <span className="truncate">{selectedFile.name}</span>
                                        <span className="text-blue-400 opacity-80 shrink-0">({formatBytes(selectedFile.size)})</span>
                                    </div>
                                    <Button variant="ghost" className="h-6 w-6 p-0 text-blue-400 hover:text-blue-700 hover:bg-blue-100 shrink-0" onClick={() => setSelectedFile(null)}>✕</Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1 text-sm">
                            <label className="font-medium text-slate-700">Link URL (*)</label>
                            <Input 
                                placeholder="https://youtube.com/watch?v=..." 
                                value={linkUrl} 
                                onChange={(e) => setLinkUrl(e.target.value)} 
                            />
                        </div>
                    )}

                    <div className="space-y-1 text-sm">
                        <label className="font-medium text-slate-700">Tên tài liệu (*)</label>
                        <Input 
                            placeholder="Nhập tên tài liệu hiển thị" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                        />
                    </div>
                    
                    <div className="space-y-1 text-sm">
                        <label className="font-medium text-slate-700">Mô tả (tùy chọn)</label>
                        <textarea 
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 resize-y min-h-[80px]"
                            placeholder="Mô tả ngắn gọn về tài liệu này"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1 text-sm">
                        <label className="font-medium text-slate-700">Gắn vào khóa học / buổi học</label>
                        <select 
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                        >
                            <option value="">📁 Tài liệu chung (Xuyên suốt môn học)</option>
                            {bySession.map(s => (
                                <option key={s.session.id} value={s.session.id}>
                                    Buổi {s.session.index} — {formatDate(s.session.start_time)} — {s.session.topic || "Chưa rõ CĐ"}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={closeUploadModal} disabled={isUploading}>Hủy bỏ</Button>
                        <Button onClick={handleUploadSubmit} disabled={isUploading}>
                            {isUploading ? "Đang tải lên..." : "📤 Tải lên"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* EDIT MODAL */}
            <Modal open={isEditModalOpen} onClose={closeEditModal} title="✏️ Chỉnh sửa tài liệu">
                <div className="space-y-4">
                    {editingMaterial?.type === "link" && (
                        <div className="space-y-1 text-sm">
                            <label className="font-medium text-slate-700">Link URL (*)</label>
                            <Input 
                                placeholder="https://..." 
                                value={linkUrl} 
                                onChange={(e) => setLinkUrl(e.target.value)} 
                            />
                        </div>
                    )}

                    <div className="space-y-1 text-sm">
                        <label className="font-medium text-slate-700">Tên tài liệu (*)</label>
                        <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                        />
                    </div>
                    
                    <div className="space-y-1 text-sm">
                        <label className="font-medium text-slate-700">Mô tả</label>
                        <textarea 
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 resize-y min-h-[80px]"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1 text-sm">
                        <label className="font-medium text-slate-700">Di chuyển đến</label>
                        <select 
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                        >
                            <option value="">📁 Tài liệu chung</option>
                            {bySession.map(s => (
                                <option key={s.session.id} value={s.session.id}>
                                    Buổi {s.session.index} — {formatDate(s.session.start_time)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={closeEditModal}>Hủy bỏ</Button>
                        <Button onClick={handleUpdate}>💾 Lưu thay đổi</Button>
                    </div>
                </div>
            </Modal>

            {/* DELETE CONFIRM MODAL */}
            <Modal open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="🗑️ Xác nhận xóa">
                <div className="space-y-4">
                    <p className="text-sm text-slate-700">Bạn có chắc muốn xóa tài liệu này vĩnh viễn?</p>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-red-800 text-sm flex items-start gap-2">
                        <span className="text-red-500 pt-0.5">⚠️</span>
                        <span>Hành động này không thể hoàn tác. File sẽ bị xóa vĩnh viễn trên server.</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Hủy bỏ</Button>
                        <Button variant="danger" onClick={handleDelete}>🗑️ Xóa vĩnh viễn</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}