import apiClient from "./apiClient";

// POST /post/:postId/comment
export function createComment(postId, values) {
  return apiClient.post(`/post/${postId}/comment`, values);
}

// PATCH /post/:postId/comment/:commentId
export function updateComment(postId, commentId, values) {
  return apiClient.patch(`/post/${postId}/comment/${commentId}`, values);
}

// GET /post/:postId/comment/:commentId
export function getComment(postId, commentId) {
  return apiClient.get(`/post/${postId}/comment/${commentId}`);
}

// POST /post/:postId/comment/:commentId/reply
export function replyToComment(postId, commentId, values) {
  return apiClient.post(`/post/${postId}/comment/${commentId}/reply`, values);
}

// PATCH /post/:postId/comment/:commentId/react?react=
export function reactToComment(postId, commentId, react) {
  return apiClient.patch(`/post/${postId}/comment/${commentId}/react`, null, {
    params: { react },
  });
}

// PATCH /post/:postId/comment/:commentId/reply/:replyId/react?react=
export function reactToReply(postId, commentId, replyId, react) {
  return apiClient.patch(
    `/post/${postId}/comment/${commentId}/reply/${replyId}/react`,
    null,
    { params: { react } }
  );
}

// DELETE /post/:postId/comment/:commentId
export function deleteComment(postId, commentId) {
  return apiClient.delete(`/post/${postId}/comment/${commentId}`);
}

// PATCH /post/:postId/comment/:commentId/restore
export function restoreComment(postId, commentId) {
  return apiClient.patch(`/post/${postId}/comment/${commentId}/restore`);
}

// DELETE /post/:postId/comment/:commentId/destroy
export function destroyComment(postId, commentId) {
  return apiClient.delete(`/post/${postId}/comment/${commentId}/destroy`);
}
