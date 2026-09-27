import apiClient from "./apiClient";

// GET /notification?page=&limit=
export function getNotifications(params) {
  return apiClient.get("/notification/unread", { params });
}

// GET /notification/:id
export function getNotification(id) {
  return apiClient.get(`/notification/${id}`);
}

// GET /notification/unread/count
export function getUnreadCount() {
  return apiClient.get("/notification/unread/count");
}

// GET /notification/unread?page=&size=
export function getUnreadNotifications(params) {
  return apiClient.get("/notification/unread", { params });
}

// PATCH /notification/mark-all-as-read
export function markAllAsRead() {
  return apiClient.patch("/notification/mark-all-as-read");
}

// DELETE /notification/:id
export function deleteNotification(id) {
  return apiClient.delete(`/notification/${id}`);
}

// DELETE /notification/
export function deleteAllNotifications() {
  return apiClient.delete("/notification/");
}

// PATCH /notification/restore-all
export function restoreAllNotifications() {
  return apiClient.patch("/notification/restore-all");
}

// PATCH /notification/restore/:id
export function restoreNotification(id) {
  return apiClient.patch(`/notification/restore/${id}`);
}
