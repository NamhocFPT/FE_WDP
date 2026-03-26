import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Archive, Eye, EyeOff, File, FileArchive, FileImage, FileSpreadsheet, FileText, Film, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "service/adminApi";
import { Badge, Button, Card, CardContent, Input, Modal, PageHeader, Textarea } from "component/ui";

const fileMeta = {
    pdf: { icon: FileText, tone: "bg-blue-50 text-blue-600" },
    doc: { icon: FileText, tone: "bg-blue-50 text-blue-600" },
    text: { icon: FileText, tone: "bg-blue-50 text-blue-600" },
    spreadsheet: { icon: FileSpreadsheet, tone: "bg-emerald-50 text-emerald-600" },
    image: { icon: FileImage, tone: "bg-amber-50 text-amber-600" },
    video: { icon: Film, tone: "bg-rose-50 text-rose-600" },
    archive: { icon: FileArchive, tone: "bg-violet-50 text-violet-600" },
};

const emptyUpload = { file: null, title: "", description: "", is_visible: true, status: "active" };
const emptyEdit = { title: "", description: "", is_visible: true, status: "active" };

const formatBytes = (bytes) => {
    if (bytes == null) return "Khong ro dung luong";
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${Number((bytes / (1024 ** i)).toFixed(2))} ${units[i]}`;
};

const formatDateTime = (value) => {
    if (!value) return "Khong ro ngay tao";
    try {
        return format(new Date(value), "dd/MM/yyyy HH:mm");
    } catch {
        return value;
    }
};

const normalizeFileUrl = (url) => {
    if (!url || typeof url !== "string") return url;
    let normalized = url;
    const duplicateExtensionPattern = /(\.[a-z0-9]+)\1(?=($|[?#]))/i;

    while (duplicateExtensionPattern.test(normalized)) {
        normalized = normalized.replace(duplicateExtensionPattern, "$1");
    }

    return normalized;
};

function MaterialBadges({ item }) {
    return (
        <div className="flex flex-wrap gap-2">
            <Badge tone={item.is_visible ? "blue" : "slate"}>{item.is_visible ? "Visible" : "Hidden"}</Badge>
            <Badge tone={item.status === "archived" ? "amber" : "green"}>{item.status === "archived" ? "Archived" : "Active"}</Badge>
        </div>
    );
}

export default function CoursePublicMaterialsManagement() {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyKey, setBusyKey] = useState("");
    const [uploadForm, setUploadForm] = useState(emptyUpload);
    const [editForm, setEditForm] = useState(emptyEdit);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);

    const stats = useMemo(() => ({
        total: materials.length,
        visible: materials.filter((item) => item.is_visible).length,
        hidden: materials.filter((item) => !item.is_visible).length,
        archived: materials.filter((item) => item.status === "archived").length,
    }), [materials]);

    const loadData = useCallback(async (withLoader = true) => {
        if (withLoader) setLoading(true);
        try {
            const res = await adminApi.getCoursePublicMaterials(courseId);
            const data = res.data?.data || {};
            setCourse(data.course || null);
            setMaterials(Array.isArray(data.materials) ? data.materials : []);
        } catch (error) {
            toast.error(error.response?.data?.message || "Khong the tai danh sach tai lieu public.");
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const closeUpload = () => {
        setUploadOpen(false);
        setUploadForm(emptyUpload);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setEditForm({
            title: item.title || "",
            description: item.description || "",
            is_visible: !!item.is_visible,
            status: item.status || "active",
        });
        setEditOpen(true);
    };

    const closeEdit = () => {
        setEditOpen(false);
        setEditingItem(null);
        setEditForm(emptyEdit);
    };

    const handleView = async (item) => {
        try {
            let fileUrl = normalizeFileUrl(item.file_url);
            if (item.type === "link") {
                window.open(fileUrl, "_blank");
                return;
            }
            
            toast.info(`Đang mở file...`);
            let fetchUrl = fileUrl;
            
            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error("Network response was not ok");
            let blob = await response.blob();
            
            if (item.type === "pdf") {
                blob = new Blob([blob], { type: "application/pdf" });
            }
            const blobUrl = window.URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
        } catch (error) {
            console.error(error);
            let fallbackUrl = normalizeFileUrl(item.file_url);
            window.open(fallbackUrl, "_blank");
        }
    };

    const handleDownloadItem = async (item) => {
        try {
            const fileUrl = normalizeFileUrl(item.file_url);
            if (item.type === "link") {
                window.open(fileUrl, "_blank");
                return;
            }

            toast.info(`Đang tải file...`);
            let fetchUrl = fileUrl;

            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error("Khong the tai file");

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = item.original_filename || item.title || "tai-lieu";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download error:", error);
            let fallbackUrl = normalizeFileUrl(item.file_url);
            const a = document.createElement("a");
            a.href = fallbackUrl;
            a.download = item.original_filename || item.title || "tai-lieu";
            a.target = "_blank";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!uploadForm.file) return toast.error("Vui long chon file.");
        const fallbackTitle = uploadForm.file.name.replace(/\.[^.]+$/, "");
        const formData = new FormData();
        formData.append("file", uploadForm.file);
        formData.append("title", uploadForm.title.trim() || fallbackTitle);
        formData.append("description", uploadForm.description.trim());
        formData.append("is_visible", String(uploadForm.is_visible));
        formData.append("status", uploadForm.status);
        setBusyKey("upload");
        try {
            await adminApi.addCoursePublicMaterial(courseId, formData);
            toast.success("Tai lieu da duoc tai len.");
            closeUpload();
            loadData(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Khong the tai len tai lieu.");
        } finally {
            setBusyKey("");
        }
    };

    const handleUpdate = async (event) => {
        event.preventDefault();
        if (!editingItem) return;
        if (!editForm.title.trim()) return toast.error("Tieu de khong duoc de trong.");
        setBusyKey(`edit-${editingItem.id}`);
        try {
            await adminApi.updateCoursePublicMaterial(editingItem.id, {
                title: editForm.title.trim(),
                description: editForm.description.trim(),
                is_visible: editForm.is_visible,
                status: editForm.status,
            });
            toast.success("Da cap nhat tai lieu.");
            closeEdit();
            loadData(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Khong the cap nhat tai lieu.");
        } finally {
            setBusyKey("");
        }
    };

    const toggleVisibility = async (item) => {
        setBusyKey(`visibility-${item.id}`);
        try {
            const res = await adminApi.toggleCoursePublicMaterialVisibility(item.id);
            toast.success(res.data?.message || "Da cap nhat hien thi.");
            loadData(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Khong the doi trang thai hien thi.");
        } finally {
            setBusyKey("");
        }
    };

    const archiveItem = async (item) => {
        if (item.status === "archived") return;
        setBusyKey(`archive-${item.id}`);
        try {
            await adminApi.updateCoursePublicMaterial(item.id, { status: "archived" });
            toast.success("Da chuyen tai lieu sang archived.");
            loadData(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Khong the archive tai lieu.");
        } finally {
            setBusyKey("");
        }
    };

    const removeItem = async () => {
        if (!deleteItem) return;
        setBusyKey(`delete-${deleteItem.id}`);
        try {
            await adminApi.deleteCoursePublicMaterial(deleteItem.id);
            toast.success("Tai lieu da duoc xoa.");
            setDeleteItem(null);
            loadData(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Khong the xoa tai lieu.");
        } finally {
            setBusyKey("");
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-44 animate-pulse rounded-[28px] bg-gradient-to-br from-slate-200 to-slate-100" />
                <div className="h-96 animate-pulse rounded-[28px] bg-white" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <PageHeader
                title="Quản lý tài liệu public"
                subtitle="Upload, sửa metadata và kiểm soát hiển thị tài liệu công khai theo từng môn học."
                onBack={() => navigate("/admin/courses")}
                right={[
                    <Button key="upload" className="gap-2 bg-slate-900 hover:bg-slate-800" onClick={() => setUploadOpen(true)}>
                        <Upload size={16} />
                        Upload tài liệu
                    </Button>,
                ]}
            />

            <section className="grid gap-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-cyan-900 to-emerald-700 p-7 text-white shadow-xl lg:grid-cols-[1.4fr,1fr]">
                <div>
                    <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">Course Library</div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight">{course?.code || "Khong ro ma mon"}</h2>
                    <p className="mt-2 text-lg text-cyan-50">{course?.name || "Kho tài liệu công khai"}</p>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-cyan-50/85">
                        Admin có thể xem toàn bộ tài liệu của môn học này, kể cả hidden và archived, rồi điều chỉnh lại trước khi phát hành cho teacher/student.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {[
                        ["Tổng tài liệu", stats.total],
                        ["Visible", stats.visible],
                        ["Hidden", stats.hidden],
                        ["Archived", stats.archived],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                            <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">{label}</div>
                            <div className="mt-2 text-3xl font-black">{value}</div>
                        </div>
                    ))}
                </div>
            </section>

            <Card className="overflow-hidden rounded-[28px] border-slate-200 shadow-sm">
                <CardContent className="p-0">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Danh sách tài liệu</h3>
                            <p className="mt-1 text-sm text-slate-500">Mỗi tài liệu đều có đủ badge visible/hidden và active/archived.</p>
                        </div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{materials.length} mục</div>
                    </div>

                    {materials.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-16 text-center">
                            <div className="rounded-full bg-cyan-50 p-4 text-cyan-600"><Upload size={28} /></div>
                            <h4 className="mt-4 text-xl font-bold text-slate-900">Chưa có tài liệu public</h4>
                            <p className="mt-2 max-w-xl text-sm text-slate-500">Bắt đầu bằng cách tải file đầu tiên lên để teacher và student có thể tra cứu sau này.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {materials.map((item) => {
                                const meta = fileMeta[item.type] || { icon: File, tone: "bg-slate-100 text-slate-600" };
                                const Icon = meta.icon;
                                const busy = busyKey.includes(item.id);
                                const fileUrl = normalizeFileUrl(item.file_url);
                                return (
                                    <div key={item.id} className="grid gap-5 px-6 py-5 lg:grid-cols-[1fr,auto]">
                                        <div className="flex gap-4">
                                            <div className={`mt-1 flex h-12 w-12 items-center justify-center rounded-2xl ${meta.tone}`}><Icon size={18} /></div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                                                    <MaterialBadges item={item} />
                                                </div>
                                                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description || "Chưa có mô tả cho tài liệu này."}</p>
                                                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                                                    <span className="rounded-full bg-slate-100 px-3 py-1">{item.original_filename || "Khong ro ten file"}</span>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1">{formatBytes(item.file_size)}</span>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1">Tạo lúc {formatDateTime(item.created_at)}</span>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1">Uploader: {item.uploader?.full_name || item.uploader?.email || "Admin"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-start justify-end gap-2">
                                            <button onClick={() => handleView(item)} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                                                Mở file
                                            </button>
                                            <button onClick={() => handleDownloadItem(item)} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                                                Tải file
                                            </button>
                                            <Button variant="outline" className="gap-2 px-3 py-2" onClick={() => openEdit(item)}><Pencil size={14} />Sửa</Button>
                                            <Button variant="outline" className="gap-2 px-3 py-2" onClick={() => toggleVisibility(item)} disabled={busy}>
                                                {item.is_visible ? <EyeOff size={14} /> : <Eye size={14} />}
                                                {item.is_visible ? "Ẩn" : "Hiện"}
                                            </Button>
                                            <Button variant="outline" className="gap-2 px-3 py-2 text-amber-700 hover:bg-amber-50" onClick={() => archiveItem(item)} disabled={busy || item.status === "archived"}>
                                                <Archive size={14} />
                                                Archive
                                            </Button>
                                            <Button variant="outline" className="gap-2 px-3 py-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteItem(item)} disabled={busy}>
                                                <Trash2 size={14} />
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal open={uploadOpen} onClose={closeUpload} title="Upload tài liệu public">
                <form onSubmit={handleUpload} className="space-y-4">
                    <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center hover:border-cyan-300 hover:bg-cyan-50/40">
                        <input type="file" className="hidden" onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setUploadForm((prev) => ({ ...prev, file, title: prev.title || (file ? file.name.replace(/\.[^.]+$/, "") : "") }));
                        }} />
                        <Upload size={28} className="text-cyan-600" />
                        <div className="mt-3 text-sm font-semibold text-slate-800">Chọn file để tải lên</div>
                        <div className="mt-1 text-xs text-slate-500">PDF, DOCX, XLSX, PPTX, TXT, ZIP, JPG, PNG, MP4... tối đa 100MB.</div>
                    </label>
                    {uploadForm.file ? <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">{uploadForm.file.name} · {formatBytes(uploadForm.file.size)}</div> : null}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Tiêu đề</label>
                        <Input value={uploadForm.title} onChange={(event) => setUploadForm((prev) => ({ ...prev, title: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Mô tả</label>
                        <Textarea className="min-h-[100px]" value={uploadForm.description} onChange={(event) => setUploadForm((prev) => ({ ...prev, description: event.target.value }))} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <select value={uploadForm.is_visible ? "visible" : "hidden"} onChange={(event) => setUploadForm((prev) => ({ ...prev, is_visible: event.target.value === "visible" }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200">
                            <option value="visible">Visible</option>
                            <option value="hidden">Hidden</option>
                        </select>
                        <select value={uploadForm.status} onChange={(event) => setUploadForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200">
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <Button type="button" variant="outline" onClick={closeUpload}>Hủy</Button>
                        <Button type="submit" className="gap-2" disabled={busyKey === "upload"}>{busyKey === "upload" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}Tải lên</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={editOpen} onClose={closeEdit} title="Chỉnh sửa tài liệu public">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Phiên bản v1 chỉ cho chỉnh sửa metadata, chưa hỗ trợ thay file gốc.</div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Tiêu đề</label>
                        <Input value={editForm.title} onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Mô tả</label>
                        <Textarea className="min-h-[100px]" value={editForm.description} onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <select value={editForm.is_visible ? "visible" : "hidden"} onChange={(event) => setEditForm((prev) => ({ ...prev, is_visible: event.target.value === "visible" }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200">
                            <option value="visible">Visible</option>
                            <option value="hidden">Hidden</option>
                        </select>
                        <select value={editForm.status} onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200">
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <Button type="button" variant="outline" onClick={closeEdit}>Hủy</Button>
                        <Button type="submit" className="gap-2" disabled={busyKey === `edit-${editingItem?.id}`}>{busyKey === `edit-${editingItem?.id}` ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}Lưu thay đổi</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={Boolean(deleteItem)} onClose={() => setDeleteItem(null)} title="Xác nhận xóa tài liệu">
                <div className="space-y-4">
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">Thao tác này sẽ xóa cả record DB và file trên Cloudinary.</div>
                    <div className="text-sm text-slate-600">Bạn có chắc muốn xóa <span className="font-semibold text-slate-900">{deleteItem?.title}</span> không?</div>
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDeleteItem(null)}>Hủy</Button>
                        <Button type="button" variant="danger" className="gap-2" onClick={removeItem} disabled={busyKey === `delete-${deleteItem?.id}`}>{busyKey === `delete-${deleteItem?.id}` ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}Xóa vĩnh viễn</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
