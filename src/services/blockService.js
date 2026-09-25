import apiClient from "./apiClient";

// POST /block/:userId
export function blockUser(userId) {
  return apiClient.post(`/block/${userId}`);
}

// PATCH /block/:userId
export function unblockUser(userId) {
  return apiClient.patch(`/block/${userId}`);
}

// GET /block/
export function getBlockedUsers() {
  return apiClient.get("/block/");
}

// GET /block/:userId
export function isBlocked(userId) {
  return apiClient.get(`/block/${userId}`);
}
