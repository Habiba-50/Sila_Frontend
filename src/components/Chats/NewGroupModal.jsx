import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { searchUsers } from "../../services/userService";
import { createGroup } from "../../services/chatService";
import { initials } from "../../utils/constants";

export default function NewGroupModal({ onClose }) {
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState([]);
  const queryClient = useQueryClient();

  async function runSearch(value) {
    setTerm(value);
    if (!value.trim()) return setResults([]);
    const { data } = await searchUsers(value);
    setResults(data?.data ?? data?.users ?? []);
  }

  function togglePick(user) {
    setPicked((p) =>
      p.some((u) => u._id === user._id) ? p.filter((u) => u._id !== user._id) : [...p, user]
    );
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () => createGroup({ name, members: picked.map((u) => u._id) }),
    onSuccess: () => {
      toast.success("Group created");
      queryClient.invalidateQueries({ queryKey: ["my-chats"] });
      onClose();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Couldn't create the group."),
  });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-panel rounded-2xl p-5 w-full max-w-md border border-border"
      >
        <h2 className="font-display text-lg font-semibold mb-4">New group</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <input
          value={term}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Add people…"
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        {picked.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {picked.map((u) => (
              <span key={u._id} className="bg-primary-soft text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                {u.username} ✕
              </span>
            ))}
          </div>
        )}

        <div className="max-h-44 overflow-y-auto divide-y divide-border mb-4">
          {results.map((u) => (
            <button
              key={u._id}
              onClick={() => togglePick(u)}
              className="w-full flex items-center gap-2.5 py-2 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ink-faint to-border text-white flex items-center justify-center text-[11px] font-semibold">
                {initials(u.username)}
              </div>
              <span className="text-sm font-medium">{u.username}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm font-medium text-ink-soft px-4 py-2">Cancel</button>
          <button
            disabled={!name.trim() || picked.length === 0 || isPending}
            onClick={() => mutate()}
            className="bg-primary text-white text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {isPending ? "Creating…" : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}
