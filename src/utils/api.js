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