import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { UserContext } from "../../context/UserContext";
import * as userService from "../../services/userService";
import * as followService from "../../services/followService";
import * as friendRequestService from "../../services/friendRequestService";
import * as blockService from "../../services/blockService";
import usePosts from "../../Hooks/usePosts";
import { useFollowers, useFollowing } from "../../Hooks/useFollowers";
import PostCard from "../PostCard/PostCard";
import Loader from "../Loader/Loader";
import EditProfileForm from "./EditProfileForm";
import { initials, ensureArray } from "../../utils/constants";
import { extractList } from "../../utils/api";
import { fileUrl } from "../../services/fileService";
import { getId } from "../../utils/api";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData: me } = useContext(UserContext);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("posts");
  const [menuOpen, setMenuOpen] = useState(false);
  const [localFollowing, setLocalFollowing] = useState(null);
  const [localFriendStatus, setLocalFriendStatus] = useState(null);
  const queryClient = useQueryClient();

  const isSelf = !id || id === getId(me);

  useEffect(() => {
    setLocalFollowing(null);
    setLocalFriendStatus(null);
  }, [id]);

  const { data: otherProfile, isLoading: loadingOther } = useQuery({
    queryKey: ["user", id],
    queryFn: () => userService.getUserById(id).then((r) => r.data?.data ?? r.data),
    enabled: !isSelf && !!id,
  });

  const profile = isSelf ? me : otherProfile;

  const { data: followStatusData } = useQuery({
    queryKey: ["follow-status", id],
    queryFn: () => followService.getFollowStatus(id).then((r) => r.data),
    enabled: !isSelf && !!id,
  });

  const isFollowingFromQuery = Boolean(
    followStatusData?.data?.isFollowing ??
    followStatusData?.isFollowing ??
    followStatusData?.data?.following ??
    followStatusData?.following ??
    followStatusData?.data?.isFollow ??
    followStatusData?.isFollow ??
    followStatusData?.data === true
  );

  const isFollowing = localFollowing !== null ? localFollowing : isFollowingFromQuery;

  const { data: myFriendsData } = useQuery({
    queryKey: ["my-friends"],
    queryFn: () => friendRequestService.getMyFriends({ page: 1, size: 100 }).then((r) => r.data),
    enabled: !isSelf && !!id,
  });
  const myFriendsList = ensureArray(myFriendsData, ["friends", "docs"]);
  const isFriendFromList = myFriendsList.some((f) => (f?._id || f?.id || f?.user?._id || f?.friend?._id || f) === id);

  const { data: friendStatusData } = useQuery({
    queryKey: ["friend-status", id],
    queryFn: () => friendRequestService.checkFriendRequestStatus(id).then((r) => r.data),
    enabled: !isSelf && !!id,
  });

  const rawStatus = friendStatusData?.data?.status ?? friendStatusData?.status ?? (typeof friendStatusData?.data === "string" ? friendStatusData?.data : null);
  const isFriendFromProfile = Boolean(
    profile?.isFriend ||
    profile?.isFriends ||
    (Array.isArray(me?.friends) && me.friends.some((f) => (f?._id || f?.id || f) === id)) ||
    (Array.isArray(profile?.friends) && profile.friends.some((f) => (f?._id || f?.id || f) === me?._id))
  );

  let detectedFriendStatus = "none";
  if (
    rawStatus === "friends" ||
    rawStatus === "friend" ||
    rawStatus === "accepted" ||
    isFriendFromList ||
    isFriendFromProfile ||
    friendStatusData?.data?.isFriend ||
    friendStatusData?.isFriend
  ) {
    detectedFriendStatus = "friends";
  } else if (rawStatus === "pending_sent" || rawStatus === "sent" || rawStatus === "pending") {
    detectedFriendStatus = "pending_sent";
  } else if (rawStatus === "pending_received" || rawStatus === "received") {
    detectedFriendStatus = "pending_received";
  }

  const friendStatus = localFriendStatus !== null ? localFriendStatus : detectedFriendStatus;
  const requestId = getId(friendStatusData?.data) ?? friendStatusData?.data?.requestId ?? friendStatusData?.requestId ?? id;

  const { data: postsData, isLoading: loadingPosts } = usePosts();
  const allPosts = extractList(postsData);
  const userPosts = allPosts.filter((p) => getId(p?.user) === (isSelf ? getId(me) : getId(profile)));
  const { data: followersData } = useFollowers({ page: 1, size: 50 }, isSelf && tab === "followers");
  const { data: followingData } = useFollowing({ page: 1, size: 50 }, isSelf && tab === "following");

  function invalidateStatuses() {
    queryClient.invalidateQueries({ queryKey: ["follow-status", id] });
    queryClient.invalidateQueries({ queryKey: ["friend-status", id] });
    queryClient.invalidateQueries({ queryKey: ["my-friends"] });
    queryClient.invalidateQueries({ queryKey: ["user", id] });
  }

  const followMutation = useMutation({
    mutationFn: () => (isFollowing ? followService.unfollowUser(id) : followService.followUser(id)),
    onMutate: () => {
      const willFollow = !isFollowing;
      setLocalFollowing(willFollow);
      return { previousState: isFollowing };
    },
    onError: (err, vars, context) => {
      if (context) setLocalFollowing(context.previousState);
      toast.error(err?.response?.data?.message || "Failed to update follow status");
    },
    onSuccess: () => {
      toast.success(isFollowing ? "Now following" : "Unfollowed");
      invalidateStatuses();
    },
  });

  const addFriendMutation = useMutation({
    mutationFn: () => friendRequestService.sendFriendRequest(id),
    onMutate: () => {
      setLocalFriendStatus("pending_sent");
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "";
      if (msg.toLowerCase().includes("already friends")) {
        setLocalFriendStatus("friends");
        toast.success("You're already friends with this user");
        invalidateStatuses();
      } else {
        setLocalFriendStatus("none");
        toast.error(msg || "Couldn't send friend request");
      }
    },
    onSuccess: () => {
      toast.success("Friend request sent");
      invalidateStatuses();
    },
  });
  const cancelRequestMutation = useMutation({
    mutationFn: () => friendRequestService.cancelFriendRequest(requestId),
    onMutate: () => setLocalFriendStatus("none"),
    onSuccess: () => { toast.success("Request cancelled"); invalidateStatuses(); },
  });
  const acceptRequestMutation = useMutation({
    mutationFn: () => friendRequestService.acceptFriendRequest(requestId),
    onMutate: () => setLocalFriendStatus("friends"),
    onSuccess: () => { toast.success("You're now friends"); invalidateStatuses(); },
  });
  const rejectRequestMutation = useMutation({
    mutationFn: () => friendRequestService.rejectFriendRequest(requestId),
    onMutate: () => setLocalFriendStatus("none"),
    onSuccess: () => { toast.success("Request declined"); invalidateStatuses(); },
  });
  const unfriendMutation = useMutation({
    mutationFn: () => friendRequestService.unfriend(requestId),
    onMutate: () => setLocalFriendStatus("none"),
    onSuccess: () => { toast.success("Removed from friends"); invalidateStatuses(); },
  });

  const blockMutation = useMutation({
    mutationFn: () => blockService.blockUser(id),
    onSuccess: () => { toast.success(`Blocked ${profile?.username}`); navigate("/"); },
  });

  if ((!isSelf && loadingOther) || (isSelf && !profile)) return <Loader />;
  if (!profile) {
    return <p className="text-sm text-ink-faint text-center py-12">Couldn't load this profile.</p>;
  }

  const followers = extractList(followersData);
  const following = extractList(followingData);

  return (
    <div>
      <div className="h-36 sm:h-44 rounded-2xl bg-gradient-to-br from-primary-soft to-border overflow-hidden">
        {profile.profileCoveredPictures?.[0] && (
          <img
            src={fileUrl(profile.profileCoveredPictures[0])}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex items-end gap-4 -mt-10 ml-4">
        <div className="w-24 h-24 rounded-full ring-4 ring-bg overflow-hidden bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-2xl font-semibold">
          {profile.profilePicture ? (
            <img
              src={fileUrl(profile.profilePicture)}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            initials(profile.username)
          )}
        </div>
      </div>
 
      <div className="mt-3 px-1 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">{profile.username}</h1>
          {profile.bio && <p className="text-sm text-ink-soft mt-1">{profile.bio}</p>}
        </div>
 
        {isSelf ? (
          <button
            onClick={() => setEditing((e) => !e)}
            className="border border-border text-sm font-semibold px-4 py-2 rounded-lg flex-shrink-0"
          >
            {editing ? "Close" : "Edit profile"}
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => followMutation.mutate()}
              className={`text-sm font-semibold px-4 py-2 rounded-lg ${
                isFollowing ? "border border-border text-ink-soft" : "bg-primary text-white"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
 
            {friendStatus === "none" && (
              <button onClick={() => addFriendMutation.mutate()} className="border border-border text-sm font-semibold px-4 py-2 rounded-lg">
                Add friend
              </button>
            )}
            {friendStatus === "pending_sent" && (
              <button onClick={() => cancelRequestMutation.mutate()} className="border border-border text-sm font-semibold px-4 py-2 rounded-lg text-ink-faint">
                Requested
              </button>
            )}
            {friendStatus === "pending_received" && (
              <>
                <button onClick={() => acceptRequestMutation.mutate()} className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg">
                  Accept
                </button>
                <button onClick={() => rejectRequestMutation.mutate()} className="border border-border text-sm font-semibold px-4 py-2 rounded-lg">
                  Decline
                </button>
              </>
            )}
            {friendStatus === "friends" && (
              <>
                <button onClick={() => unfriendMutation.mutate()} className="border border-border text-sm font-semibold px-4 py-2 rounded-lg text-primary">
                  Friends ✓
                </button>
                <button
                  onClick={() => navigate(`/chats/user/${id}`)}
                  className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  Message
                </button>
              </>
            )}
 
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="border border-border text-ink-soft px-2.5 py-2 rounded-lg"
              >
                ⋮
              </button>
              {menuOpen && (
                <div onMouseLeave={() => setMenuOpen(false)} className="absolute right-0 top-11 bg-panel border border-border rounded-xl shadow-lg py-1 min-w-[120px] z-10">
                  <button
                    onClick={() => { blockMutation.mutate(); setMenuOpen(false); }}
                    className="w-full text-left text-sm px-3.5 py-2 hover:bg-black/[0.03] text-like"
                  >
                    Block
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
 
      {editing && (
        <div className="mt-5">
          <EditProfileForm onDone={() => setEditing(false)} />
        </div>
      )}
 
      {isSelf && (
        <div className="flex gap-1 border-b border-border mt-6 mb-1">
          {["posts", "followers", "following"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 -mb-px ${
                tab === t ? "border-primary text-primary" : "border-transparent text-ink-faint"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
 
      <div className="mt-4">
        {(!isSelf || tab === "posts") && (
          <>
            {loadingPosts && <Loader />}
            {!loadingPosts && userPosts.length === 0 && (
              <p className="text-sm text-ink-faint text-center py-10">No posts yet.</p>
            )}
            {userPosts.map((post) => (
              <PostCard key={getId(post)} post={post} />
            ))}
          </>
        )}
 
        {isSelf && tab === "followers" && (
          <div className="divide-y divide-border">
            {followers.map((f) => (
              <div key={getId(f)} className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ink-faint to-border text-white flex items-center justify-center text-sm font-semibold">
                  {initials(f.username)}
                </div>
                <p className="font-semibold text-sm">{f.username}</p>
              </div>
            ))}
            {followers.length === 0 && <p className="text-sm text-ink-faint py-6">No followers yet.</p>}
          </div>
        )}
 
        {isSelf && tab === "following" && (
          <div className="divide-y divide-border">
            {following.map((f) => (
              <div key={getId(f)} className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ink-faint to-border text-white flex items-center justify-center text-sm font-semibold">
                  {initials(f.username)}
                </div>
                <p className="font-semibold text-sm">{f.username}</p>
              </div>
            ))}
            {following.length === 0 && <p className="text-sm text-ink-faint py-6">Not following anyone yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
