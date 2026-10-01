import apiClient from "./apiClient";

// GET /user
export function getProfile() {
  return apiClient.get("/user");
}

// PATCH /user/update
export function updateProfile(values) {
  return apiClient.patch("/user/update", values);
}

// PATCH /user/profile-image  (multipart field: image)
export function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  return apiClient.patch("/user/profile-image", formData);
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

// PATCH /user/cover-images  (multipart field: attachments; max 2 files)
export function uploadCoverImages(files) {
  const formData = new FormData();
  files.slice(0, 2).forEach((file) => formData.append("attachments", file));
  return apiClient.patch("/user/cover-images", formData);
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
