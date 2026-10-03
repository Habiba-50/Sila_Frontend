import { useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import * as postService from "../../services/postService";
import * as repostService from "../../services/repostService";
import * as bookmarkService from "../../services/bookmarkService";
import { UserContext } from "../../context/UserContext";
import ReactionButton from "../ReactionButton/ReactionButton";
import Comments from "../Comments/Comments";
import { extractPostImages } from "../../services/fileService";
import { getAuthor, getId } from "../../utils/api";
import Avatar from "../Avatar/Avatar";

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

export default function PostCard({ post, onDismiss }) {
  const { userData } = useContext(UserContext);
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  const author = getAuthor(post) || {};
  const authorName =
    author?.username ||
    [author?.firstName, author?.lastName].filter(Boolean).join(" ").trim() ||
    author?.email ||
    "Member";
  const isOwner = getId(author) === getId(userData);
  const postId = getId(post);
  const postReactions = Array.isArray(post?.reactions)
    ? post.reactions
    : Array.isArray(post?.likes)
      ? post.likes
      : [];
  const visibleCommentCount = Array.isArray(post?.comments)
    ? post.comments.filter((comment) => !comment?.deletedAt && !comment?.commentId).length
    : 0;

  const userReaction = postReactions.find((r) => {
    const reactionUserId = r?.user?._id || r?.user || r?.userId?._id || r?.userId;
    return String(reactionUserId) === String(getId(userData));
  });
  const myReaction = post?.myReaction ?? userReaction?.react ?? userReaction?.type ?? userReaction?.reaction;

  const bookmarkStatusQuery = useQuery({
    queryKey: ["bookmark-status", postId],
    queryFn: async () => {
      const response = await bookmarkService.isPostSaved(postId);
      const result = response?.data?.data ?? response?.data;
      return typeof result === "boolean" ? result : Boolean(result?.isBookmarked ?? result?.saved);
    },
    enabled: Boolean(userData && postId),
    initialData: typeof post?.isBookmarked === "boolean" ? post.isBookmarked : undefined,
  });
  const isBookmarked = bookmarkStatusQuery.data ?? Boolean(post?.isBookmarked);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  }

  const reactMutation = useMutation({
    mutationFn: (value) => postService.reactToPost(getId(post), value),
    onSuccess: invalidate,
  });

  const repostMutation = useMutation({
    mutationFn: () =>
      post?.repostId
        ? repostService.deleteRepost(post.repostId)
        : repostService.sharePost(getId(post)),
    onSuccess: () => {
      toast.success(post?.repostId ? "Share removed" : "Shared to your profile");
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["my-reposts"] });
    },
    onError: () => toast.error(post?.repostId ? "Couldn't undo share." : "Couldn't share this post."),
  });

  const bookmarkMutation = useMutation({
    mutationFn: ({ wasSaved }) =>
      wasSaved ? bookmarkService.unsavePost(postId) : bookmarkService.savePost(postId),
    onMutate: async ({ wasSaved }) => {
      const queryKey = ["bookmark-status", postId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, !wasSaved);
      return { previous, queryKey, wasSaved };
    },
    onSuccess: (_response, _variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success(context?.wasSaved ? "Post removed from saved" : "Post saved");
    },
    onError: (error, _variables, context) => {
      if (context?.queryKey) queryClient.setQueryData(context.queryKey, context.previous);
      toast.error(error?.response?.data?.message || "Couldn't update saved posts.");
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) queryClient.invalidateQueries({ queryKey: context.queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => postService.deletePost(getId(post)),
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
          {post?.repostId
            ? "You shared this"
            : `${post?.repostedBy?.username || [post?.repostedBy?.firstName, post?.repostedBy?.lastName].filter(Boolean).join(" ") || "Someone"} shared this`}
          {post?.repostCreatedAt && <span>· {timeAgo(post.repostCreatedAt)}</span>}
        </div>
      )}

      {post?.isRepost && post?.repostCaption && (
        <p className="text-[15px] leading-relaxed mb-2 ml-[52px] whitespace-pre-wrap break-words">
          {post.repostCaption}
        </p>
      )}

      <div className="flex gap-3">
        <Link to={`/profile/${getId(author)}`} className="flex-shrink-0">
          <Avatar user={author} size={44} />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link to={`/profile/${getId(author)}`} className="font-semibold text-[15px] hover:underline">
              {authorName}
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
            {onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(postId)}
                aria-label="Hide post from this feed"
                title="Hide post"
                className={`${isOwner ? "" : "ml-auto "}flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xl leading-none text-ink-faint hover:bg-black/[0.06] hover:text-ink`}
              >
                ×
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

          <div className="grid grid-cols-4 items-start gap-1 mt-1 sm:flex sm:items-center">
            <ReactionButton
              count={postReactions.length}
              myReaction={myReaction}
              onReact={(v) => reactMutation.mutate(v)}
              mobileCompact
            />
            <button
              onClick={() => setShowComments((s) => !s)}
              className="flex w-full flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1 py-1.5 text-xs font-medium text-ink-faint hover:bg-black/[0.03] sm:w-auto sm:flex-row sm:gap-1.5 sm:px-3 sm:text-[13.5px]"
            >
              💬 {visibleCommentCount} comments
            </button>
            <button
              onClick={() => repostMutation.mutate()}
              disabled={repostMutation.isPending}
              className="flex w-full flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1 py-1.5 text-xs font-medium text-ink-faint hover:bg-black/[0.03] sm:w-auto sm:flex-row sm:gap-1.5 sm:px-3 sm:text-[13.5px]"
            >
              ⤴ {post?.repostId ? "Undo share" : "Share"}
            </button>
            <button
              onClick={() => bookmarkMutation.mutate({ wasSaved: isBookmarked })}
              disabled={bookmarkMutation.isPending || bookmarkStatusQuery.isLoading}
              className={`flex w-full flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1 py-1.5 text-xs font-medium hover:bg-black/[0.03] disabled:opacity-60 sm:w-auto sm:flex-row sm:gap-1.5 sm:px-3 sm:text-[13.5px] ${
                isBookmarked ? "text-gold font-semibold" : "text-ink-faint"
              }`}
            >
              ⌂ {isBookmarked ? "Saved" : "Save"}
            </button>
          </div>

          {showComments && (
            <Comments
              postId={postId}
              comments={post?.comments || []}
              isPostOwner={isOwner}
            />
          )}
        </div>
      </div>
    </article>
  );
}
