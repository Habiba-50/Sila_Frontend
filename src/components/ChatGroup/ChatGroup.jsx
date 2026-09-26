import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as chatService from "../../services/chatService";
import { searchUsers } from "../../services/userService";
import { getSocket } from "../../services/socket";
import { UserContext } from "../../context/UserContext";
import MessageBubble from "../Chat/MessageBubble";
import ChatComposer from "../Chat/ChatComposer";
import Loader from "../Loader/Loader";
import { initials } from "../../utils/constants";

export default function ChatGroup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);
  const queryClient = useQueryClient();
  const [addTerm, setAddTerm] = useState("");
  const [addResults, setAddResults] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const bottomRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["chat-group", id],
    queryFn: () => chatService.getGroup(id).then((r) => r.data),
  });
  const group = extractItem(data);

  useEffect(() => {
    if (data) setMessages(data?.data?.messages ?? data?.messages ?? []);
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("join_room", { roomId: id });

    function handleNewMessage(msg) {
      if (msg.groupId === id) setMessages((prev) => [...prev, msg]);
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
  }, [id]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["chat-group", id] });
    queryClient.invalidateQueries({ queryKey: ["my-chats"] });
  }

  function sendMessage(text) {
    const socket = getSocket();
    const content = replyingTo ? `↩ ${replyingTo.content}\n${text}` : text;
    socket?.emit("sendGroupMessage", { groupId: id, content });
    setMessages((prev) => [
      ...prev,
      { _id: `local-${Date.now()}`, content, from: { _id: userData?._id, username: userData?.username }, createdAt: new Date().toISOString() },
    ]);
    setReplyingTo(null);
  }

  function submitEdit(text) {
    const socket = getSocket();
    socket?.emit("editMessage", { messageId: editingMessage._id, content: text }); // ASSUMPTION, see MessageBubble note
    setMessages((prev) => prev.map((m) => (m._id === editingMessage._id ? { ...m, content: text, edited: true } : m)));
    setEditingMessage(null);
  }

  function deleteMessage(message) {
    const socket = getSocket();
    socket?.emit("deleteMessage", { messageId: message._id }); // ASSUMPTION
    setMessages((prev) => prev.filter((m) => m._id !== message._id));
  }

  function reactToMessage(message, react) {
    getSocket()?.emit("reactMessage", { messageId: message._id, react }); // ASSUMPTION
  }

  const removeMember = useMutation({ mutationFn: (memberId) => chatService.removeGroupMember(id, memberId), onSuccess: invalidate });
  const addMember = useMutation({
    mutationFn: (memberId) => chatService.addGroupMember(id, [memberId]),
    onSuccess: () => { invalidate(); setAddTerm(""); setAddResults([]); },
  });
  const leave = useMutation({ mutationFn: () => chatService.leaveGroup(id), onSuccess: () => { toast.success("Left the group"); navigate("/chats"); } });
  const remove = useMutation({ mutationFn: () => chatService.deleteGroup(id), onSuccess: () => { toast.success("Group deleted"); navigate("/chats"); } });

  async function runSearch(value) {
    setAddTerm(value);
    if (!value.trim()) return setAddResults([]);
    const { data } = await searchUsers(value);
    setAddResults(extractList(data));
  }

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-sm font-semibold">
          {initials(group?.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] truncate">{group?.name}</p>
          <p className="text-xs text-ink-faint">{group?.members?.length || 0} members</p>
        </div>
        <button onClick={() => setShowMembers((s) => !s)} className="text-sm font-medium text-primary flex-shrink-0">
          {showMembers ? "Hide" : "Members"}
        </button>
      </div>

      {showMembers && (
        <div className="bg-panel border border-border rounded-2xl p-4 mb-3">
          <div className="divide-y divide-border">
            {group?.members?.map((m) => (
              <div key={m._id} className="flex items-center gap-2.5 py-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-ink-faint to-border text-white flex items-center justify-center text-[10px] font-semibold">
                  {initials(m.username)}
                </div>
                <span className="text-sm flex-1">{m.username}</span>
                {m._id !== userData?._id && (
                  <button onClick={() => removeMember.mutate(m._id)} className="text-xs text-ink-faint hover:text-like">Remove</button>
                )}
              </div>
            ))}
          </div>
          <input
            value={addTerm}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Add a member…"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {addResults.map((u) => (
            <button key={u._id} onClick={() => addMember.mutate(u._id)} className="w-full flex items-center gap-2 py-1.5 text-left">
              <span className="text-sm">{u.username}</span>
            </button>
          ))}
          <div className="flex gap-2 mt-3">
            <button onClick={() => leave.mutate()} className="flex-1 border border-border text-xs font-semibold py-2 rounded-lg">Leave group</button>
            <button onClick={() => remove.mutate()} className="flex-1 text-like border border-like/30 text-xs font-semibold py-2 rounded-lg">Delete group</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 py-2">
        {messages.length === 0 && <p className="text-sm text-ink-faint text-center py-10">No messages yet.</p>}
        {messages.map((m) => (
          <MessageBubble key={m._id} message={m} onReply={setReplyingTo} onEdit={setEditingMessage} onDelete={deleteMessage} onReact={reactToMessage} />
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
