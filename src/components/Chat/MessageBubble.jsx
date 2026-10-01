import { useContext, useMemo, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { getId } from "../../utils/api";

const REACTIONS = [
  { value: 1, emoji: "👍", label: "Like" },
  { value: 2, emoji: "❤️", label: "Love" },
  { value: 3, emoji: "😂", label: "Laugh" },
  { value: 4, emoji: "😮", label: "Wow" },
  { value: 5, emoji: "😢", label: "Sad" },
  { value: 6, emoji: "😡", label: "Angry" },
];

export default function MessageBubble({ message, onReply, onEdit, onDelete, onReact }) {
  const { userData } = useContext(UserContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const meId = String(getId(userData) ?? "");
  const isMine = String(
    getId(message.from) ||
    getId(message.sender) ||
    getId(message.senderId) ||
    getId(message.createdBy) ||
    ""
  ) === meId;

  const { reactionCounts, myReaction } = useMemo(() => {
    const counts = new Map();
    let mine = null;
    for (const item of message.likes ?? []) {
      const value = Number(item.react);
      if (!REACTIONS.some((reaction) => reaction.value === value)) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
      const userId = item.userId;
      const reactionUserId = typeof userId === "string"
        ? userId
        : String(userId?._id ?? userId?.toHexString?.() ?? userId?.id ?? "");
      if (reactionUserId === meId) mine = value;
    }
    return {
      reactionCounts: REACTIONS.filter((reaction) => counts.has(reaction.value)).map((reaction) => ({
        ...reaction,
        count: counts.get(reaction.value),
      })),
      myReaction: mine,
    };
  }, [message.likes, meId]);

  function chooseReaction(value) {
    onReact?.(message, myReaction === value ? 0 : value);
    setPickerOpen(false);
    setMenuOpen(false);
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} group px-1`}>
      <div className={`flex items-end gap-1.5 max-w-[85%] min-w-0 ${isMine ? "flex-row-reverse" : ""}`}>
        <div className="flex flex-col min-w-0 max-w-full">
          <div
            className={`rounded-2xl px-3.5 py-2 text-sm break-words ${
              isMine ? "bg-primary text-white rounded-br-sm" : "bg-black/[0.04] text-ink rounded-bl-sm"
            }`}
          >
            {message.replyTo && (
              <p className={`text-xs mb-1 pb-1 border-b ${isMine ? "border-white/25 text-white/75" : "border-black/10 text-ink-faint"}`}>
                ↩ {message.replyTo}
              </p>
            )}
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {message.edited && (
              <span className={`text-[10px] block mt-0.5 ${isMine ? "text-white/60" : "text-ink-faint"}`}>edited</span>
            )}
          </div>

          {reactionCounts.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
              {reactionCounts.map(({ value, emoji, label, count }) => {
                const selectedByMe = myReaction === value;
                return (
                  <button
                    key={value}
                    type="button"
                    title={`${label}: ${count}`}
                    aria-label={`${label}, ${count} ${count === 1 ? "reaction" : "reactions"}${selectedByMe ? ", selected by you" : ""}`}
                    onClick={() => chooseReaction(value)}
                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs shadow-sm transition ${
                      selectedByMe
                        ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                        : "border-border bg-panel hover:bg-black/[0.03]"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="text-ink-soft">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative flex-shrink-0">
          <button
            type="button"
            aria-label="Message actions"
            aria-expanded={menuOpen}
            onClick={() => { setMenuOpen((open) => !open); setPickerOpen(false); }}
            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 text-ink-faint px-1.5 py-1 rounded hover:bg-black/[0.05] text-xs"
          >
            ⋮
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => { setMenuOpen(false); setPickerOpen(false); }}
              className={`absolute z-20 top-6 w-[280px] max-w-[calc(100vw-2rem)] bg-panel border border-border rounded-xl shadow-lg py-1 ${isMine ? "right-0" : "left-0"}`}
            >
              <button
                type="button"
                aria-expanded={pickerOpen}
                onClick={() => setPickerOpen((open) => !open)}
                className="w-full text-left text-sm px-3.5 py-2 hover:bg-black/[0.03]"
              >
                React {myReaction ? REACTIONS.find((reaction) => reaction.value === myReaction)?.emoji : "…"}
              </button>
              {pickerOpen && (
                <div className="grid grid-cols-6 gap-1 px-2 pb-2" aria-label="Choose a reaction">
                  {REACTIONS.map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      type="button"
                      title={label}
                      aria-label={label}
                      onClick={() => chooseReaction(value)}
                      className={`flex items-center justify-center rounded-lg p-1.5 text-lg transition hover:bg-black/[0.06] hover:scale-110 ${myReaction === value ? "bg-primary/10" : ""}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => { onReply?.(message); setMenuOpen(false); setPickerOpen(false); }}
                className="w-full text-left text-sm px-3.5 py-2 hover:bg-black/[0.03]"
              >
                Reply
              </button>
              {isMine && (
                <>
                  <button
                    type="button"
                    onClick={() => { onEdit?.(message); setMenuOpen(false); setPickerOpen(false); }}
                    className="w-full text-left text-sm px-3.5 py-2 hover:bg-black/[0.03]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => { onDelete?.(message); setMenuOpen(false); setPickerOpen(false); }}
                    className="w-full text-left text-sm px-3.5 py-2 hover:bg-black/[0.03] text-like"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
