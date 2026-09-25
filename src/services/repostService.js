import apiClient from "./apiClient";

// POST /repost/:postId  { content? }
export function sharePost(postId, content) {
  return apiClient.post(`/repost/${postId}`, content ? { content } : {});
}

// DELETE /repost/:repostId
export function deleteRepost(repostId) {
  return apiClient.delete(`/repost/${repostId}`);
}

// GET /repost/:postId  (reposts of a specific post)
export function getRepostsOfPost(postId) {
  return apiClient.get(`/repost/${postId}`);
}

// GET /repost/my-reposts
export function getMyReposts() {
  return apiClient.get("/repost/my-reposts");
}
