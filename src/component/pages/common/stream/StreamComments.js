// src/component/pages/common/stream/StreamComments.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { streamApi } from "service/streamApi";
import { Button, Badge, cn } from "component/ui";
import {
  Send,
  Loader2,
  Paperclip,
  X,
  MoreHorizontal,
  Pencil,
  Trash2,
  Reply,
  FileText,
  ImagePlus,
  Film,
  File,
  Download,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

const BASE_URL = "http://localhost:9999";

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
function buildCommentTree(flatComments) {
  const commentMap = new Map();
  const roots = [];

  // Khởi tạo map
  flatComments.forEach((c) => {
    commentMap.set(c._id || c.id, { ...c, replies: [] });
  });

  // Xây dựng cây
  flatComments.forEach((c) => {
    const parentId = c.parent_comment_id;
    const node = commentMap.get(c._id || c.id);
    if (parentId && commentMap.has(parentId)) {
      commentMap.get(parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ─── Single Comment Component ────────────────────────────────────
function CommentItem({ comment, classId, depth = 0, onCommentChanged, onReply, onPreviewImage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || "");
  const [editFiles, setEditFiles] = useState([]);
  const [retainedAttachments, setRetainedAttachments] = useState(comment.attachments || []);
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef(null);
  const editFileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    setMenuOpen(false);
    try {
      const res = await streamApi.deleteComment(classId, comment._id || comment.id);
      if (res.ok) {
        toast.success("Đã xóa bình luận.");
        onCommentChanged?.("delete", comment._id || comment.id, res.data?.data?.deleted_comment_ids);
      } else {
        toast.error(res.data?.message || "Không thể xóa bình luận.");
      }
    } catch (err) {
      toast.error("Lỗi khi xóa bình luận.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() && editFiles.length === 0 && retainedAttachments.length === 0) {
      toast.error("Bình luận phải có nội dung hoặc tệp đính kèm.");
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("content", editContent);
      const retainIds = retainedAttachments.map((a) => a._id || a.id);
      formData.append("retain_attachment_ids", JSON.stringify(retainIds));
      editFiles.forEach((f) => formData.append("files", f));

      const res = await streamApi.updateComment(classId, comment._id || comment.id, formData);
      if (res.ok) {
        toast.success("Đã cập nhật bình luận.");
        setIsEditing(false);
        setEditFiles([]);
        onCommentChanged?.("update", res.data?.data);
      } else {
        toast.error(res.data?.message || "Không thể cập nhật.");
      }
    } catch (err) {
      toast.error("Lỗi khi cập nhật bình luận.");
    } finally {
      setIsSaving(false);
    }
  };

  const authorName = comment.author?.full_name || comment.author?.email || "Người dùng";
  const authorRole = comment.author?.role;
  const avatarLetter = authorName.charAt(0).toUpperCase();

  return (
    <div className={cn("relative group", depth > 0 ? "mt-3" : "mt-4")}>
      {/* Đường kẻ dọc cho thread (Bắt đầu từ giữa avatar cha: 16px) */}
      {depth > 0 && (
        <div className="absolute -left-7 top-0 bottom-0 w-px bg-slate-200 group-last:bottom-auto group-last:h-8"></div>
      )}
      {/* Đường kẻ ngang nối vào avatar con */}
      {depth > 0 && (
        <div className="absolute -left-7 top-4 w-7 h-px bg-slate-200"></div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
            authorRole === "teacher"
              ? "bg-gradient-to-br from-emerald-500 to-teal-600"
              : "bg-gradient-to-br from-slate-400 to-slate-500"
          )}
        >
          {avatarLetter}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800">{authorName}</span>
            {authorRole === "teacher" && (
              <Badge tone="green" className="text-[10px] py-0">
                Giảng viên
              </Badge>
            )}
            <span className="text-xs text-slate-400">{formatTime(comment.created_at)}</span>
            {comment.updated_at && comment.updated_at !== comment.created_at && (
              <span className="text-[10px] text-slate-300 italic">(đã chỉnh sửa)</span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
              {retainedAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {retainedAttachments.map((att) => (
                    <div
                      key={att._id || att.id}
                      className="flex items-center gap-1 bg-slate-50 rounded px-2 py-1 text-xs"
                    >
                      {getFileIcon(att.original_name || att.filename)}
                      <span className="truncate max-w-[100px]">{att.original_name || att.filename}</span>
                      <button
                        onClick={() =>
                          setRetainedAttachments((p) => p.filter((a) => (a._id || a.id) !== (att._id || att.id)))
                        }
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {editFiles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {editFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 bg-blue-50 rounded px-2 py-1 text-xs">
                      {getFileIcon(f.name)}
                      <span className="truncate max-w-[100px]">{f.name}</span>
                      <button
                        onClick={() => setEditFiles((p) => p.filter((_, idx) => idx !== i))}
                        className="text-blue-400 hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 hover:text-blue-500 flex items-center gap-1 cursor-pointer">
                  <Paperclip size={12} /> Đính kèm
                  <input
                    ref={editFileRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0) {
                        setEditFiles((p) => [...p, ...files]);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
                <div className="flex-1" />
                <Button variant="ghost" className="text-xs py-1 px-2" onClick={() => { setIsEditing(false); setEditContent(comment.content || ""); setEditFiles([]); setRetainedAttachments(comment.attachments || []); }}>
                  Hủy
                </Button>
                <Button variant="primary" className="text-xs py-1 px-2 gap-1" onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? <Loader2 size={12} className="animate-spin" /> : null} Lưu
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">
                {comment.content}
              </p>

              {/* Attachments */}
              {comment.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {comment.attachments.map((att) => {
                    const url = att.file_url?.startsWith("http") ? att.file_url : `${BASE_URL}${att.file_url}`;
                    const name = att.original_name || att.filename || "file";
                    return isImage(name) ? (
                      <button
                        key={att._id || att.id}
                        onClick={() => onPreviewImage?.(url)}
                        className="block rounded-lg overflow-hidden border border-slate-200 hover:border-blue-300 transition-colors cursor-zoom-in"
                      >
                        <img
                          src={url}
                          alt={name}
                          className="h-16 w-16 object-cover"
                        />
                      </button>
                    ) : (
                      <a
                        key={att._id || att.id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                      >
                        {getFileIcon(name)}
                        <span className="max-w-[120px] truncate">{name}</span>
                        <Download size={12} />
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Reply + Actions */}
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => onReply?.(comment)}
                  className="text-xs text-slate-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
                >
                  <Reply size={12} /> Trả lời
                </button>
              </div>
            </>
          )}
        </div>

        {/* Menu */}
        {(comment.permissions?.can_edit || comment.permissions?.can_delete) && !isEditing && (
          <div ref={menuRef} className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                {comment.permissions?.can_edit && (
                  <button
                    onClick={() => { setIsEditing(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={14} /> Chỉnh sửa
                  </button>
                )}
                {comment.permissions?.can_delete && (
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render child replies */}
      {comment.replies?.length > 0 && (
        <div className="pl-11 mt-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id || reply.id}
              comment={reply}
              classId={classId}
              depth={depth + 1}
              onCommentChanged={onCommentChanged}
              onReply={onReply}
              onPreviewImage={onPreviewImage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Comments Section ───────────────────────────────────────
export default function StreamComments({
  classId,
  postId,
  allowComments = true,
  canComment = true,
  commentCount = 0,
}) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // New comment state
  const [newContent, setNewContent] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const fileInputRef = useRef(null);

  const fetchComments = useCallback(async (p = 1) => {
    setIsLoading(true);
    try {
      const res = await streamApi.getComments(classId, postId, p, 20);
      if (res.ok) {
        const data = res.data?.data;
        const fetched = data?.comments || [];
        if (p === 1) {
          setComments(fetched);
        } else {
          setComments((prev) => [...prev, ...fetched]);
        }
        setHasMore(data?.pagination?.has_next || false);
        setPage(p);
      }
    } catch (err) {
      console.error("Fetch comments error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [classId, postId]);

  useEffect(() => {
    if (isExpanded) {
      fetchComments(1);
    }
  }, [isExpanded, fetchComments]);

  const handleSubmitComment = async () => {
    if (!newContent.trim() && newFiles.length === 0) {
      toast.error("Vui lòng nhập nội dung hoặc đính kèm tệp.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", newContent);
      if (replyTo) {
        formData.append("parent_comment_id", replyTo._id || replyTo.id);
      }
      newFiles.forEach((f) => formData.append("files", f));

      const res = await streamApi.createComment(classId, postId, formData);
      if (res.ok) {
        toast.success("Đã gửi bình luận!");
        setNewContent("");
        setNewFiles([]);
        setReplyTo(null);
        fetchComments(1);
      } else {
        toast.error(res.data?.message || "Không thể gửi bình luận.");
      }
    } catch (err) {
      toast.error("Lỗi khi gửi bình luận.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentChanged = (type, data, deletedIds) => {
    if (type === "delete") {
      const idsToRemove = deletedIds || [data];
      setComments((prev) => prev.filter((c) => !idsToRemove.includes(c._id || c.id)));
    } else if (type === "update") {
      setComments((prev) =>
        prev.map((c) => ((c._id || c.id) === (data._id || data.id) ? { ...c, ...data } : c))
      );
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
  };

  return (
    <div className="border-t border-slate-100">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold">
          💬 Bình luận {commentCount > 0 && `(${commentCount})`}
        </span>
        <ChevronDown
          size={16}
          className={cn("transition-transform duration-200", isExpanded && "rotate-180")}
        />
      </button>

      {isExpanded && (
        <div className="px-5 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Comment List */}
          {isLoading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-4 italic">
              Chưa có bình luận nào.
            </p>
          ) : (
            <div className="divide-y divide-transparent max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {buildCommentTree(comments).map((comment) => (
                <CommentItem
                  key={comment._id || comment.id}
                  comment={comment}
                  classId={classId}
                  onCommentChanged={handleCommentChanged}
                  onReply={handleReply}
                  onPreviewImage={setLightboxUrl}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={() => fetchComments(page + 1)}
              disabled={isLoading}
              className="w-full py-2 text-xs text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
            >
              {isLoading ? "Đang tải..." : "Xem thêm bình luận"}
            </button>
          )}

          {/* New Comment Form */}
          {allowComments && canComment && (
            <div className="mt-3 space-y-2">
              {replyTo && (
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
                  <Reply size={12} />
                  <span>
                    Trả lời{" "}
                    <strong>{replyTo.author?.full_name || "người dùng"}</strong>
                  </span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="ml-auto text-blue-400 hover:text-blue-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder={replyTo ? "Viết câu trả lời..." : "Viết bình luận..."}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white focus:border-blue-200 transition-all placeholder:text-slate-300 resize-none"
                  />

                  {/* File previews */}
                  {newFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {newFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1 bg-blue-50 rounded px-2 py-1 text-xs">
                          {getFileIcon(f.name)}
                          <span className="truncate max-w-[100px]">{f.name}</span>
                          <button
                            onClick={() => setNewFiles((p) => p.filter((_, idx) => idx !== i))}
                            className="text-blue-400 hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 hover:text-blue-500 flex items-center gap-1 cursor-pointer">
                      <Paperclip size={12} /> Đính kèm
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          if (files.length > 0) {
                            setNewFiles((p) => [...p, ...files]);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <div className="flex-1" />
                    <Button
                      variant="primary"
                      className="text-xs py-1.5 px-3 gap-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                      onClick={handleSubmitComment}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Gửi
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!allowComments && (
            <div className="text-center text-xs text-slate-400 py-3 bg-slate-50 rounded-lg mt-2">
              🔒 Bình luận đã bị khóa cho bài đăng này.
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal (Lightbox) */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in cursor-zoom-out p-4 md:p-10"
          onClick={() => setLightboxUrl(null)}
        >
          <img 
            src={lightboxUrl} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
          <button 
            className="absolute top-4 right-4 text-white hover:text-red-400 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors cursor-pointer"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={24} />
          </button>
          <a
            href={lightboxUrl}
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
