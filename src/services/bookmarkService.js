import apiClient from "./apiClient";

// POST /bookmark/:postId
export function savePost(postId) {
  return apiClient.post(`/bookmark/${postId}`);
}

// PATCH /bookmark/:postId
export function unsavePost(postId) {
  return apiClient.patch(`/bookmark/${postId}`);
}

// GET /bookmark/
export function getMySavedPosts() {
  return apiClient.get("/bookmark/");
}

// GET /bookmark/:postId
export function isPostSaved(postId) {
  return apiClient.get(`/bookmark/${postId}`);
}
