import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import useFeed from "../../Hooks/useFeed";
import useFriendRequestsReceived from "../../Hooks/useFriendRequestsReceived";
import * as friendRequestService from "../../services/friendRequestService";
import CreatePost from "../CreatePost/CreatePost";
import PostCard from "../PostCard/PostCard";
import Loader from "../Loader/Loader";
import Avatar from "../Avatar/Avatar";
import { extractList, getId } from "../../utils/api";

function FriendRequestsWidget() {
  const { data, isLoading } = useFriendRequestsReceived({ page: 1, size: 3 });
  const queryClient = useQueryClient();
  const requests = extractList(data);

  const respond = useMutation({
    mutationFn: ({ id, accept }) =>
      accept
        ? friendRequestService.acceptFriendRequest(id)
        : friendRequestService.rejectFriendRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friend-requests-received"] }),
  });

  if (isLoading) return null;
  if (!requests.length) return null;

  return (
    <div className="bg-panel border border-border rounded-2xl p-4">
      <h3 className="font-display font-semibold text-[16.5px] mb-3">Friend requests</h3>
      <div className="divide-y divide-border">
        {requests.map((r) => {
          const sender = r?.senderId ?? r?.sender ?? {};
          const senderId = getId(sender);
          const senderName = sender?.username || [sender?.firstName, sender?.lastName].filter(Boolean).join(" ").trim() || sender?.email || "Someone";

          return (
          <div key={getId(r)} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
            {senderId ? (
              <Link to={`/profile/${senderId}`} className="flex items-center gap-2.5 flex-1 min-w-0 hover:text-primary" aria-label={`View ${senderName}'s profile`}>
                <Avatar user={sender} size={36} textSize="text-xs" />
                <span className="text-sm font-semibold truncate">{senderName}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Avatar user={sender} size={36} textSize="text-xs" />
                <span className="text-sm font-semibold truncate">{senderName}</span>
              </div>
            )}
            <button
              onClick={() => respond.mutate({ id: getId(r), accept: true })}
              className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              Accept
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function FindPeopleWidget() {
  return (
    <div className="bg-panel border border-border rounded-2xl p-4">
      <h3 className="font-display font-semibold text-[16.5px] mb-2">Find people</h3>
      <p className="text-sm text-ink-soft mb-3">Search for friends, colleagues, or new connections.</p>
      <Link
        to="/search"
        className="block text-center bg-primary-soft text-primary font-semibold text-sm rounded-lg py-2"
      >
        Search Connectly
      </Link>
    </div>
  );
}

export default function Home() {
  const { data, isLoading, isError, error } = useFeed();
  const [dismissedPostIds, setDismissedPostIds] = useState(() => new Set());
  const posts = extractList(data);
  const visiblePosts = posts.filter((post) => !dismissedPostIds.has(String(getId(post))));

  function dismissPost(postId) {
    setDismissedPostIds((current) => new Set(current).add(String(postId)));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,600px)_280px] gap-7">
      <div>
        <CreatePost />
        <h2 className="font-display text-[21px] font-semibold mb-1">Your feed</h2>

        {isLoading && <Loader />}
        {isError && (
<p className="text-sm text-like py-6">Couldn't load the feed right now. ({error?.message})</p>        )}
        {!isLoading && !isError && visiblePosts.length === 0 && posts.length === 0 && (
          <p className="text-sm text-ink-faint py-8 text-center">
            No posts yet — follow people or write the first one.
          </p>
        )}
        {!isLoading && !isError && visiblePosts.length === 0 && posts.length > 0 && (
          <p className="text-sm text-ink-faint py-8 text-center">
            No posts to show right now. Reload the page to see them again.
          </p>
        )}

        {visiblePosts.map((post) => (
          <PostCard key={getId(post)} post={post} onDismiss={dismissPost} />
        ))}
      </div>

      <div className="hidden lg:flex flex-col gap-5">
        <FriendRequestsWidget />
        <FindPeopleWidget />
      </div>
    </div>
  );
}
