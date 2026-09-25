import apiClient from "./apiClient";

// POST /follow/:userId
export function followUser(userId) {
  return apiClient.post(`/follow/${userId}`);
}

// DELETE /follow/:userId
export function unfollowUser(userId) {
  return apiClient.delete(`/follow/${userId}`);
}

// GET /follow/following?page=&size=
export function getFollowing(params) {
  return apiClient.get("/follow/following", { params });
}

// GET /follow/followers
export function getFollowers(params) {
  return apiClient.get("/follow/followers", { params });
}

// GET /follow/status/:followingId — am I following this user?
export function getFollowStatus(followingId) {
  return apiClient.get(`/follow/status/${followingId}`);
}
