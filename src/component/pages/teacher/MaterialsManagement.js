import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  File,
  FileText,
  Film,
  FolderOpen,
  Image,
  Link as LinkIcon,
  MonitorPlay,
  Pencil,
  Share2,
  Table as TableIcon,
  Text as TextIcon,
  Trash2,
  Upload,
} from "lucide-react";
import { api } from "service/api";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  cn,
} from "component/ui";

const getTypeIcon = (type) => {
  switch (type) {
    case "pdf":
      return {
        icon: <FileText size={18} className="text-red-500" />,
        bg: "bg-red-50",
      };
    case "doc":
    case "docx":
      return {
        icon: <File size={18} className="text-blue-500" />,
        bg: "bg-blue-50",
      };
    case "slide":
    case "pptx":
    case "ppt":
      return {
        icon: <MonitorPlay size={18} className="text-orange-500" />,
        bg: "bg-orange-50",
      };
    case "spreadsheet":
    case "xls":
    case "xlsx":
      return {
        icon: <TableIcon size={18} className="text-green-500" />,
        bg: "bg-green-50",
      };
    case "image":
      return {
        icon: <Image size={18} className="text-purple-500" />,
        bg: "bg-purple-50",
      };
    case "video":
      return {
        icon: <Film size={18} className="text-cyan-500" />,
        bg: "bg-cyan-50",
      };
    case "archive":
    case "zip":
    case "rar":
      return {
        icon: <Archive size={18} className="text-amber-700" />,
        bg: "bg-amber-50",
      };
    case "link":
      return {
        icon: <LinkIcon size={18} className="text-slate-500" />,
        bg: "bg-slate-100",
      };
    case "text":
      return {
        icon: <TextIcon size={18} className="text-slate-500" />,
        bg: "bg-slate-50",
      };
    default:
      return {
        icon: <File size={18} className="text-slate-500" />,
        bg: "bg-slate-50",
      };
  }
};

const formatBytes = (bytes) => {
  if (bytes === null || bytes === undefined) return null;
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "dd/MM/yyyy");
  } catch {
    return dateString;
  }
};

const normalizeClass = (cls) => ({
  class_id: cls.class_id || cls.id || "",
  class_name: cls.class_name || cls.name || "",
  course_code: cls.course_code || cls.courseCode || cls.course?.code || "",
  course_name: cls.course_name || cls.courseName || cls.course?.name || "",
  status: cls.status || "",
});

