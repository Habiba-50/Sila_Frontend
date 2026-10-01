import { useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as commentService from "../../services/commentService";
import { UserContext } from "../../context/UserContext";
import ReactionButton from "../ReactionButton/ReactionButton";
import { getId } from "../../utils/api";
import Avatar from "../Avatar/Avatar";

export default function CommentItem({ postId, comment, isPostOwner = false }) {
  const { userData } = useContext(UserContext);
  const commentAuthor = comment?.createdBy ?? comment?.user ?? comment?.author;
  const commentAuthorName =
    commentAuthor?.username ||
    [commentAuthor?.firstName, commentAuthor?.lastName].filter(Boolean).join(" ") ||
    "Member";
  const currentUserId = getId(userData);
  const isOwnedByCurrentUser = (author) => {
    const authorId = getId(author) ?? author;
    return Boolean(currentUserId && authorId && String(authorId) === String(currentUserId));
  };
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["post", postId] });
  }

  const reactMutation = useMutation({
    mutationFn: (value) => commentService.reactToComment(postId, getId(comment), value),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => commentService.deleteComment(postId, commentId),
    onSuccess: () => {
      toast.success("Comment deleted");
      invalidate();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Couldn't delete this comment.");
    },
  });

  const replyMutation = useMutation({
    mutationFn: () => commentService.replyToComment(postId, getId(comment), { content: replyText }),
    onSuccess: () => {
      setReplyText("");
      setReplying(false);
      invalidate();
    },
  });

  const replyReact = (replyId, value) =>
    commentService.reactToReply(postId, getId(comment), replyId, value).then(invalidate);

  const commentUserReaction = Array.isArray(comment?.reactions)
    ? comment.reactions.find(
        (r) => (r?.user?._id || r?.user || r?.userId?._id || r?.userId) === userData?._id
      )
    : null;
  const myReaction = comment?.myReaction ?? commentUserReaction?.react ?? commentUserReaction?.type ?? commentUserReaction?.reaction;

  return (
    <div className="py-3">
      <div className="flex gap-2.5">
        <Avatar user={commentAuthor} size={32} textSize="text-[11px]" />
        <div className="flex-1 min-w-0">
          <div className="bg-black/[0.03] rounded-xl px-3.5 py-2 inline-block max-w-full">
            <p className="text-sm font-semibold">{commentAuthorName}</p>
            <p className="text-sm break-words">{comment?.content}</p>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <ReactionButton
              count={comment?.reactions?.length}
              myReaction={myReaction}
              onReact={(v) => reactMutation.mutate(v)}
            />
            <button
              onClick={() => setReplying((r) => !r)}
              className="text-[13px] font-medium text-ink-faint px-2.5 py-1.5 rounded-lg hover:bg-black/[0.03]"
            >
              Reply
            </button>
            {(isPostOwner || isOwnedByCurrentUser(commentAuthor)) && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate(getId(comment))}
                disabled={deleteMutation.isPending}
                className="text-[13px] font-medium text-ink-faint px-2.5 py-1.5 rounded-lg hover:text-like disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>

          {/* replies */}
          {comment?.replies?.some((reply) => !reply?.deletedAt) && (
            <div className="mt-2 space-y-2 border-l-2 border-border pl-3">
              {comment.replies.filter((reply) => !reply?.deletedAt).map((reply) => {
                const replyAuthor = reply?.createdBy ?? reply?.user ?? reply?.author;
                const replyAuthorName =
                  replyAuthor?.username ||
                  [replyAuthor?.firstName, replyAuthor?.lastName].filter(Boolean).join(" ") ||
                  "Member";
                const replyUserReaction = Array.isArray(reply?.reactions)
                  ? reply.reactions.find(
                      (r) => (r?.user?._id || r?.user || r?.userId?._id || r?.userId) === userData?._id
                    )
                  : null;
                const replyMyReaction = reply?.myReaction ?? replyUserReaction?.react ?? replyUserReaction?.type ?? replyUserReaction?.reaction;

                return (
                  <div key={getId(reply)} className="flex gap-2">
                    <Avatar user={replyAuthor} size={24} textSize="text-[9px]" />
                    <div>
                      <div className="bg-black/[0.03] rounded-xl px-3 py-1.5 inline-block">
                        <p className="text-xs font-semibold">{replyAuthorName}</p>
                        <p className="text-[13.5px]">{reply?.content}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <ReactionButton
                          count={reply?.reactions?.length}
                          myReaction={replyMyReaction}
                          onReact={(v) => replyReact(getId(reply), v)}
                        />
                        {(isPostOwner || isOwnedByCurrentUser(replyAuthor)) && (
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(getId(reply))}
                            disabled={deleteMutation.isPending}
                            className="text-[13px] font-medium text-ink-faint px-2.5 py-1.5 rounded-lg hover:text-like disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {replying && (
            <div className="flex gap-2 mt-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${commentAuthorName}…`}
                className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => e.key === "Enter" && replyText.trim() && replyMutation.mutate()}
              />
              <button
                disabled={!replyText.trim() || replyMutation.isPending}
                onClick={() => replyMutation.mutate()}
                className="text-sm font-semibold text-primary px-2 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
