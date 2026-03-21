// src/component/pages/common/stream/ClassStream.js
import React, { useState, useEffect, useCallback } from "react";
import { streamApi } from "service/streamApi";
import { socketService } from "service/socket";
import StreamPostForm from "./StreamPostForm";
import StreamPostCard from "./StreamPostCard";
import { Loader2, Newspaper } from "lucide-react";

export default function ClassStream({ classId }) {
  const [posts, setPosts] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [classInfo, setClassInfo] = useState(null);
  const [emptyState, setEmptyState] = useState(null);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPosts = useCallback(
    async (p = 1, append = false) => {
      if (p === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const res = await streamApi.getStreamPosts(classId, p, 10);
        if (res.ok) {
          const data = res.data?.data;
          if (append) {
            setPosts((prev) => [...prev, ...(data?.posts || [])]);
          } else {
            setPosts(data?.posts || []);
          }
          setPermissions(data?.permissions || {});
          setClassInfo(data?.class || null);
          setEmptyState(data?.empty_state || null);
          setPagination(data?.pagination || {});
          setPage(p);
        }
      } catch (err) {
        console.error("Fetch stream error:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [classId]
  );

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  // Socket real-time
  useEffect(() => {
    socketService.joinClassStream(classId);

    const handlePostCreated = (data) => {
      const newPost = data?.post || data;
      setPosts((prev) => {
        if (prev.some((p) => (p._id || p.id) === (newPost._id || newPost.id))) return prev;
        // Insert at top (after pinned posts)
        const pinned = prev.filter((p) => p.is_pinned);
        const unpinned = prev.filter((p) => !p.is_pinned);
        return [...pinned, newPost, ...unpinned];
      });
    };

    const handlePostUpdated = (data) => {
      const updated = data?.post || data;
      setPosts((prev) =>
        prev.map((p) =>
          (p._id || p.id) === (updated._id || updated.id) ? { ...p, ...updated } : p
        )
      );
    };

    const handlePostDeleted = (data) => {
      const postId = data?.post_id || data?.postId || data;
      setPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
    };

    const handlePostPinned = (data) => {
      const updated = data?.post || data;
      setPosts((prev) => {
        const updated_posts = prev.map((p) =>
          (p._id || p.id) === (updated._id || updated.id) ? { ...p, ...updated } : p
        );
        // Re-sort: pinned first
        const pinned = updated_posts.filter((p) => p.is_pinned);
        const unpinned = updated_posts.filter((p) => !p.is_pinned);
        return [...pinned, ...unpinned];
      });
    };

    const handleCommentPolicyUpdated = (data) => {
      const updated = data?.post || data;
      setPosts((prev) =>
        prev.map((p) =>
          (p._id || p.id) === (updated._id || updated.id) ? { ...p, ...updated } : p
        )
      );
    };

    const handleCommentCreated = (data) => {
      const postId = data?.post_id || data?.postId;
      if (postId) {
        setPosts((prev) =>
          prev.map((p) =>
            (p._id || p.id) === postId
              ? { ...p, comment_count: (p.comment_count || 0) + 1 }
              : p
          )
        );
      }
    };

    const handleCommentDeleted = (data) => {
      const postId = data?.post_id || data?.postId;
      const deletedCount = data?.deleted_comment_ids?.length || 1;
      if (postId) {
        setPosts((prev) =>
          prev.map((p) =>
            (p._id || p.id) === postId
              ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) - deletedCount) }
              : p
          )
        );
      }
    };

    socketService.on("stream:post_created", handlePostCreated);
    socketService.on("stream:post_updated", handlePostUpdated);
    socketService.on("stream:post_deleted", handlePostDeleted);
    socketService.on("stream:post_pinned", handlePostPinned);
    socketService.on("stream:post_comment_policy_updated", handleCommentPolicyUpdated);
    socketService.on("stream:comment_created", handleCommentCreated);
    socketService.on("stream:comment_updated", () => {});
    socketService.on("stream:comment_deleted", handleCommentDeleted);

    return () => {
      socketService.leaveClassStream(classId);
      socketService.off("stream:post_created", handlePostCreated);
      socketService.off("stream:post_updated", handlePostUpdated);
      socketService.off("stream:post_deleted", handlePostDeleted);
      socketService.off("stream:post_pinned", handlePostPinned);
      socketService.off("stream:post_comment_policy_updated", handleCommentPolicyUpdated);
      socketService.off("stream:comment_created", handleCommentCreated);
      socketService.off("stream:comment_deleted", handleCommentDeleted);
    };
  }, [classId]);

  const handlePostChanged = (type, data) => {
    if (type === "delete") {
      setPosts((prev) => prev.filter((p) => (p._id || p.id) !== data));
    } else if (type === "update") {
      setPosts((prev) => {
        const updated = prev.map((p) =>
          (p._id || p.id) === (data._id || data.id) ? { ...p, ...data } : p
        );
        // Re-sort pinned
        const pinned = updated.filter((p) => p.is_pinned);
        const unpinned = updated.filter((p) => !p.is_pinned);
        return [...pinned, ...unpinned];
      });
    }
  };

  const handleNewPostSuccess = () => {
    fetchPosts(1);
  };

  const isReadOnly = classInfo?.is_read_only === true;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-slate-100 rounded-2xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto animate-in fade-in duration-500">
      {/* Create Post Form */}
      {permissions.can_create_post && (
        <StreamPostForm
          classId={classId}
          onSuccess={handleNewPostSuccess}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          🔒 Lớp học đang ở chế độ chỉ đọc. Không thể tạo bài đăng mới.
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Newspaper size={32} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            {emptyState?.message || "Chưa có bài đăng nào"}
          </h3>
          <p className="text-sm text-slate-400 max-w-sm">
            {permissions.can_create_post
              ? "Hãy tạo bài đăng đầu tiên để khởi động bảng tin lớp học!"
              : "Bảng tin lớp học hiện đang trống."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <StreamPostCard
              key={post._id || post.id}
              post={post}
              classId={classId}
              onPostChanged={handlePostChanged}
              canComment={permissions.can_comment}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {pagination.has_next && (
        <div className="flex justify-center pt-2 pb-6">
          <button
            onClick={() => fetchPosts(page + 1, true)}
            disabled={isLoadingMore}
            className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Đang tải...
              </span>
            ) : (
              "Xem thêm bài đăng"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
