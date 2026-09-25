import { useContext } from "react";
import { UserContext } from "../../context/UserContext";
import BrandMark from "../BrandMark/BrandMark";

export default function Header() {
  const { logout } = useContext(UserContext);

  return (
    <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur border-b border-border">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-5 h-16 flex items-center justify-between">
        <BrandMark size={32} nameClass="text-lg" />
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-like px-3 py-1.5 rounded-lg hover:bg-black/[0.03]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Log out
        </button>
      </div>
    </header>
  );
}
