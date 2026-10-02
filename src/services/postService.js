import apiClient from "./apiClient";

// POST /post  (FormData: content, attachments...)
export function createPost(formData) {
  return apiClient.post("/post", formData);
}

// PATCH /post/:id
export function updatePost(id, values) {
  return apiClient.patch(`/post/${id}`, values);
}

// GET /post/:id
export function getPost(id) {
  return apiClient.get(`/post/${id}`);
}

// GET /post  (feed / post list)
export function getPosts(params) {
  return apiClient.get("/post", { params });
}

// GET /post/feed (own, followed, and accepted-friend posts for the home feed)
export function getFeed(params) {
  return apiClient.get("/post/feed", { params });
}

// PATCH /post/:id/react?react=<reactionType>
export function reactToPost(id, react) {
  return apiClient.patch(`/post/${id}/react`, null, { params: { react } });
}

// DELETE /post/:id  (soft delete)
export function deletePost(id) {
  return apiClient.delete(`/post/${id}`);
}

// PATCH /post/restore/:id
export function restorePost(id) {
  return apiClient.patch(`/post/restore/${id}`);
}

// DELETE /post/destroy/:id  (hard delete)
export function destroyPost(id) {
  return apiClient.delete(`/post/destroy/${id}`);
}
