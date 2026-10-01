import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { searchUsers } from "../../services/userService";
import { createGroup } from "../../services/chatService";
import { initials } from "../../utils/constants";
import { extractList, getId } from "../../utils/api";
import Avatar from "../Avatar/Avatar";

export default function NewGroupModal({ onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(null);
  const [iconPreview, setIconPreview] = useState("");
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!icon) return setIconPreview("");
    const previewUrl = URL.createObjectURL(icon);
    setIconPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [icon]);

  async function runSearch(value) {
    setTerm(value);
    if (!value.trim()) return setResults([]);
    const { data } = await searchUsers(value);
    setResults(extractList(data));
  }

  function togglePick(user) {
    setPicked((p) =>
      p.some((u) => getId(u) === getId(user)) ? p.filter((u) => getId(u) !== getId(user)) : [...p, user]
    );
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const body = new FormData();
      body.append("groupName", name.trim());
      body.append("groupDescription", description.trim());
      body.append("participantsIds", JSON.stringify(picked.map((u) => getId(u))));
      if (icon) body.append("attachment", icon);
      return createGroup(body);
    },
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

        <label className="block text-sm font-medium mb-3">Group photo
          <div className="flex items-center gap-3 mt-1.5">
            {iconPreview ? <img src={iconPreview} alt="Group icon preview" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center font-semibold">{initials(name || "Group")}</div>}
            <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={(e) => setIcon(e.target.files?.[0] || null)} className="min-w-0 text-sm" />
          </div>
        </label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Group description (optional)"
          maxLength={500}
          rows={2}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              <span key={getId(u)} className="inline-flex items-center gap-1.5 bg-primary-soft text-primary text-xs font-semibold pl-1 pr-2.5 py-1 rounded-full">
                <Avatar user={u} size={22} textSize="text-[9px]" />
                {u.username || [u.firstName, u.lastName].filter(Boolean).join(" ")} ✕
              </span>
            ))}
          </div>
        )}

        <div className="max-h-44 overflow-y-auto divide-y divide-border mb-4">
          {results.map((u) => (
            <button
              key={getId(u)}
              onClick={() => togglePick(u)}
              className="w-full flex items-center gap-2.5 py-2 text-left"
            >
              <Avatar user={u} size={32} textSize="text-[11px]" />
              <span className="text-sm font-medium">{u.username || [u.firstName, u.lastName].filter(Boolean).join(" ")}</span>
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