export default function MaterialsManagement() {
  const { classId } = useParams();
  const [selectedClassId, setSelectedClassId] = useState(classId || "");
  const [classes, setClasses] = useState([]);
  const [general, setGeneral] = useState([]);
  const [bySession, setBySession] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState("file");
  const [selectedFile, setSelectedFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingMaterial, setSharingMaterial] = useState(null);
  const [selectedShareClassIds, setSelectedShareClassIds] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ general: true });

  const shareableClasses = useMemo(
    () =>
      classes.filter(
        (cls) =>
          cls.class_id !== selectedClassId &&
          (!cls.status || String(cls.status).toLowerCase() === "active"),
      ),
    [classes, selectedClassId],
  );

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchClasses = async () => {
    try {
      const [scheduleRes, myClassesRes] = await Promise.all([
        api.get("/teacher/schedule/classes"),
        api.get("/teacher/my-classes"),
      ]);

      const merged = [
        ...(Array.isArray(scheduleRes.data?.data) ? scheduleRes.data.data : []),
        ...(Array.isArray(myClassesRes.data?.data) ? myClassesRes.data.data : []),
      ]
        .map(normalizeClass)
        .filter((cls) => cls.class_id);

      const uniqueClasses = merged.filter(
        (cls, index, arr) => index === arr.findIndex((item) => item.class_id === cls.class_id),
      );

      setClasses(uniqueClasses);
    } catch {
      toast.error("Lỗi khi tải danh sách lớp học");
    }
  };

  const fetchMaterials = useCallback(async () => {
    if (!selectedClassId) return;
    setIsLoading(true);
    try {
      const res = await api.get(
        `/teacher/classes/${selectedClassId}/materials`,
      );
      if (res.ok && res.data?.data) {
        setGeneral(res.data.data.general || []);
        setBySession(res.data.data.by_session || []);
      } else {
        toast.error(res.data?.message || "Lỗi tải danh sách tài liệu");
      }
    } catch {
      toast.error("Lỗi khi tải danh sách tài liệu");
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchMaterials();
    } else {
      setGeneral([]);
      setBySession([]);
    }
  }, [selectedClassId, fetchMaterials]);

  const updateMaterialInState = (id, updates) => {
    setGeneral((prev) =>
      prev.map((material) =>
        material.id === id ? { ...material, ...updates } : material,
      ),
    );
    setBySession((prev) =>
      prev.map((sessionGroup) => ({
        ...sessionGroup,
        materials: sessionGroup.materials.map((material) =>
          material.id === id ? { ...material, ...updates } : material,
        ),
      })),
    );
  };

  const handleToggleVisibility = async (materialId, currentVisibility) => {
    try {
      const res = await api.patch(
        `/teacher/materials/${materialId}/visibility`,
      );
      if (res.ok) {
        const newVisibility =
          res.data?.data?.is_visible !== undefined
            ? res.data.data.is_visible
            : !currentVisibility;
        updateMaterialInState(materialId, { is_visible: newVisibility });
        toast.success(res.data?.message || "Cập nhật trạng thái thành công");
      } else {
        toast.error(res.data?.message || "Lỗi khi ẩn/hiện tài liệu");
      }
    } catch {
      toast.error("Lỗi kết nối đến máy chủ");
    }
  };

  const handleUploadFile = async () => {
    if (!title.trim()) return toast.error("Vui lòng nhập tên tài liệu");
    if (!selectedFile) return toast.error("Vui lòng chọn file");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title.trim());
    if (description.trim()) formData.append("description", description.trim());
    if (sessionId) formData.append("session_id", sessionId);
    try {
      setIsUploading(true);
      const res = await api.post(
        `/teacher/classes/${selectedClassId}/materials`,
        formData,
      );
      if (res.ok) {
        toast.success("Tải lên thành công");
        closeUploadModal();
        fetchMaterials();
      } else {
        toast.error(res.data?.message || "Lỗi khi tải lên tài liệu");
      }
    } catch {
      toast.error("Lỗi kết nối khi tải lên tài liệu");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadLink = async () => {
    if (!title.trim()) return toast.error("Vui lòng nhập tên tài liệu");
    if (!linkUrl.trim()) return toast.error("Vui lòng nhập liên kết URL");
    try {
      setIsUploading(true);
      const res = await api.post(
        `/teacher/classes/${selectedClassId}/materials`,
        {
          title: title.trim(),
          url: linkUrl.trim(),
          description: description.trim() || null,
          session_id: sessionId || null,
        },
      );
      if (res.ok) {
        toast.success("Thêm liên kết thành công");
        closeUploadModal();
        fetchMaterials();
      } else {
        toast.error(res.data?.message || "Lỗi khi thêm liên kết");
      }
    } catch {
      toast.error("Lỗi kết nối khi thêm liên kết");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSubmit = () => {
    if (uploadMode === "file") {
      handleUploadFile();
      return;
    }
    handleUploadLink();
  };

  const handleUpdate = async () => {
    if (!editingMaterial) return;
    if (!title.trim()) return toast.error("Vui lòng nhập tên tài liệu");

    const body = {};
    if (title.trim() !== editingMaterial.title) body.title = title.trim();
    if ((description || "") !== (editingMaterial.description || ""))
      body.description = description.trim() || null;
    if (editingMaterial.type === "link" && linkUrl !== editingMaterial.file_url)
      body.url = linkUrl.trim();

    const currentSessionId = editingMaterial.session_id || "";
    if (sessionId !== currentSessionId) body.session_id = sessionId || null;

    try {
      const res = await api.put(
        `/teacher/materials/${editingMaterial.id}`,
        body,
      );
      if (res.ok) {
        toast.success("Cập nhật thành công");
        closeEditModal();
        fetchMaterials();
      } else {
        toast.error(res.data?.message || "Lỗi khi cập nhật tài liệu");
      }
    } catch {
      toast.error("Lỗi kết nối khi cập nhật");
    }
  };

  const handleDelete = async () => {
    if (!deletingMaterialId) return;
    try {
      const res = await api.delete(`/teacher/materials/${deletingMaterialId}`);
      if (res.ok) {
        toast.success("Đã xóa tài liệu");
        setIsDeleteConfirmOpen(false);
        setDeletingMaterialId(null);
        fetchMaterials();
      } else {
        toast.error(res.data?.message || "Lỗi khi xóa tài liệu");
      }
    } catch {
      toast.error("Lỗi kết nối khi xóa");
    }
  };

  const handleShareSubmit = async () => {
    if (!sharingMaterial) return;
    if (selectedShareClassIds.length === 0) {
      const message = "Vui lòng chọn ít nhất một lớp để chia sẻ";
      setShareError(message);
      return toast.error(message);
    }

    try {
      setIsSharing(true);
      setShareError("");
      const res = await api.post(
        `/teacher/materials/${sharingMaterial.id}/share`,
        {
          target_class_ids: selectedShareClassIds,
        },
      );

      if (res.ok) {
        const sharedCount =
          res.data?.data?.shared_count || selectedShareClassIds.length;
        toast.success(`Đã chia sẻ tài liệu tới ${sharedCount} lớp`);
        closeShareModal();
      } else {
        const message =
          res.data?.message ||
          (res.data?.code === "DUPLICATE_SHARE"
            ? "Tài liệu này đã được chia sẻ tới các lớp đã chọn trước đó."
            : "Lỗi khi chia sẻ tài liệu");
        setShareError(message);
        toast.error(message);
      }
    } catch {
      const message = "Lỗi kết nối khi chia sẻ tài liệu";
      setShareError(message);
      toast.error(message);
    } finally {
      setIsSharing(false);
    }
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadMode("file");
    setSelectedFile(null);
    setLinkUrl("");
    setTitle("");
    setDescription("");
    setSessionId("");
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingMaterial(null);
    setLinkUrl("");
    setTitle("");
    setDescription("");
    setSessionId("");
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setSharingMaterial(null);
    setSelectedShareClassIds([]);
    setShareError("");
  };

  const openEditModal = (material) => {
    setEditingMaterial(material);
    setTitle(material.title || "");
    setDescription(material.description || "");
    setLinkUrl(material.file_url || "");
    setSessionId(material.session_id || "");
    setIsEditModalOpen(true);
  };

  const openShareModal = (material) => {
    setSharingMaterial(material);
    setSelectedShareClassIds([]);
    setShareError("");
    setIsShareModalOpen(true);
  };

  const confirmDelete = (id) => {
    setDeletingMaterialId(id);
    setIsDeleteConfirmOpen(true);
  };

  const toggleShareClass = (targetClassId) => {
    setSelectedShareClassIds((prev) =>
      prev.includes(targetClassId)
        ? prev.filter((id) => id !== targetClassId)
        : [...prev, targetClassId],
    );
  };

  const renderMaterialRow = (material) => {
    const typeInfo = getTypeIcon(material.type);
    const sizeStr = formatBytes(material.file_size);
    const dateStr = formatDate(material.created_at);

    return (
      <div
        key={material.id}
        className={cn(
          "group flex flex-col justify-between border-b border-slate-100 p-4 transition-colors last:border-b-0 hover:bg-slate-50 sm:flex-row sm:items-center",
          !material.is_visible && "bg-slate-50 opacity-60",
        )}
      >
        <div className="flex flex-1 items-start gap-4">
          <div className={cn("mt-1 flex-shrink-0 rounded-lg p-2", typeInfo.bg)}>
            {typeInfo.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <a
                href={material.file_url}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm font-semibold text-slate-900 underline-offset-2 hover:text-blue-600 hover:underline"
              >
                {material.title}
              </a>
              {!material.is_visible && (
                <Badge tone="slate" className="text-[10px]">
                  Đã ẩn
                </Badge>
              )}
            </div>
            {material.description && (
              <div className="mt-0.5 line-clamp-1 text-xs italic text-slate-500">
                {material.description}
              </div>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {sizeStr && <span>{sizeStr}</span>}
              {sizeStr && (
                <span className="h-1 w-1 rounded-full bg-slate-300" />
              )}
              <span>{dateStr}</span>
              {material.type === "link" && (
                <span className="h-1 w-1 rounded-full bg-slate-300" />
              )}
              {material.type === "link" && (
                <span className="max-w-[200px] truncate text-blue-500">
                  {material.file_url}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1 transition-opacity sm:mt-0 sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            variant="ghost"
            title={material.is_visible ? "Ẩn tài liệu" : "Hiện tài liệu"}
            className={cn(
              "px-2 py-1.5",
              material.is_visible ? "text-blue-600" : "text-slate-500",
            )}
            onClick={() =>
              handleToggleVisibility(material.id, material.is_visible)
            }
          >
            {material.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
            <span className="ml-1.5 sm:hidden">
              {material.is_visible ? "Hiện" : "Ẩn"}
            </span>
          </Button>

          <Button
            variant="ghost"
            title="Chia sẻ tài liệu"
            className="px-2 py-1.5 text-slate-600 hover:text-emerald-600"
            onClick={() => openShareModal(material)}
          >
            <Share2 size={16} />
            <span className="ml-1.5 sm:hidden">Chia sẻ</span>
          </Button>

          <Button
            variant="ghost"
            title="Chỉnh sửa"
            className="px-2 py-1.5 text-slate-600 hover:text-blue-600"
            onClick={() => openEditModal(material)}
          >
            <Pencil size={16} />
            <span className="ml-1.5 sm:hidden">Sửa</span>
          </Button>

          <Button
            variant="ghost"
            title="Xóa tài liệu"
            className="px-2 py-1.5 text-slate-600 hover:text-red-600"
            onClick={() => confirmDelete(material.id)}
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
      <div className="animate-pulse p-8 text-center text-slate-500">
        Đang tải danh sách tài liệu...
      </div>
    );
  }

  const isEmpty =
    general.length === 0 &&
    bySession.every((sessionGroup) => !sessionGroup.materials?.length);

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
            <div className="mt-2 max-w-xs text-sm">
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">-- Chọn lớp học --</option>
                {classes.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.class_name || `Lớp ${cls.class_id}`} {" "}
                    {cls.course_code ? `- ${cls.course_code}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            "Lớp học / Tài liệu"
          )
        }
        right={[
          <Button
            key="upload"
            onClick={() => setIsUploadModalOpen(true)}
            className="gap-2"
            disabled={!selectedClassId}
          >
            <Upload size={16} />
            Tải lên
          </Button>,
        ]}
      />

      <div className="space-y-6">
        {!selectedClassId ? (
          <Card className="border-dashed bg-slate-50/50 p-10 text-center">
            <div className="flex flex-col items-center justify-center text-slate-500">
              <LinkIcon className="mb-3 text-slate-300" size={48} />
              <h3 className="text-lg font-medium text-slate-700">
                Chưa chọn lớp học
              </h3>
              <p className="mb-4 text-sm">
                Vui lòng chọn một lớp học ở trên để xem và quản lý tài liệu.
              </p>
            </div>
          </Card>
        ) : isEmpty ? (
          <Card className="border-dashed bg-slate-50/50 p-10 text-center">
            <div className="flex flex-col items-center justify-center text-slate-500">
              <FolderOpen className="mb-3 text-slate-300" size={48} />
              <h3 className="text-lg font-medium text-slate-700">
                Chưa có tài liệu nào
              </h3>
              <p className="mb-4 text-sm">
                Bấm "Tải lên" để thêm tài liệu mới cho lớp học
              </p>
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Upload size={16} className="mr-2" />
                Tải lên tài liệu
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {general.length > 0 && (
              <section>
                <div
                  className="mb-2 flex cursor-pointer items-center justify-between rounded-lg bg-slate-100 px-2 py-3"
                  onClick={() => toggleSection("general")}
                >
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Archive size={18} className="text-slate-500" />
                    TÀI LIỆU CHUNG
                  </div>
                  <Button
                    variant="ghost"
                    className="h-auto p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                  >
                    {expandedSections.general ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </Button>
                </div>
                {expandedSections.general && (
                  <Card>
                    <div className="divide-y divide-slate-100">
                      {general.map((material) => renderMaterialRow(material))}
                    </div>
                  </Card>
                )}
              </section>
            )}

            {bySession.map((sessionGroup) => {
              const { session, materials } = sessionGroup;
              const sectionId = `session_${session.id}`;
              const isExpanded = expandedSections[sectionId] !== false;

              return (
                <section key={session.id}>
                  <div
                    className="mb-2 flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-3"
                    onClick={() => toggleSection(sectionId)}
                  >
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="text-slate-500"></span>
                      {`BUỔI ${session.index} - ${formatDate(session.start_time)} - ${session.topic || "Chưa có chủ đề"}`}
                    </div>
                    <Button
                      variant="ghost"
                      className="h-auto p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                    >
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </Button>
                  </div>
                  {isExpanded && (
                    <Card>
                      {materials && materials.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {materials.map((material) =>
                            renderMaterialRow(material),
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 py-6 text-center text-sm text-slate-500">
                          <span className="mb-2">
                            Chưa có tài liệu cho buổi này.
                          </span>
                          <Button
                            variant="outline"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionId(session.id);
                              setIsUploadModalOpen(true);
                            }}
                          >
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

      <Modal
        open={isUploadModalOpen}
        onClose={closeUploadModal}
        title="Tải lên tài liệu"
      >
        <div className="space-y-4">
          <div className="flex gap-4 border-b border-slate-100 pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="uploadMode"
                checked={uploadMode === "file"}
                onChange={() => setUploadMode("file")}
                className="text-blue-600 focus:ring-blue-500"
              />
              File từ máy tính
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
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
              <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-colors hover:bg-slate-100">
                <input
                  type="file"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      setSelectedFile(file);
                      if (!title) setTitle(file.name);
                    }
                  }}
                />
                <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                <div className="text-sm font-medium text-slate-700">
                  Kéo thả file vào đây hoặc bấm để chọn
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Hỗ trợ PDF, DOCX, PPTX, XLSX, ZIP, JPG, MP4... (tối đa 100MB)
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-2 text-sm text-blue-700">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={16} className="text-blue-500" />
                    <span className="truncate">{selectedFile.name}</span>
                    <span className="shrink-0 text-blue-400">
                      ({formatBytes(selectedFile.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-6 w-6 shrink-0 p-0 text-blue-400 hover:bg-blue-100 hover:text-blue-700"
                    onClick={() => setSelectedFile(null)}
                  >
                    x
                  </Button>
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
            <label className="font-medium text-slate-700">
              Tên tài liệu (*)
            </label>
            <Input
              placeholder="Nhập tên tài liệu hiển thị"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="font-medium text-slate-700">
              Mô tả (tùy chọn)
            </label>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Mô tả ngắn gọn về tài liệu này"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="font-medium text-slate-700">
              Gắn vào khóa học / buổi học
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            >
              <option value="">Tài liệu chung (xuyên suốt khóa học)</option>
              {bySession.map((sessionGroup) => (
                <option
                  key={sessionGroup.session.id}
                  value={sessionGroup.session.id}
                >
                  {`Buổi ${sessionGroup.session.index} - ${formatDate(sessionGroup.session.start_time)} - ${
                    sessionGroup.session.topic || "Chưa rõ chủ đề"
                  }`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={closeUploadModal}
              disabled={isUploading}
            >
              Hủy bỏ
            </Button>
            <Button onClick={handleUploadSubmit} disabled={isUploading}>
              {isUploading ? "Đang tải lên..." : "Tải lên"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isEditModalOpen}
        onClose={closeEditModal}
        title="Chỉnh sửa tài liệu"
      >
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
            <label className="font-medium text-slate-700">
              Tên tài liệu (*)
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1 text-sm">
            <label className="font-medium text-slate-700">Mô tả</label>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
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
              <option value="">Tài liệu chung</option>
              {bySession.map((sessionGroup) => (
                <option
                  key={sessionGroup.session.id}
                  value={sessionGroup.session.id}
                >
                  {`Buổi ${sessionGroup.session.index} - ${formatDate(sessionGroup.session.start_time)}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={closeEditModal}>
              Hủy bỏ
            </Button>
            <Button onClick={handleUpdate}>Lưu thay đổi</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isShareModalOpen}
        onClose={closeShareModal}
        title="Chia sẻ tài liệu sang lớp khác"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
            <div className="font-semibold">
              {sharingMaterial?.title || "Tài liệu"}
            </div>
            <div className="mt-1 text-emerald-800">
              Tài liệu sẽ được sao chép sang các lớp bạn đang dạy. Nếu tài liệu
              hiện tại đang gắn với một buổi học, bản sao ở lớp nhận sẽ được tạo
              thành tài liệu chung.
            </div>
          </div>

          {shareError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {shareError}
            </div>
          )}

          {shareableClasses.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Bạn không có lớp khác để chia sẻ tài liệu này.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">
                Chọn lớp nhận
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {shareableClasses.map((cls) => {
                  const checked = selectedShareClassIds.includes(cls.class_id);
                  return (
                    <label
                      key={cls.class_id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
                        checked
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        onChange={() => toggleShareClass(cls.class_id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-800">
                          {cls.class_name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {cls.course_code ? `${cls.course_code} - ` : ""}
                          {cls.course_name || "Không rõ môn học"}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={closeShareModal}
              disabled={isSharing}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleShareSubmit}
              disabled={isSharing || shareableClasses.length === 0}
            >
              {isSharing ? "Đang chia sẻ..." : "Chia sẻ"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Bạn có chắc muốn xóa tài liệu này vĩnh viễn?
          </p>
          <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-800">
            <span className="pt-0.5 text-red-500">!</span>
            <span>Hành động này không thể hoàn tác.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Xóa vĩnh viễn
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
