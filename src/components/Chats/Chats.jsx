import React ,{ useContext, useState } from "react";
import { Link } from "react-router-dom";
import useMyChats from "../../Hooks/useMyChats";
import { UserContext } from "../../context/UserContext";
import Loader from "../Loader/Loader";
import NewGroupModal from "./NewGroupModal";
import { initials} from "../../utils/constants";
import { extractList, getId } from "../../utils/api";
import { fileUrl } from "../../services/fileService";

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
  const [showNewGroup, setShowNewGroup] = useState(false);
  const { userData } = useContext(UserContext);
  const { data, isLoading } = useMyChats({ page: 1, size: 20 });
  const chats = extractList(data);

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
          // type: "ovm" = one-vs-many (group), "ovo" = one-vs-one (direct)
          const isGroup = chat.type === "ovm";
          const title = chat.displayName?.trim() || "Conversation";
          const lastMessage = chat.lastMessage?.content || "No messages yet";
          const avatarUrl = chat.displayImage ? fileUrl(chat.displayImage) : null;
          const lastMessageTime = timeAgo(chat.lastMessage?.createdAt);
          const lastMessageSenderId =
            chat.lastMessage?.createdBy?._id ?? chat.lastMessage?.createdBy;
          const isLastMessageFromMe =
            lastMessageSenderId && String(lastMessageSenderId) === String(getId(userData));

          return (
            <Link
              key={chat.chatId}
              to={isGroup ? `/chats/group/${chat.chatId}` : `/chats/user/${chat.otherUserId}`}
              state={{ title, avatarUrl }}
              className="flex items-center gap-3 py-3.5 hover:bg-black/[0.02] -mx-1 px-1 rounded-lg"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {initials(title)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-[15px] truncate">{title}</p>
                  <span className="flex items-center gap-1.5 text-xs text-ink-faint flex-shrink-0">
                    {lastMessageTime === "now" && !isLastMessageFromMe && (
                      <span className="h-2 w-2 rounded-full bg-primary" aria-label="New message" />
                    )}
                    {lastMessageTime}
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
