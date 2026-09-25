import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import useMyChats from "../../Hooks/useMyChats";
import { UserContext } from "../../context/UserContext";
import Loader from "../Loader/Loader";
import NewGroupModal from "./NewGroupModal";
import { initials, ensureArray } from "../../utils/constants";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function Chats() {
  const { userData } = useContext(UserContext);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const { data, isLoading } = useMyChats({ page: 1, size: 20 });
  const chats = ensureArray(data, ["chats", "docs"]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-[21px] font-semibold">Inbox</h1>
        <button
          onClick={() => setShowNewGroup(true)}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          New group
        </button>
      </div>

      {isLoading && <Loader />}

      {!isLoading && chats.length === 0 && (
        <p className="text-sm text-ink-faint text-center py-10">
          No conversations yet — start a group to message a few friends at once.
        </p>
      )}

      <div className="divide-y divide-border">
        {chats.map((chat) => {
          const isGroup = !!chat.isGroup || !!chat.name;
          const other = !isGroup
            ? chat.members?.find((m) => m._id !== userData?._id)
            : null;
          const title = isGroup ? chat.name : other?.username || "Conversation";
          const lastMessage = chat.lastMessage?.content || chat.lastMessage || "No messages yet";

          return (
            <Link
              key={chat._id}
              to={isGroup ? `/chats/group/${chat._id}` : `/chats/user/${other?._id}`}
              className="flex items-center gap-3 py-3.5 hover:bg-black/[0.02] -mx-1 px-1 rounded-lg"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {initials(title)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-[15px] truncate">{title}</p>
                  <span className="text-xs text-ink-faint flex-shrink-0">
                    {timeAgo(chat.updatedAt || chat.lastMessage?.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-ink-faint truncate">{lastMessage}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
    </div>
  );
}
