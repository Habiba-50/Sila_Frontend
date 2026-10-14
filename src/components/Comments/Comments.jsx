import { useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as commentService from "../../services/commentService";
import { UserContext } from "../../context/UserContext";
import CommentItem from "./CommentItem";
import { getId } from "../../utils/api";
import Avatar from "../Avatar/Avatar";
import MentionInput from "../MentionInput/MentionInput";

// NOTE: the Postman collection doesn't expose a "list comments for a post"
// endpoint — this assumes the post document already comes back populated
// with a `comments` array (common with a populate()-style API). If your
// backend paginates comments separately, swap this for a real query.
export default function Comments({ postId, comments = [], isPostOwner = false }) {
  const initialComments = Array.isArray(comments)
    ? comments.filter((comment) => !comment?.deletedAt && !comment?.commentId)
    : [];
  const [submittedComments, setSubmittedComments] = useState([]);
  const commentList = [...initialComments];
  for (const submitted of submittedComments) {
    const submittedId = getId(submitted);
    if (!submittedId || !commentList.some((comment) => String(getId(comment)) === String(submittedId))) {
      commentList.push(submitted);
    }
  }
  const { userData } = useContext(UserContext);
  const [text, setText] = useState("");
  const [tags, setTags] = useState([]);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: ({ content, commentTags }) => commentService.createComment(postId, {
      content,
      tags: commentTags,
    }),
    onSuccess: (response, variables) => {
      const payload = response?.data?.data ?? response?.data;
      const returnedComment = payload?.comment ?? payload?.data?.comment ?? payload?.data ?? payload;
      const savedComment = returnedComment && typeof returnedComment === "object" && returnedComment.content
        ? returnedComment
        : {
            _id: `local-comment-${Date.now()}`,
            content: variables.content,
            createdBy: userData,
            createdAt: new Date().toISOString(),
            replies: [],
          };
      setSubmittedComments((current) => [...current, savedComment]);
      setText("");
      setTags([]);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Couldn't add your comment.");
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
            onKeyDown={(event) => event.key === "Enter" && text.trim() && mutate({
              content: text.trim(),
              commentTags: tags.map((friend) => friend.id),
            })}
            className="flex-1 min-w-0"
            inputClassName="w-full text-sm border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            disabled={!text.trim() || isPending}
            onClick={() => mutate({
              content: text.trim(),
              commentTags: tags.map((friend) => friend.id),
            })}
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
