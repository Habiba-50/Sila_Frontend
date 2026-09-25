import { useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as commentService from "../../services/commentService";
import { UserContext } from "../../context/UserContext";
import CommentItem from "./CommentItem";
import { initials } from "../../utils/constants";

// NOTE: the Postman collection doesn't expose a "list comments for a post"
// endpoint — this assumes the post document already comes back populated
// with a `comments` array (common with a populate()-style API). If your
// backend paginates comments separately, swap this for a real query.
export default function Comments({ postId, comments = [] }) {
  const commentList = Array.isArray(comments) ? comments : [];
  const { userData } = useContext(UserContext);
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => commentService.createComment(postId, { content: text }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  return (
    <div className="mt-2 pt-3 border-t border-border">
      <div className="flex gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
          {initials(userData?.username)}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 text-sm border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => e.key === "Enter" && text.trim() && mutate()}
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
          <CommentItem key={c._id} postId={postId} comment={c} />
        ))}
      </div>
    </div>
  );
}
