import { useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as commentService from "../../services/commentService";
import { UserContext } from "../../context/UserContext";
import ReactionButton from "../ReactionButton/ReactionButton";
import { initials } from "../../utils/constants";
import { getId } from "../../utils/api";

export default function CommentItem({ postId, comment }) {
  const { userData } = useContext(UserContext);
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
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ink-faint to-border text-white flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
          {initials(comment?.user?.username)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-black/[0.03] rounded-xl px-3.5 py-2 inline-block max-w-full">
            <p className="text-sm font-semibold">{comment?.user?.username || "Member"}</p>
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
          </div>

          {/* replies */}
          {comment?.replies?.length > 0 && (
            <div className="mt-2 space-y-2 border-l-2 border-border pl-3">
              {comment.replies.map((reply) => {
                const replyUserReaction = Array.isArray(reply?.reactions)
                  ? reply.reactions.find(
                      (r) => (r?.user?._id || r?.user || r?.userId?._id || r?.userId) === userData?._id
                    )
                  : null;
                const replyMyReaction = reply?.myReaction ?? replyUserReaction?.react ?? replyUserReaction?.type ?? replyUserReaction?.reaction;

                return (
                  <div key={getId(reply)} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ink-faint to-border text-white flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                      {initials(reply?.user?.username)}
                    </div>
                    <div>
                      <div className="bg-black/[0.03] rounded-xl px-3 py-1.5 inline-block">
                        <p className="text-xs font-semibold">{reply?.user?.username || "Member"}</p>
                        <p className="text-[13.5px]">{reply?.content}</p>
                      </div>
                      <ReactionButton
                        count={reply?.reactions?.length}
                        myReaction={replyMyReaction}
                        onReact={(v) => replyReact(getId(reply), v)}
                      />
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
                placeholder={`Reply to ${comment?.user?.username || "this comment"}…`}
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
