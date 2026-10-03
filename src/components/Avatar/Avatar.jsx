import { useState } from "react";
import { fileUrl } from "../../services/fileService";
import { initials } from "../../utils/constants";

// Pass any user-like object (has .username and/or .profilePicture / .profileImage).
// `size` is in pixels, `textSize` is a Tailwind class for the initials.
export default function Avatar({ user, size = 40, textSize = "text-sm", className = "" }) {
  const picture = user?.profilePicture ?? user?.profileImage ?? null;
  const src = picture ? fileUrl(picture) : null;
  const [imgError, setImgError] = useState(false);
  const style = { width: size, height: size };

  const displayName =
    user?.username ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "";

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={displayName || "avatar"}
        style={style}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center font-semibold flex-shrink-0 ${textSize} ${className}`}
    >
      {initials(displayName)}
    </div>
  );
}
