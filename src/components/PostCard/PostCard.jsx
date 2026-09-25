import { useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import * as postService from "../../services/postService";
import * as repostService from "../../services/repostService";
import * as bookmarkService from "../../services/bookmarkService";
import { UserContext } from "../../context/UserContext";
import ReactionButton from "../ReactionButton/ReactionButton";
import Comments from "../Comments/Comments";
import { initials } from "../../utils/constants";
import { extractPostImages } from "../../services/fileService";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function PostCard({ post }) {
  const { userData } = useContext(UserContext);
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  const author = post?.user || {};
  const isOwner = author?._id === userData?._id;

  const userReaction = Array.isArray(post?.reactions)
    ? post.reactions.find(
        (r) => (r?.user?._id || r?.user || r?.userId?._id || r?.userId) === userData?._id
      )
    : null;
  const myReaction = post?.myReaction ?? userReaction?.react ?? userReaction?.type ?? userReaction?.reaction;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  }

  const reactMutation = useMutation({
    mutationFn: (value) => postService.reactToPost(post._id, value),
    onSuccess: invalidate,
  });

  const repostMutation = useMutation({
    mutationFn: () => repostService.sharePost(post._id),
    onSuccess: () => {
      toast.success("Shared to your profile");
      invalidate();
    },
    onError: () => toast.error("Couldn't share this post."),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () =>
      post.isBookmarked
        ? bookmarkService.unsavePost(post._id)
        : bookmarkService.savePost(post._id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => postService.deletePost(post._id),
    onSuccess: () => {
      toast.success("Post deleted");
      invalidate();
    },
  });

  return (
    <article className="border-b border-border py-5 first:pt-0">
      {post?.isRepost && (
        <div className="flex items-center gap-2 text-[13px] font-medium text-ink-faint mb-2.5 ml-[52px]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          {post?.repostedBy?.username || "Someone"} shared this
        </div>
      )}

      <div className="flex gap-3">
        <Link to={`/profile/${author._id}`} className="flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-sm font-semibold">
            {initials(author?.username)}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link to={`/profile/${author._id}`} className="font-semibold text-[15px] hover:underline">
              {author?.username || "Member"}
            </Link>
            <span className="text-ink-faint text-[13.5px]">· {timeAgo(post?.createdAt)}</span>
            {isOwner && (
              <button
                onClick={() => deleteMutation.mutate()}
                className="ml-auto text-xs text-ink-faint hover:text-like"
              >
                Delete
              </button>
            )}
          </div>

          {post?.content && (
            <p className="text-[15.5px] leading-relaxed mt-1 whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}

          {(() => {
            const images = extractPostImages(post);
            if (!images.length) return null;
            return (
              <div className="mt-2.5 space-y-2">
                {images.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt="Attachment"
                    className="rounded-xl border border-border max-h-[420px] w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ))}
              </div>
            );
          })()}

          <div className="flex items-center gap-1 mt-1">
            <ReactionButton
              count={post?.reactions?.length}
              myReaction={myReaction}
              onReact={(v) => reactMutation.mutate(v)}
            />
            <button
              onClick={() => setShowComments((s) => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13.5px] font-medium text-ink-faint hover:bg-black/[0.03]"
            >
              💬 {post?.comments?.length || 0} comments
            </button>
            <button
              onClick={() => repostMutation.mutate()}
              disabled={repostMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13.5px] font-medium text-ink-faint hover:bg-black/[0.03]"
            >
              ⤴ Share
            </button>
            <button
              onClick={() => bookmarkMutation.mutate()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13.5px] font-medium hover:bg-black/[0.03] ${
                post?.isBookmarked ? "text-gold font-semibold" : "text-ink-faint"
              }`}
            >
              ⌂ {post?.isBookmarked ? "Saved" : "Save"}
            </button>
          </div>

          {showComments && <Comments postId={post._id} comments={post?.comments || []} />}
        </div>
      </div>
    </article>
  );
}
