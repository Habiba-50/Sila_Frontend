import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import useUnreadCount from "../../Hooks/useUnreadCount";
import { initials } from "../../utils/constants";

const links = [
  { to: "/", label: "Home", icon: "M3 11.5 12 4l9 7.5M5 10v9h5v-6h4v6h5v-9" },
  { to: "/search", label: "Search", icon: "" }, // custom icon below
  { to: "/notifications", label: "Notifications", icon: "" },
  { to: "/chats", label: "Messages", icon: "" },
  { to: "/bookmarks", label: "Bookmarks", icon: "" },
  { to: "/profile", label: "Profile", icon: "" },
];

function NavIcon({ label }) {
  switch (label) {
    case "Home":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v9h5v-6h4v6h5v-9" />
        </svg>
      );
    case "Search":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "Notifications":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    case "Messages":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.5 8.5 0 0 1-11.8 7.8L4 21l1.8-5A8.5 8.5 0 1 1 21 11.5Z" />
        </svg>
      );
    case "Bookmarks":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 3h12v18l-6-4-6 4Z" />
        </svg>
      );
    case "Profile":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Navbar() {
  const { userData, token } = useContext(UserContext);
  const { data: unread } = useUnreadCount(!!token);

  return (
    <aside className="lg:sticky lg:top-[88px] h-fit">
      <nav className="flex lg:flex-col justify-between lg:justify-start gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-[10px] text-[15px] font-medium ${
                isActive ? "bg-primary-soft text-primary font-semibold" : "text-ink-soft hover:bg-black/[0.03]"
              }`
            }
          >
            <NavIcon label={l.label} />
            <span className="hidden lg:inline">{l.label}</span>
            {l.label === "Notifications" && unread?.count > 0 && (
              <span className="absolute top-1 left-6 lg:static lg:ml-auto bg-like text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center">
                {unread?.count > 99 ? "99+" : unread?.count}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {userData && (
        <NavLink
          to="/profile"
          className="hidden lg:flex items-center gap-2.5 mt-5 pt-4 border-t border-border px-3"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {initials(userData.username)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{userData.username}</p>
            <p className="text-xs text-ink-faint">View profile</p>
          </div>
        </NavLink>
      )}
    </aside>
  );
}
