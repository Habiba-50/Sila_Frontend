// Reaction values assumed from the Postman collection (react=1 to 6).
export const REACTIONS = [
  { value: 1, key: "like", emoji: "👍", label: "Like", color: "text-blue-500" },
  { value: 2, key: "love", emoji: "❤️", label: "Love", color: "text-red-500" },
  { value: 3, key: "haha", emoji: "😂", label: "Haha", color: "text-amber-500" },
  { value: 4, key: "wow", emoji: "😮", label: "Wow", color: "text-amber-500" },
  { value: 5, key: "sad", emoji: "😢", label: "Sad", color: "text-amber-500" },
  { value: 6, key: "angry", emoji: "😡", label: "Angry", color: "text-orange-600" },
];

export function getReaction(value) {
  if (value === undefined || value === null || value === "") return null;
  return (
    REACTIONS.find(
      (r) =>
        r.value === Number(value) ||
        r.value === value ||
        r.key === String(value).toLowerCase() ||
        r.label.toLowerCase() === String(value).toLowerCase() ||
        r.emoji === value
    ) || null
  );
}

// Gender assumed numeric enum from the signup body ("gender": 1).
export const GENDERS = [
  { value: 0, label: "Male" },
  { value: 1, label: "Female" },
];

export function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// The backend's Notification model has no `type` field — it just sends a
// ready-made `text` string (e.g. "New login from new device"). We only
// pick an icon by matching keywords in that text, best-effort.
const ICON_RULES = [
  [/login/i, "🔐"],
  [/friend request/i, "🤝"],
  [/friend/i, "🤝"],
  [/follow/i, "➕"],
  [/repl/i, "↩️"],
  [/comment/i, "💬"],
  [/react|like/i, "❤️"],
  [/repost|shared/i, "⤴️"],
  [/group/i, "👥"],
  [/tag|mention/i, "@"],
];

export function describeNotification(n) {
  const text = n?.text || n?.message || n?.content || "New activity";
  const rule = ICON_RULES.find(([pattern]) => pattern.test(text));
  return { icon: rule?.[1] || "🔔", text };
}

export function ensureArray(payload, preferredKeys = []) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const keysToCheck = [
    ...preferredKeys,
    "docs",
    "results",
    "items",
    "users",
    "posts",
    "requests",
    "notifications",
    "chats",
    "bookmarks",
    "followers",
    "following",
    "blocked",
    "data",
    "list",
  ];

  // 1. Direct key on payload
  for (const key of keysToCheck) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  // 2. Direct key inside payload.data
  if (payload.data && typeof payload.data === "object") {
    if (Array.isArray(payload.data)) return payload.data;
    for (const key of keysToCheck) {
      if (Array.isArray(payload.data[key])) return payload.data[key];
    }
  }

  return [];
}
