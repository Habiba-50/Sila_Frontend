import { useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as commentService from "../../services/commentService";
import { UserContext } from "../../context/UserContext";
import CommentItem from "./CommentItem";
import { initials } from "../../utils/constants";
import { getId } from "../../utils/api";
import Avatar from "../Avatar/Avatar";
import MentionInput from "../MentionInput/MentionInput";

// NOTE: the Postman collection doesn't expose a "list comments for a post"
// endpoint — this assumes the post document already comes back populated
// with a `comments` array (common with a populate()-style API). If your
// backend paginates comments separately, swap this for a real query.
export default function Comments({ postId, comments = [], isPostOwner = false }) {
  const commentList = Array.isArray(comments)
    ? comments.filter((comment) => !comment?.deletedAt && !comment?.commentId)
    : [];
  const { userData } = useContext(UserContext);
  const [text, setText] = useState("");
  const [tags, setTags] = useState([]);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => commentService.createComment(postId, {
      content: text,
      tags: tags.map((friend) => friend.id),
    }),
    onSuccess: () => {
      setText("");
      setTags([]);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  return (
    <div className="mt-2 pt-3 border-t border-border">
      <div className="flex gap-2.5 mb-1">
        <Avatar user={userData} size={32} textSize="text-[11px]" />
        <div className="flex-1 flex gap-2">
          <MentionInput
            value={text}
            onChange={setText}
            onTagsChange={setTags}
            placeholder="Write a comment…"
            onKeyDown={(event) => event.key === "Enter" && text.trim() && mutate()}
            className="flex-1 min-w-0"
            inputClassName="w-full text-sm border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            disabled={!text.trim() || isPending}
            onClick={() => mutate()}
            className="text-sm font-semibold text-primary px-2 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      <div className="divide-y divide-border/70">
        {commentList.length === 0 && (
          <p className="text-sm text-ink-faint py-3">Be the first to comment.</p>
        )}
        {commentList.map((c) => (
          <CommentItem
            key={getId(c)}
            postId={postId}
            comment={c}
            isPostOwner={isPostOwner}
          />
        ))}
      </div>
    </div>
  );
}
