import { BASE_URL } from "./apiClient";

export const getImageUrl = (filePath) => {
  if (!filePath) return "";
  if (typeof filePath === "object") {
    const raw =
      filePath.secure_url ||
      filePath.url ||
      filePath.path ||
      filePath.link ||
      filePath.file ||
      filePath.key ||
      filePath.src ||
      filePath.imageUrl ||
      filePath.location ||
      filePath.uri;
    if (raw) return getImageUrl(raw);
    return "";
  }
  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("blob:") ||
    filePath.startsWith("data:")
  ) {
    return filePath;
  }

  // Prefix with /uploads/ if missing
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  const pathWithUploads = cleanPath.startsWith("uploads/") ? cleanPath : `uploads/${cleanPath}`;

  return `${BASE_URL}/${pathWithUploads}`;
};

export const getMediaUrl = getImageUrl;

export function extractPostImages(post) {
  if (!post) return [];
  const candidates = [
    post.attachments,
    post.attachment,
    post.images,
    post.image,
    post.media,
    post.photos,
    post.photo,
    post.files,
    post.file,
    post.secure_url,
    post.imageUrl,
    post.picture,
    post.img,
  ];

  const list = [];
  for (const item of candidates) {
    if (!item) continue;
    if (Array.isArray(item)) {
      list.push(...item);
    } else if (typeof item === "object") {
      if (Array.isArray(item.docs)) {
        list.push(...item.docs);
      } else if (Array.isArray(item.files)) {
        list.push(...item.files);
      } else if (Array.isArray(item.images)) {
        list.push(...item.images);
      } else {
        list.push(item);
      }
    } else if (typeof item === "string" && item.trim()) {
      list.push(item);
    }
  }

  return list.map(getMediaUrl).filter(Boolean);
}

// Stream a stored file from S3 through the backend, e.g. attachments/avatars
// that come back from the API as a relative key rather than a full URL.
export function fileUrl(path, { download = false, filename } = {}) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path; // already a full URL
  const clean = path.replace(/^\/+/, "");
  const params = new URLSearchParams();
  if (download) params.set("download", "true");
  if (filename) params.set("filename", filename);
  const query = params.toString();
  return `${BASE_URL}/uploads/${clean}${query ? `?${query}` : ""}`;
}
