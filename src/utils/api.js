// The backend wraps paginated lists as { message, status, data: { docs, currentPage, pageSize, pages } }.
// This pulls the array out no matter which of the shapes we've seen shows up.
export function extractList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.docs)) return payload.docs;
  if (Array.isArray(payload.data?.docs)) return payload.data.docs;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

// Same idea for a single-object payload, e.g. { data: { ...user } } vs { data }.
export function extractItem(payload) {
  return payload?.data ?? payload ?? null;
}


// Different models on this backend expose the Mongo id differently — some
// keep `_id`, the Notification model only exposes `id`. Use this instead of
// reaching for `.{_id}` directly on anything that came from the API.
export function getId(obj) {
  return obj?._id ?? obj?.id ?? null;
}