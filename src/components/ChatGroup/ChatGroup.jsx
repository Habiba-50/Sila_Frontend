import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { extractItem, getId } from "../../utils/api";
import { fileUrl } from "../../services/fileService";
import Avatar from "../Avatar/Avatar";

export default function ChatGroup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useContext(UserContext);
  const queryClient = useQueryClient();
  const [addTerm, setAddTerm] = useState("");
  const [addResults, setAddResults] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ groupName: "", groupDescription: "", attachment: null });
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const bottomRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["chat-group", id],
    queryFn: () => chatService.getGroup(id).then((r) => r.data),
  });
  const group = extractItem(data);
  const groupName = group?.groupName || group?.name || location.state?.title || "Group chat";
  const groupIcon = group?.groupIcon ? fileUrl(group.groupIcon) : location.state?.avatarUrl;
  const isGroupCreator = String(getId(group?.createdBy)) === String(getId(userData));

  useEffect(() => {
    if (data) setMessages(data?.data?.messages ?? data?.messages ?? []);
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !group?.roomId) return;
    socket.emit("join_room", { roomId: group.roomId });

    function handleNewMessage(msg) {
      if (msg.groupId === id) setMessages((prev) => [...prev, { ...msg, _id: msg.messageId ?? msg._id }]);
    }
    function handleSentMessage(msg) {
      if (msg.chatId === id && msg.messageId && msg.deletedAt) {
        setMessages((prev) => prev.filter((m) => String(getId(m)) !== String(msg.messageId)));
        return;
      }
      if (msg.chatId === id && msg.messageId && msg.content) {
        setMessages((prev) => prev.map((m) =>
          String(getId(m)) === String(msg.messageId)
            ? { ...m, content: msg.content, edited: Boolean(msg.edited), updatedAt: msg.updatedAt }
            : m
        ));
        return;
      }
      if (msg.groupId !== id || !msg.messageId) return;
      setMessages((prev) => {
        const index = prev.findIndex((m) => String(m._id).startsWith("local-") && m.content === msg.content);
        if (index < 0) return prev;
        return prev.map((m, i) => i === index ? { ...m, _id: msg.messageId, pending: false } : m);
      });
    }
    function handleEdited({ messageId, content, updatedAt }) {
      setMessages((prev) => prev.map((m) => (String(getId(m)) === String(messageId) ? { ...m, content, edited: true, updatedAt } : m)));
    }
    function handleDeleted({ messageId }) {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    }
    function handleReacted(payload) {
      if (String(payload?.chatId) !== String(id) || !payload?.messageId || !Array.isArray(payload.reactions)) return;
      setMessages((prev) => prev.map((m) =>
        String(getId(m)) === String(payload.messageId) ? { ...m, likes: payload.reactions } : m
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
  }, [id, group?.roomId]);

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
      { _id: `local-${Date.now()}`, content, from: { _id: userData?._id, username: userData?.username }, createdAt: new Date().toISOString(), pending: true },
    ]);
    setReplyingTo(null);
  }

  function submitEdit(text) {
    const socket = getSocket();
    if (!getId(editingMessage) || String(getId(editingMessage)).startsWith("local-")) return;
    if (!socket?.connected) return toast.error("Chat is disconnected. Please try again.");
    socket.emit("editMessage", { chatId: id, messageId: getId(editingMessage), content: text });
    setEditingMessage(null);
  }

  function deleteMessage(message) {
    const socket = getSocket();
    if (!getId(message) || String(getId(message)).startsWith("local-")) return;
    if (!socket?.connected) return toast.error("Chat is disconnected. Please try again.");
    socket.emit("deleteMessage", { chatId: id, messageId: getId(message) });
  }

  function reactToMessage(message, react) {
    const socket = getSocket();
    const messageId = getId(message);
    if (!messageId || String(messageId).startsWith("local-")) return;
    if (!socket?.connected) return toast.error("Chat is disconnected. Please try again.");
    socket.emit("reactMessage", { chatId: id, messageId, react });
  }

  const removeMember = useMutation({ mutationFn: (memberId) => chatService.removeGroupMember(id, memberId), onSuccess: invalidate });
  const addMember = useMutation({
    mutationFn: (memberId) => chatService.addGroupMember(id, [memberId]),
    onSuccess: () => { invalidate(); setAddTerm(""); setAddResults([]); },
  });
  const leave = useMutation({ mutationFn: () => chatService.leaveGroup(id), onSuccess: () => { toast.success("Left the group"); navigate("/chats"); } });
  const remove = useMutation({ mutationFn: () => chatService.deleteGroup(id), onSuccess: () => { toast.success("Group deleted"); navigate("/chats"); } });
  const editGroup = useMutation({
    mutationFn: () => {
      const body = new FormData();
      body.append("groupName", groupForm.groupName.trim());
      body.append("groupDescription", groupForm.groupDescription.trim());
      if (groupForm.attachment) body.append("attachment", groupForm.attachment);
      return chatService.updateGroup(id, body);
    },
    onSuccess: () => {
      invalidate();
      setEditingGroup(false);
      setShowGroupDetails(false);
      toast.success("Group details updated");
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Couldn't update group details."),
  });

  function openGroupDetails() {
    setGroupForm({ groupName, groupDescription: group?.groupDescription || "", attachment: null });
    setEditingGroup(false);
    setShowGroupDetails(true);
  }

  async function runSearch(value) {
    setAddTerm(value);
    if (!value.trim()) return setAddResults([]);
    const { data } = await searchUsers(value);
    setAddResults(extractList(data));
  }

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="pb-3 border-b border-border mb-3">
        <button
          type="button"
          onClick={() => navigate("/chats")}
          className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-primary mb-3"
          aria-label="Back to messages"
        >
          <span aria-hidden="true" className="text-lg leading-none">←</span>
          <span>Back to messages</span>
        </button>
        <div className="flex items-center gap-3">
          {groupIcon ? (
            <img src={groupIcon} alt={`${groupName} group`} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {initials(groupName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <button type="button" onClick={openGroupDetails} className="font-semibold text-[15px] truncate text-left hover:text-primary">{groupName}</button>
            <p className="text-xs text-ink-faint">{group?.participants?.length || 0} members</p>
          </div>
          <button onClick={() => setShowMembers((s) => !s)} className="text-sm font-medium text-primary flex-shrink-0">
            {showMembers ? "Hide" : "Members"}
          </button>
        </div>
      </div>

      {showGroupDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowGroupDetails(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="group-details-title" className="bg-panel border border-border rounded-2xl p-5 w-full max-w-md shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 id="group-details-title" className="font-display text-lg font-semibold">Group details</h2>
              <button type="button" onClick={() => setShowGroupDetails(false)} aria-label="Close" className="text-ink-faint hover:text-ink">✕</button>
            </div>
            {editingGroup ? (
              <form onSubmit={(e) => { e.preventDefault(); editGroup.mutate(); }} className="space-y-3">
                <label className="block text-sm font-medium">Group photo
                  <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={(e) => setGroupForm((f) => ({ ...f, attachment: e.target.files?.[0] || null }))} className="block w-full mt-1 text-sm" />
                </label>
                <label className="block text-sm font-medium">Group name
                  <input required maxLength={80} value={groupForm.groupName} onChange={(e) => setGroupForm((f) => ({ ...f, groupName: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm" />
                </label>
                <label className="block text-sm font-medium">Description
                  <textarea maxLength={500} rows={3} value={groupForm.groupDescription} onChange={(e) => setGroupForm((f) => ({ ...f, groupDescription: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm resize-none" />
                </label>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setEditingGroup(false)} className="px-3 py-2 text-sm">Cancel</button>
                  <button disabled={editGroup.isPending} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">{editGroup.isPending ? "Saving…" : "Save changes"}</button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {groupIcon ? <img src={groupIcon} alt={`${groupName} group`} className="w-20 h-20 rounded-full object-cover mx-auto" /> : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-xl font-semibold mx-auto">{initials(groupName)}</div>}
                <h3 className="text-center text-lg font-semibold">{groupName}</h3>
                <p className="text-sm text-ink-soft whitespace-pre-wrap text-center">{group?.groupDescription || "No description"}</p>
                {isGroupCreator && <button type="button" onClick={() => setEditingGroup(true)} className="w-full bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold">Edit group details</button>}
              </div>
            )}
          </section>
        </div>
      )}

      {showMembers && (
        <div className="bg-panel border border-border rounded-2xl p-4 mb-3">
          <div className="divide-y divide-border">
            {group?.participants?.map((m) => (
              <div key={getId(m)} className="flex items-center gap-2.5 py-2">
                <Avatar user={m} size={28} textSize="text-[10px]" />
                <span className="text-sm flex-1">{m.username || [m.firstName, m.lastName].filter(Boolean).join(" ")}</span>
                {getId(m) !== getId(userData) && (
                  <button onClick={() => removeMember.mutate(getId(m))} className="text-xs text-ink-faint hover:text-like">Remove</button>
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
            <button key={getId(u)} onClick={() => addMember.mutate(getId(u))} className="w-full flex items-center gap-2 py-1.5 text-left">
              <Avatar user={u} size={28} textSize="text-[10px]" />
              <span className="text-sm">{u.username || [u.firstName, u.lastName].filter(Boolean).join(" ")}</span>
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
          <MessageBubble key={getId(m)} message={m} onReply={setReplyingTo} onEdit={setEditingMessage} onDelete={deleteMessage} onReact={reactToMessage} />
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
