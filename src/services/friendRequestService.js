import apiClient from "./apiClient";

// POST /friend-request/:userId
export function sendFriendRequest(userId) {
  return apiClient.post(`/friend-request/${userId}`);
}

// PATCH /friend-request/:requestId/accept
export function acceptFriendRequest(requestId) {
  return apiClient.patch(`/friend-request/${requestId}/accept`);
}

// PATCH /friend-request/:requestId/reject
export function rejectFriendRequest(requestId) {
  return apiClient.patch(`/friend-request/${requestId}/reject`);
}

// PATCH /friend-request/:requestId/cancel
export function cancelFriendRequest(requestId) {
  return apiClient.patch(`/friend-request/${requestId}/cancel`);
}

// GET /friend-request/:userId/status
export function checkFriendRequestStatus(userId) {
  return apiClient.get(`/friend-request/${userId}/status`);
}

// GET /friend-request/requests-sent?page=&size=
export function getRequestsSent(params) {
  return apiClient.get("/friend-request/requests-sent", { params });
}

// GET /friend-request/requests-received?page=&size=
export function getRequestsReceived(params) {
  return apiClient.get("/friend-request/requests-received", { params });
}

// GET /friend-request/my-friends?page=&size=
export function getMyFriends(params) {
  return apiClient.get("/friend-request/my-friends", { params });
}

// PATCH /friend-request/:requestId/unfriend
export function unfriend(requestId) {
  return apiClient.patch(`/friend-request/${requestId}/unfriend`);
}
