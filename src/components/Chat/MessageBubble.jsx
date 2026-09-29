import { useContext, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { getId } from "../../utils/api";

// The ⋮ menu on a message: React / Reply / Edit / Delete.
// NOTE: the realtime docs only document the *broadcast* events
// (`message_edited`, `message_deleted`) — the client→server emit names
// to trigger them aren't documented, so this assumes `editMessage` /
// `deleteMessage` / `reactMessage` as the emit names. If your backend
// uses different event names, this is the only place to change them.
export default function MessageBubble({ message, onReply, onEdit, onDelete, onReact }) {
  const { userData } = useContext(UserContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMine = (getId(message.from) || getId(message.sender) || message.senderId) === getId(userData);

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} group px-1`}>
      <div className={`flex items-end gap-1.5 max-w-[75%] ${isMine ? "flex-row-reverse" : ""}`}>
        <div
          className={`relative rounded-2xl px-3.5 py-2 text-sm ${
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

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="opacity-0 group-hover:opacity-100 text-ink-faint px-1.5 py-1 rounded hover:bg-black/[0.05] text-xs"
          >
            ⋮
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className={`absolute z-10 top-6 bg-panel border border-border rounded-xl shadow-lg py-1 min-w-[120px] ${
              isMine ? "right-0" : "left-0"
              }`}            >
              <button
                onClick={() => { onReact?.(message, "❤️"); setMenuOpen(false); }}
                className="w-full text-left text-sm px-3.5 py-2 hover:bg-black/[0.03]"
              >
                React ❤️
              </button>
              <button
                onClick={() => { onReply?.(message); setMenuOpen(false); }}
                className="w-full text-left text-sm px-3.5 py-2 hover:bg-black/[0.03]"
              >
                Reply
              </button>
              {isMine && (
                <>
                  <button
                    onClick={() => { onEdit?.(message); setMenuOpen(false); }}
                    className="w-full text-left text-sm px-3.5 py-2 hover:bg-black/[0.03]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { onDelete?.(message); setMenuOpen(false); }}
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
