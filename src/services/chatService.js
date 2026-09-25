import apiClient from "./apiClient";

// POST /chat/group  { name, members: [] }
export function createGroup(values) {
  return apiClient.post("/chat/group", values);
}

// GET /user/chat/group/:groupId
export function getGroup(groupId) {
  return apiClient.get(`/user/chat/group/${groupId}`);
}

// GET /user/chat/my-chats?page=&size=
export function getMyChats(params) {
  return apiClient.get("/user/chat/my-chats", { params });
}

// PATCH /user/chat/group/:groupId/add-member  { members: [] }
export function addGroupMember(groupId, members) {
  return apiClient.patch(`/user/chat/group/${groupId}/add-member`, { members });
}

// PATCH /user/chat/group/:groupId/remove-member/:memberId
export function removeGroupMember(groupId, memberId) {
  return apiClient.patch(`/user/chat/group/${groupId}/remove-member/${memberId}`);
}

// PATCH /user/chat/group/:groupId/leave
export function leaveGroup(groupId) {
  return apiClient.patch(`/user/chat/group/${groupId}/leave`);
}

// PATCH /user/chat/group/:groupId/delete
export function deleteGroup(groupId) {
  return apiClient.patch(`/user/chat/group/${groupId}/delete`);
}

// GET /user/:userId/chat — one-to-one conversation history with a user
export function getDirectChat(userId) {
  return apiClient.get(`/user/${userId}/chat`);
}

// PATCH /user/chat/group/:groupId/update  { groupName }
export function updateGroup(groupId, values) {
  return apiClient.patch(`/user/chat/group/${groupId}/update`, values);
}
