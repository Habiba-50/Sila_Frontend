import { fileUrl } from "../../services/fileService";
import { initials } from "../../utils/constants";

// Pass any user-like object (has .username and/or .profilePicture).
// `size` is in pixels, `textSize` is a Tailwind class for the initials.
export default function Avatar({ user, size = 40, textSize = "text-sm", className = "" }) {
  const picture = user?.profilePicture;
  const style = { width: size, height: size };

  if (picture) {
    return (
      <img
        src={fileUrl(picture)}
        alt=""
        style={style}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center font-semibold flex-shrink-0 ${textSize} ${className}`}
    >
      {initials(user?.username)}
    </div>
  );
}