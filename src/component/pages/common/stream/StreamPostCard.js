// src/component/pages/common/stream/StreamPostCard.js
import React, { useState, useRef, useEffect } from "react";
import { Badge, cn } from "component/ui";
import StreamPostForm from "./StreamPostForm";
import StreamComments from "./StreamComments";
import { streamApi } from "service/streamApi";
import {
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  Download,
  FileText,
  ImagePlus,
  Film,
  File,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

const BASE_URL = "http://localhost:9999";

const POST_TYPE_CONFIG = {
  announcement: { label: "Thông báo", tone: "blue", emoji: "📢" },
  discussion: { label: "Thảo luận", tone: "green", emoji: "💬" },
  question: { label: "Câu hỏi", tone: "amber", emoji: "❓" },
  resource: { label: "Tài nguyên", tone: "slate", emoji: "📁" },
};

function getFileIcon(fileName) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext))
    return <ImagePlus size={14} className="text-green-500" />;
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext))
    return <Film size={14} className="text-purple-500" />;
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext))
    return <FileText size={14} className="text-blue-500" />;
  return <File size={14} className="text-slate-400" />;
}

function isImage(fileName) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StreamPostCard({ post, classId, onPostChanged, canComment }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // Lưu URL ảnh để view modal
  const menuRef = useRef(null);

  const perms = post.permissions || {};
  const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.announcement;
  const authorName = post.author?.full_name || post.author?.email || "Người dùng";
  const authorRole = post.author?.role;
  const avatarLetter = authorName.charAt(0).toUpperCase();
  const avatarUrl = post.author?.avatar_url || post.author?.avatarUrl;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa bài đăng này?")) return;
    setMenuOpen(false);
    try {
      const res = await streamApi.deletePost(classId, post._id || post.id);
      if (res.ok) {
        toast.success("Đã xóa bài đăng.");
        onPostChanged?.("delete", post._id || post.id);
      } else {
        toast.error(res.data?.message || "Không thể xóa bài đăng.");
      }
    } catch (err) {
      toast.error("Lỗi khi xóa bài đăng.");
    }
  };

  const handlePin = async () => {
    setMenuOpen(false);
    try {
      const res = await streamApi.pinPost(classId, post._id || post.id, !post.is_pinned);
      if (res.ok) {
        toast.success(post.is_pinned ? "Đã bỏ ghim." : "Đã ghim bài đăng.");
        onPostChanged?.("update", res.data?.data);
      } else {
        toast.error(res.data?.message || "Không thể thay đổi trạng thái ghim.");
      }
    } catch (err) {
      toast.error("Lỗi khi ghim/bỏ ghim.");
    }
  };

  const handleToggleComments = async () => {
    setMenuOpen(false);
    try {
      const res = await streamApi.updateCommentPolicy(
        classId,
        post._id || post.id,
        !post.allow_comments
      );
      if (res.ok) {
        toast.success(post.allow_comments ? "Đã khóa bình luận." : "Đã mở bình luận.");
        onPostChanged?.("update", res.data?.data);
      } else {
        toast.error(res.data?.message || "Không thể thay đổi chính sách bình luận.");
      }
    } catch (err) {
      toast.error("Lỗi khi thay đổi bình luận.");
    }
  };

  const handleEditSuccess = (updatedPost) => {
    setIsEditing(false);
    onPostChanged?.("update", updatedPost);
  };

  const hasMenu = perms.can_edit || perms.can_delete || perms.can_pin || perms.can_unpin || perms.can_lock_comments || perms.can_unlock_comments;

  if (isEditing) {
    return (
      <StreamPostForm
        classId={classId}
        editingPost={post}
        onSuccess={handleEditSuccess}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md",
        post.is_pinned
          ? "border-amber-200 bg-amber-50/30 ring-1 ring-amber-100"
          : "border-slate-200"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-2">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm overflow-hidden",
            !avatarUrl && (authorRole === "teacher"
              ? "bg-gradient-to-br from-emerald-500 to-teal-600"
              : "bg-gradient-to-br from-blue-500 to-indigo-600")
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            avatarLetter
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{authorName}</span>
            {authorRole === "teacher" && (
              <Badge tone="green" className="text-[10px] py-0">
                Giáo viên
              </Badge>
            )}
            {authorRole === "student" && (
              <Badge tone="blue" className="text-[10px] py-0">
                Sinh viên
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">{formatTime(post.created_at)}</span>
            {post.updated_at && post.updated_at !== post.created_at && (
              <span className="text-[10px] text-slate-300 italic">(đã chỉnh sửa)</span>
            )}
            <Badge tone={typeConfig.tone} className="text-[10px] gap-1">
              {typeConfig.emoji} {post.post_type_label || typeConfig.label}
            </Badge>
            {post.is_pinned && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                <Pin size={10} /> Đã ghim
              </div>
            )}
          </div>
        </div>

        {/* Action Menu */}
        {hasMenu && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                {perms.can_edit && (
                  <button
                    onClick={() => { setIsEditing(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Pencil size={14} /> Chỉnh sửa
                  </button>
                )}
                {(perms.can_pin || perms.can_unpin) && (
                  <button
                    onClick={handlePin}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Pin size={14} /> {post.is_pinned ? "Bỏ ghim" : "Ghim bài"}
                  </button>
                )}
                {(perms.can_lock_comments || perms.can_unlock_comments) && (
                  <button
                    onClick={handleToggleComments}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {post.allow_comments ? (
                      <><Lock size={14} /> Khóa bình luận</>
                    ) : (
                      <><Unlock size={14} /> Mở bình luận</>
                    )}
                  </button>
                )}
                {perms.can_delete && (
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                  >
                    <Trash2 size={14} /> Xóa bài đăng
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-3">
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Attachments */}
      {post.attachments?.length > 0 && (
        <div className="px-5 pb-3">
          {/* Image Gallery */}
          {post.attachments.filter((a) => isImage(a.original_name || a.filename)).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {post.attachments
                .filter((a) => isImage(a.original_name || a.filename))
                .map((att) => {
                  const url = att.file_url?.startsWith("http") ? att.file_url : `${BASE_URL}${att.file_url}`;
                  return (
                    <button
                      key={att._id || att.id}
                      onClick={() => setPreviewImage(url)}
                      className="block rounded-xl overflow-hidden border border-slate-100 hover:border-blue-300 transition-colors group cursor-pointer"
                    >
                      <img
                        src={url}
                        alt={att.original_name || att.filename}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>
                  );
                })}
            </div>
          )}

          {/* Non-image Files */}
          {post.attachments.filter((a) => !isImage(a.original_name || a.filename)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.attachments
                .filter((a) => !isImage(a.original_name || a.filename))
                .map((att) => {
                  const url = att.file_url?.startsWith("http") ? att.file_url : `${BASE_URL}${att.file_url}`;
                  const name = att.original_name || att.filename || "file";
                  return (
                    <a
                      key={att._id || att.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
                    >
                      {getFileIcon(name)}
                      <span className="max-w-[180px] truncate font-medium">{name}</span>
                      <Download size={12} className="text-slate-400" />
                    </a>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Comment count indicator */}
      {(post.comment_count > 0 || post.allow_comments !== false) && (
        <div className="px-5 pb-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MessageSquare size={12} />
            {post.comment_count || 0} bình luận
            {post.allow_comments === false && (
              <span className="flex items-center gap-1 text-amber-500">
                <Lock size={10} /> Đã khóa
              </span>
            )}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <StreamComments
        classId={classId}
        postId={post._id || post.id}
        allowComments={post.allow_comments !== false}
        canComment={canComment}
        commentCount={post.comment_count || 0}
      />

      {/* Image Preview Modal (Lightbox) */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in cursor-zoom-out p-4 md:p-10"
          onClick={() => setPreviewImage(null)}
        >
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
          {/* Nút thoát */}
          <button 
            className="absolute top-4 right-4 text-white hover:text-red-400 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          {/* Tuỳ chọn tải về theo ý người dùng: "có thể tuỳ chọn tải hay không" */}
          <a
            href={previewImage}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-6 right-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium shadow-xl transition-colors cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={18} />
            Lưu ảnh
          </a>
        </div>
      )}
    </div>
  );
}
