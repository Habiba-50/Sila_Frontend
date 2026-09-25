import apiClient from "./apiClient";

// GET /user
export function getProfile() {
  return apiClient.get("/user");
}

// PATCH /user/update
export function updateProfile(values) {
  return apiClient.patch("/user/update", values);
}

// POST /user/logout  { flag }
export function logout(flag = 0) {
  return apiClient.post("/user/logout", { flag });
}

// PATCH /user/profile-image-URL  { ContentType, Originalname } -> returns a pre-signed S3 URL + key
export function getProfileImageUploadUrl(values) {
  return apiClient.patch("/user/profile-image-URL", values);
}

// PATCH /user/profile-image/confirm  { key } -> tells the backend the S3 upload finished
export function confirmProfileImage(key) {
  return apiClient.patch("/user/profile-image/confirm", { key });
}

// PATCH /user/cover-images  (same pre-signed-URL flow as the profile image)
export function getCoverImageUploadUrl(values) {
  return apiClient.patch("/user/cover-images", values);
}

// DELETE /user/
export function deleteAccount(values) {
  return apiClient.delete("/user/", { data: values });
}

// PATCH /user/restore
export function restoreAccount(values) {
  return apiClient.patch("/user/restore", values);
}

// GET /user/searchUser?search=
export function searchUsers(search) {
  return apiClient.get("/user/searchUser", { params: { search } });
}

// GET /user/:userId — another user's public profile
export function getUserById(userId) {
  return apiClient.get(`/user/${userId}`);
}
