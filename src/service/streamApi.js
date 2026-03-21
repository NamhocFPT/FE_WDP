// src/service/streamApi.js
import { api } from "./api";

export const streamApi = {
  // ───── Posts ─────
  getStreamPosts(classId, page = 1, limit = 10) {
    return api.get(`/classes/${classId}/stream?page=${page}&limit=${limit}`);
  },

  getPostDetail(classId, postId) {
    return api.get(`/classes/${classId}/stream/posts/${postId}`);
  },

  createPost(classId, formData) {
    return api.post(`/classes/${classId}/stream/posts`, formData);
  },

  updatePost(classId, postId, formData) {
    return api.patch(`/classes/${classId}/stream/posts/${postId}`, formData);
  },

  deletePost(classId, postId) {
    return api.delete(`/classes/${classId}/stream/posts/${postId}`);
  },

  pinPost(classId, postId, isPinned) {
    return api.patch(`/classes/${classId}/stream/posts/${postId}/pin`, {
      is_pinned: isPinned,
    });
  },

  updateCommentPolicy(classId, postId, allowComments) {
    return api.patch(
      `/classes/${classId}/stream/posts/${postId}/comment-policy`,
      { allow_comments: allowComments }
    );
  },

  // ───── Comments ─────
  getComments(classId, postId, page = 1, limit = 20) {
    return api.get(
      `/classes/${classId}/stream/posts/${postId}/comments?page=${page}&limit=${limit}`
    );
  },

  createComment(classId, postId, formData) {
    return api.post(
      `/classes/${classId}/stream/posts/${postId}/comments`,
      formData
    );
  },

  updateComment(classId, commentId, formData) {
    return api.patch(
      `/classes/${classId}/stream/comments/${commentId}`,
      formData
    );
  },

  deleteComment(classId, commentId) {
    return api.delete(`/classes/${classId}/stream/comments/${commentId}`);
  },
};
