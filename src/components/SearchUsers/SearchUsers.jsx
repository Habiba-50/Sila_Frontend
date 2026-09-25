import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { searchUsers } from "../../services/userService";
import { followUser, unfollowUser } from "../../services/followService";
import { sendFriendRequest, getMyFriends } from "../../services/friendRequestService";
import toast from "react-hot-toast";
import Loader from "../Loader/Loader";
import { initials, ensureArray } from "../../utils/constants";

export default function SearchUsers() {
  const [term, setTerm] = useState("");
  const [followingMap, setFollowingMap] = useState({});
  const [friendsMap, setFriendsMap] = useState({});
  const queryClient = useQueryClient();

  const { data: myFriendsData } = useQuery({
    queryKey: ["my-friends"],
    queryFn: () => getMyFriends({ page: 1, size: 100 }).then((r) => r.data),
  });
  const myFriendsList = ensureArray(myFriendsData, ["friends", "docs"]);
  const myFriendIds = new Set(myFriendsList.map((f) => f?._id || f?.id || f?.user?._id || f?.friend?._id || f));

  const { data, isFetching } = useQuery({
    queryKey: ["search-users", term],
    queryFn: () => searchUsers(term).then((res) => res.data),
    enabled: term.trim().length > 0,
  });

  const followMutation = useMutation({
    mutationFn: (userId) => {
      const isCurrentlyFollowing = Boolean(followingMap[userId]);
      return isCurrentlyFollowing ? unfollowUser(userId) : followUser(userId);
    },
    onMutate: (userId) => {
      const next = !followingMap[userId];
      setFollowingMap((prev) => ({ ...prev, [userId]: next }));
      return { userId, previous: followingMap[userId] };
    },
    onError: (err, userId, context) => {
      if (context) setFollowingMap((prev) => ({ ...prev, [userId]: context.previous }));
      toast.error("Failed to update follow status");
    },
    onSuccess: (res, userId) => {
      const isNowFollowing = Boolean(followingMap[userId]);
      toast.success(isNowFollowing ? "Following user" : "Unfollowed user");
      queryClient.invalidateQueries({ queryKey: ["search-users"] });
      queryClient.invalidateQueries({ queryKey: ["follow-status", userId] });
    },
  });

  const requestMutation = useMutation({
    mutationFn: (id) => sendFriendRequest(id),
    onError: (err, userId) => {
      const msg = err?.response?.data?.message || "";
      if (msg.toLowerCase().includes("already friends")) {
        setFriendsMap((prev) => ({ ...prev, [userId]: true }));
        queryClient.invalidateQueries({ queryKey: ["my-friends"] });
        toast.success("You're already friends with this user");
      } else {
        toast.error(msg || "Couldn't send friend request");
      }
    },
    onSuccess: () => toast.success("Friend request sent"),
  });

  const results = ensureArray(data, ["users", "docs"]);

  return (
    <div>
      <h1 className="font-display text-[21px] font-semibold mb-4">Search Connectly</h1>
      <input
        autoFocus
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search by name…"
        className="w-full border border-border rounded-xl px-4 py-3 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {isFetching && <Loader full={false} />}

      {!isFetching && term.trim() && results.length === 0 && (
        <p className="text-sm text-ink-faint text-center py-8">No one matched "{term}".</p>
      )}

      <div className="divide-y divide-border">
        {results.map((u) => {
          const isUserFollowing = Boolean(followingMap[u._id] ?? u.isFollowing ?? u.following);
          const isUserFriend = Boolean(friendsMap[u._id] ?? myFriendIds.has(u._id) ?? u.isFriend ?? u.isFriends);
          return (
            <div key={u._id} className="flex items-center gap-3 py-3">
              <Link to={`/profile/${u._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {initials(u.username)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{u.username}</p>
                  {u.email && <p className="text-xs text-ink-faint truncate">{u.email}</p>}
                </div>
              </Link>
              <button
                onClick={() => followMutation.mutate(u._id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                  isUserFollowing
                    ? "border border-border text-ink-soft hover:bg-black/5"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {isUserFollowing ? "Following" : "Follow"}
              </button>
              {isUserFriend ? (
                <span className="border border-border text-primary text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0">
                  Friends ✓
                </span>
              ) : (
                <button
                  onClick={() => requestMutation.mutate(u._id)}
                  className="border border-border text-ink-soft text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 hover:bg-black/5"
                >
                  Add friend
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
