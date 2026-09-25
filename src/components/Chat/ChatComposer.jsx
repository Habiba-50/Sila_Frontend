import { useState } from "react";

export default function ChatComposer({ onSend, replyingTo, onCancelReply, editingMessage, onCancelEdit, onSubmitEdit }) {
  const [text, setText] = useState("");

  function handleSubmit() {
    if (!text.trim()) return;
    if (editingMessage) {
      onSubmitEdit(text);
    } else {
      onSend(text);
    }
    setText("");
  }

  return (
    <div className="border-t border-border pt-3">
      {replyingTo && (
        <div className="flex items-center justify-between bg-black/[0.03] rounded-lg px-3 py-1.5 mb-2 text-xs text-ink-soft">
          <span className="truncate">↩ Replying to: {replyingTo.content}</span>
          <button onClick={onCancelReply} className="text-ink-faint ml-2">✕</button>
        </div>
      )}
      {editingMessage && (
        <div className="flex items-center justify-between bg-gold/10 rounded-lg px-3 py-1.5 mb-2 text-xs text-gold font-medium">
          <span>Editing message</span>
          <button onClick={onCancelEdit} className="ml-2">✕</button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={editingMessage ? "Edit your message…" : "Type a message…"}
          className="flex-1 border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="bg-primary text-white text-sm font-semibold rounded-full px-5 disabled:opacity-50"
        >
          {editingMessage ? "Save" : "Send"}
        </button>
      </div>
    </div>
  );
}
