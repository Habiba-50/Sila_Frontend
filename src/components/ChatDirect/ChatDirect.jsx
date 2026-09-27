import { useContext, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as chatService from "../../services/chatService";
import * as userService from "../../services/userService";
import { getSocket } from "../../services/socket";
import { UserContext } from "../../context/UserContext";
import MessageBubble from "../Chat/MessageBubble";
import ChatComposer from "../Chat/ChatComposer";
import Loader from "../Loader/Loader";
import { initials } from "../../utils/constants";

export default function ChatDirect() {
  const { userId } = useParams();
  const { userData: me } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const bottomRef = useRef(null);

  const { data: otherUser } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => userService.getUserById(userId).then((r) => r.data?.data ?? r.data),
  });

  const { data: history, isLoading } = useQuery({
    queryKey: ["direct-chat", userId],
    queryFn: () => chatService.getDirectChat(userId).then((r) => r.data),
  });

  useEffect(() => {
    if (history) {
      setMessages(history?.data?.messages ?? history?.messages ?? history?.data ?? []);
    }
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleNewMessage(msg) {
      if (msg.sendTo === userId || msg.from?._id === userId || msg.from === userId) {
        setMessages((prev) => [...prev, msg]);
      }
    }
    function handleEdited({ messageId, content }) {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, content, edited: true } : m)));
    }
    function handleDeleted({ messageId }) {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    }
    function handleError(err) {
      toast.error(err?.message || "Something went wrong with that message.");
    }

    socket.on("newMessage", handleNewMessage);
    socket.on("message_edited", handleEdited);
    socket.on("message_deleted", handleDeleted);
    socket.on("custom_error", handleError);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("message_edited", handleEdited);
      socket.off("message_deleted", handleDeleted);
      socket.off("custom_error", handleError);
    };
  }, [userId]);

  function sendMessage(text) {
    const socket = getSocket();
    const content = replyingTo ? `↩ ${replyingTo.content}\n${text}` : text;
    socket?.emit("sendMessage", { sendTo: userId, content });
    setMessages((prev) => [
      ...prev,
      { _id: `local-${Date.now()}`, content, from: { _id: me?._id, username: me?.username }, createdAt: new Date().toISOString() },
    ]);
    setReplyingTo(null);
  }

  function submitEdit(text) {
    const socket = getSocket();
    // ASSUMPTION: emit name not documented — verify against your backend.
    socket.emit("editMessage", { chatId: history?.data?._id, messageId, content })
    setMessages((prev) => prev.map((m) => (m._id === editingMessage._id ? { ...m, content: text, edited: true } : m)));
    setEditingMessage(null);
  }

  function deleteMessage(message) {
    const socket = getSocket();
    // ASSUMPTION: emit name not documented — verify against your backend.
    socket?.emit("deleteMessage", { messageId: message._id });
    setMessages((prev) => prev.filter((m) => m._id !== message._id));
  }

  function reactToMessage(message, react) {
    const socket = getSocket();
    // ASSUMPTION: message-level reactions aren't documented at all (only
    // post reactions are) — this is a best-effort emit, verify/replace.
    socket?.emit("reactMessage", { messageId: message._id, react });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
        <Link to="/chats" className="text-ink-faint lg:hidden">←</Link>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-sm font-semibold">
          {initials(otherUser?.username)}
        </div>
        <p className="font-semibold text-[15px]">{otherUser?.username || "Conversation"}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 py-2">
        {isLoading && <Loader full={false} />}
        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-ink-faint text-center py-10">Say hello 👋</p>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m._id}
            message={m}
            onReply={setReplyingTo}
            onEdit={setEditingMessage}
            onDelete={deleteMessage}
            onReact={reactToMessage}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatComposer
        onSend={sendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onSubmitEdit={submitEdit}
      />
    </div>
  );
}
