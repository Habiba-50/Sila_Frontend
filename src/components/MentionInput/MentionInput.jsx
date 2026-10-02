import { useContext, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserContext } from "../../context/UserContext";
import { getId } from "../../utils/api";
import { getMyFriends } from "../../services/friendRequestService";
import Avatar from "../Avatar/Avatar";

function getFriendRecords(payload) {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  return data?.docs ?? data?.friends ?? [];
}

function normalizeFriend(record, currentUserId) {
  const sender = record?.senderId;
  const receiver = record?.receiverId;
  let user;
  if (sender && receiver) {
    user = String(getId(sender) ?? sender) === String(currentUserId) ? receiver : sender;
  } else {
    user = record?.friend ?? record?.user ?? record;
  }

  const id = getId(user) ?? user?.userId ?? user?.id;
  if (!id) return null;
  const name = user?.username || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Friend";
  return { id: String(id), name, user };
}

export default function MentionInput({
  value,
  onChange,
  onTagsChange,
  placeholder,
  rows,
  onKeyDown,
  className = "",
  inputClassName = "",
}) {
  const { userData } = useContext(UserContext);
  const currentUserId = getId(userData);
  const inputRef = useRef(null);
  const [cursor, setCursor] = useState(0);
  const [active, setActive] = useState(false);
  const { data: friends = [], isLoading, isError } = useQuery({
    queryKey: ["mention-friends"],
    queryFn: async () => {
      const response = await getMyFriends({ page: 1, size: 100 });
      return getFriendRecords(response.data)
        .map((record) => normalizeFriend(record, currentUserId))
        .filter(Boolean);
    },
    enabled: Boolean(currentUserId),
    staleTime: 60_000,
  });

  const mentionQuery = useMemo(() => {
    const beforeCursor = value.slice(0, cursor);
    const match = beforeCursor.match(/(?:^|\s)@([^\s@]*)$/);
    if (!active || !match) return null;
    return { text: match[1].toLocaleLowerCase(), start: cursor - match[0].length + match[0].indexOf("@") };
  }, [active, cursor, value]);

  const suggestions = useMemo(() => {
    if (!mentionQuery) return [];
    return friends
      .filter((friend) => friend.name.toLocaleLowerCase().includes(mentionQuery.text))
      .slice(0, 6);
  }, [friends, mentionQuery]);

  function handleChange(event) {
    const nextValue = event.target.value;
    const nextCursor = event.target.selectionStart ?? nextValue.length;
    onChange(nextValue);
    setCursor(nextCursor);
    setActive(true);
    const mentionedNames = nextValue.toLocaleLowerCase();
    onTagsChange((previous) => previous.filter((friend) => mentionedNames.includes(`@${friend.name.toLocaleLowerCase()}`)));
  }

  function chooseFriend(friend) {
    if (!mentionQuery) return;
    const before = value.slice(0, mentionQuery.start);
    const after = value.slice(cursor);
    const mention = `@${friend.name} `;
    const nextValue = `${before}${mention}${after}`;
    const nextCursor = before.length + mention.length;
    onChange(nextValue);
    onTagsChange((previous) => previous.some((item) => item.id === friend.id) ? previous : [...previous, friend]);
    setCursor(nextCursor);
    setActive(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  const Input = rows ? "textarea" : "input";

  return (
    <div className={`relative ${className}`}>
      <Input
        ref={inputRef}
        value={value}
        rows={rows}
        onChange={handleChange}
        onClick={(event) => { setCursor(event.target.selectionStart ?? value.length); setActive(true); }}
        onKeyUp={(event) => setCursor(event.target.selectionStart ?? value.length)}
        onFocus={() => setActive(true)}
        onBlur={() => window.setTimeout(() => setActive(false), 150)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={inputClassName}
      />
      {mentionQuery && (
        <div className="absolute z-30 left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-panel p-1.5 shadow-lg">
          {isLoading && <p className="px-3 py-2 text-sm text-ink-soft">Loading friends…</p>}
          {!isLoading && isError && <p className="px-3 py-2 text-sm text-like">Couldn't load your friends.</p>}
          {!isLoading && !isError && suggestions.map((friend) => (
            <button
              key={friend.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseFriend(friend)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-primary-soft"
            >
              <Avatar user={friend.user} size={30} textSize="text-[10px]" />
              <span className="text-sm font-medium">{friend.name}</span>
            </button>
          ))}
          {!isLoading && !isError && suggestions.length === 0 && (
            <p className="px-3 py-2 text-sm text-ink-soft">No matching friends.</p>
          )}
        </div>
      )}
    </div>
  );
}
