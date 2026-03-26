// src/component/pages/common/stream/StreamPostForm.js
import React, { useState, useRef } from "react";
import { Button, cn } from "component/ui";
import { store } from "service/store";
import { streamApi } from "service/streamApi";
import {
  X,
  Paperclip,
  ImagePlus,
  Send,
  Loader2,
  FileText,
  Film,
  File,
} from "lucide-react";
import { toast } from "sonner";

const POST_TYPES = [
  { value: "announcement", label: "Thông báo", color: "bg-blue-100 text-blue-700" },
  { value: "discussion", label: "Thảo luận", color: "bg-green-100 text-green-700" },
  { value: "question", label: "Câu hỏi", color: "bg-amber-100 text-amber-700" },
  { value: "resource", label: "Tài nguyên", color: "bg-purple-100 text-purple-700" },
];

function getFileIcon(fileName) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext))
    return <ImagePlus size={16} className="text-green-500" />;
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext))
    return <Film size={16} className="text-purple-500" />;
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext))
    return <FileText size={16} className="text-blue-500" />;
  return <File size={16} className="text-slate-400" />;
}

export default function StreamPostForm({
  classId,
  editingPost = null,
  onSuccess,
  onCancel,
  isReadOnly = false,
}) {
  const [postType, setPostType] = useState(editingPost?.post_type || "announcement");
  const [content, setContent] = useState(editingPost?.content || "");
  const [allowComments, setAllowComments] = useState(
    editingPost ? editingPost.allow_comments !== false : true
  );
  const [newFiles, setNewFiles] = useState([]);
  const [retainedAttachments, setRetainedAttachments] = useState(
    editingPost?.attachments || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!!editingPost);
  const fileInputRef = useRef(null);

  const currentUser = store.getCurrentUser();
  const avatarUrl = currentUser?.avatar_url || currentUser?.avatarUrl;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeNewFile = (idx) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeRetainedAttachment = (attachmentId) => {
    setRetainedAttachments((prev) => prev.filter((a) => (a._id || a.id) !== attachmentId));
  };

  const handleSubmit = async () => {
    if (!content.trim() && newFiles.length === 0 && retainedAttachments.length === 0) {
      toast.error("Vui lòng nhập nội dung hoặc đính kèm ít nhất 1 tệp.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("post_type", postType);
      formData.append("content", content);
      formData.append("allow_comments", String(allowComments));

      if (editingPost) {
        const retainIds = retainedAttachments.map((a) => a._id || a.id);
        formData.append("retain_attachment_ids", JSON.stringify(retainIds));
      }

      newFiles.forEach((file) => formData.append("files", file));

      let res;
      if (editingPost) {
        res = await streamApi.updatePost(classId, editingPost._id || editingPost.id, formData);
      } else {
        res = await streamApi.createPost(classId, formData);
      }

      if (res.ok) {
        toast.success(editingPost ? "Đã cập nhật bài đăng!" : "Đã đăng bài thành công!");
        setContent("");
        setNewFiles([]);
        setRetainedAttachments([]);
        setIsExpanded(false);
        onSuccess?.(res.data?.data);
      } else {
        toast.error(res.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Post submit error:", err);
      toast.error("Không thể gửi bài đăng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReadOnly) return null;

  // Compact mode — just show a clickable bar
  if (!isExpanded && !editingPost) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-300"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            "✏️"
          )}
        </div>
        <span className="text-sm text-slate-400 group-hover:text-slate-600 transition-colors">
          Chia sẻ thông tin với lớp học...
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Post Type Selector */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 flex-wrap">
        {POST_TYPES.map((pt) => (
          <button
            key={pt.value}
            onClick={() => setPostType(pt.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200",
              postType === pt.value
                ? `${pt.color} ring-2 ring-offset-1 ring-blue-300 scale-105`
                : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            )}
          >
            {pt.label}
          </button>
        ))}
      </div>

      {/* Content Textarea */}
      <div className="px-5 py-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung bài đăng..."
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white focus:border-blue-200 transition-all placeholder:text-slate-300"
        />
      </div>

      {/* Existing Attachments (Edit mode) */}
      {editingPost && retainedAttachments.length > 0 && (
        <div className="px-5 pb-2">
          <div className="text-xs font-semibold text-slate-400 mb-2">Tệp đính kèm hiện tại</div>
          <div className="flex flex-wrap gap-2">
            {retainedAttachments.map((att) => (
              <div
                key={att._id || att.id}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
              >
                {getFileIcon(att.original_name || att.filename)}
                <span className="text-slate-600 max-w-[150px] truncate">
                  {att.original_name || att.filename}
                </span>
                <button
                  onClick={() => removeRetainedAttachment(att._id || att.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Files Preview */}
      {newFiles.length > 0 && (
        <div className="px-5 pb-2">
          <div className="text-xs font-semibold text-slate-400 mb-2">Tệp mới</div>
          <div className="flex flex-wrap gap-2">
            {newFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs"
              >
                {getFileIcon(file.name)}
                <span className="text-blue-700 max-w-[150px] truncate">{file.name}</span>
                <span className="text-blue-400">
                  ({(file.size / 1024).toFixed(0)}KB)
                </span>
                <button
                  onClick={() => removeNewFile(idx)}
                  className="text-blue-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
          >
            <Paperclip size={14} />
            Đính kèm
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 cursor-pointer select-none hover:bg-white hover:text-slate-700 transition-all">
            <input
              type="checkbox"
              checked={allowComments}
              onChange={(e) => setAllowComments(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-200"
            />
            Cho phép bình luận
          </label>
        </div>

        <div className="flex items-center gap-2">
          {(editingPost || isExpanded) && (
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() => {
                if (editingPost) {
                  onCancel?.();
                } else {
                  setIsExpanded(false);
                  setContent("");
                  setNewFiles([]);
                }
              }}
            >
              Hủy
            </Button>
          )}
          <Button
            variant="primary"
            className="gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {editingPost ? "Cập nhật" : "Đăng tin"}
          </Button>
        </div>
      </div>
    </div>
  );
}
