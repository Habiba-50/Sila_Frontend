import { useState, useEffect, useRef } from "react";
import { REACTIONS, getReaction } from "../../utils/constants";

// Shared like/react control used on posts, comments, and replies.
// `myReaction` is the reaction value (1-6) the current user already picked, or falsy.
export default function ReactionButton({ count = 0, myReaction, onReact, mobileCompact = false }) {
  const [open, setOpen] = useState(false);
  const [localReaction, setLocalReaction] = useState(myReaction);
  const timerRef = useRef(null);

  useEffect(() => {
    setLocalReaction(myReaction);
  }, [myReaction]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const activeReactionValue = localReaction !== undefined ? localReaction : myReaction;
  const active = activeReactionValue ? getReaction(activeReactionValue) : null;

  function handleMouseEnter() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(true);
  }

  function handleMouseLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setOpen(false);
    }, 450);
  }

  function handleSelect(val) {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (active?.value === val) {
      setLocalReaction(null);
      onReact(val);
    } else {
      setLocalReaction(val);
      onReact(val);
    }
    setOpen(false);
  }

  function handleMainButtonClick() {
    if (active) {
      setLocalReaction(null);
      onReact(active.value);
    } else {
      setLocalReaction(1);
      onReact(1);
    }
  }

  return (
    <div
      className={`relative inline-block ${mobileCompact ? "w-full sm:w-auto" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleMainButtonClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13.5px] font-medium transition-colors hover:bg-black/[0.04] ${mobileCompact ? "w-full flex-col justify-center gap-1 px-1 text-xs whitespace-nowrap sm:w-auto sm:flex-row sm:gap-1.5 sm:px-3 sm:text-[13.5px]" : ""} ${
          active ? `${active.color || "text-primary"} font-semibold` : "text-ink-faint"
        }`}
      >
        <span className="text-base leading-none">{active ? active.emoji : "🤍"}</span>
        <span>{active ? active.label : "React"}</span>
        {count > 0 && <span className="text-ink-faint font-normal">· {count}</span>}
      </button>

      {open && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute bottom-full left-0 pb-2 z-30"
        >
          <div className="bg-panel border border-border rounded-full px-2 py-1.5 flex gap-1 shadow-xl">
            {REACTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(r.value);
                }}
                title={r.label}
                className={`text-xl p-1.5 rounded-full hover:bg-black/[0.06] hover:scale-125 transition-transform ${
                  active?.value === r.value ? "bg-primary-soft scale-110" : ""
                }`}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
