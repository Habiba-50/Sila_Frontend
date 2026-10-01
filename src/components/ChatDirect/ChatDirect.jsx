import { useContext, useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
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
import { getId } from "../../utils/api";

export default function ChatDirect() {
  const { userId } = useParams();
    const location = useLocation();
  const passedTitle = location.state?.title;
  const passedAvatar = location.state?.avatarUrl;
  const { userData: me } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const bottomRef = useRef(null);

  const { data: otherUser } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => userService.getUserById(userId).then((r) => r.data?.data ?? r.data),
    enabled: !passedTitle,
    retry: false,
  });

  const displayTitle = passedTitle || otherUser?.username || "Conversation";
  const displayAvatar = passedAvatar || null;

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
      if (msg.sendTo === userId || getId(msg.from) === userId || msg.from === userId) {
        setMessages((prev) => [...prev, { ...msg, _id: msg.messageId ?? msg._id }]);
      }
    }
    function handleSentMessage(msg) {
      if (msg.chatId && msg.messageId && msg.deletedAt) {
        setMessages((prev) => prev.filter((m) => String(getId(m)) !== String(msg.messageId)));
        return;
      }
      // The backend uses successMessage as the sender's acknowledgement for edits.
      if (msg.chatId && msg.messageId && msg.content) {
        setMessages((prev) => prev.map((m) =>
          String(getId(m)) === String(msg.messageId)
            ? { ...m, content: msg.content, edited: Boolean(msg.edited), updatedAt: msg.updatedAt }
            : m
        ));
        return;
      }
      if (msg.sendTo !== userId || !msg.messageId) return;
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.pending && m.content === msg.content);
        if (index < 0) return prev;
        return prev.map((m, i) => i === index ? { ...m, _id: msg.messageId, pending: false } : m);
      });
    }
    function handleEdited({ messageId, content, updatedAt }) {
      setMessages((prev) => prev.map((m) => (String(getId(m)) === String(messageId) ? { ...m, content, edited: true, updatedAt } : m)));
    }
    function handleDeleted({ messageId }) {
      setMessages((prev) => prev.filter((m) => getId(m) !== messageId));
    }
    function handleReacted({ messageId, reactions }) {
      if (!messageId || !Array.isArray(reactions)) return;
      setMessages((prev) => prev.map((m) =>
        String(getId(m)) === String(messageId) ? { ...m, likes: reactions } : m
      ));
    }
    function handleError(err) {
      toast.error(err?.message || "Something went wrong with that message.");
    }

    socket.on("newMessage", handleNewMessage);
    socket.on("successMessage", handleSentMessage);
    socket.on("message_edited", handleEdited);
    socket.on("message_deleted", handleDeleted);
    socket.on("message_reacted", handleReacted);
    socket.on("custom_error", handleError);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("successMessage", handleSentMessage);
      socket.off("message_edited", handleEdited);
      socket.off("message_deleted", handleDeleted);
      socket.off("message_reacted", handleReacted);
      socket.off("custom_error", handleError);
    };
  }, [userId]);

  function sendMessage(text) {
    const socket = getSocket();
    const content = replyingTo ? `↩ ${replyingTo.content}\n${text}` : text;
    socket?.emit("sendMessage", { sendTo: userId, content });
    setMessages((prev) => [
      ...prev,
      {
      _id: `local-${Date.now()}`,
      content,
      from: {
        _id: getId(me),
        username: me?.username,
      },
      createdAt: new Date().toISOString(),
      pending: true,
    },
    ]);
    setReplyingTo(null);
  }

  function submitEdit(text) {
    const socket = getSocket();

    const messageId = getId(editingMessage);
    const chatId = history?.data?._id;

    if (!messageId || String(messageId).startsWith("local-")) {
        toast.error("Message is not ready yet.");
        return;
    }

    if (!chatId) {
        toast.error("Chat ID is missing.");
        return;
    }

    if (!socket?.connected) {
        toast.error("Chat is disconnected. Please try again.");
        return;
    }

    socket.emit("editMessage", {
        chatId,
        messageId,
        content: text,
    });
    setEditingMessage(null);
}

  function deleteMessage(message) {
    const socket = getSocket();

    const messageId = getId(message);
    const chatId = history?.data?._id;

    if (!messageId || String(messageId).startsWith("local-")) {
        toast.error("Message is not ready yet.");
        return;
    }

    if (!chatId) {
        toast.error("Chat ID is missing.");
        return;
    }

    if (!socket?.connected) {
        toast.error("Chat is disconnected. Please try again.");
        return;
    }

    socket.emit("deleteMessage", {
        chatId,
        messageId,
    });
}

  function reactToMessage(message, react) {
    const socket = getSocket();
    const messageId = getId(message);
    const chatId = history?.data?._id;
    if (!messageId || String(messageId).startsWith("local-") || !chatId) return;
    if (!socket?.connected) return toast.error("Chat is disconnected. Please try again.");
    socket.emit("reactMessage", { chatId, messageId, react });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
        <Link to="/chats" className="text-ink-faint lg:hidden">←</Link>
        {displayAvatar ? (
          <img src={displayAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-sm font-semibold">
            {initials(displayTitle)}
          </div>
        )}
        <p className="font-semibold text-[15px]">{displayTitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 py-2">
        {isLoading && <Loader full={false} />}
        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-ink-faint text-center py-10">Say hello 👋</p>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={getId(m)}
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

