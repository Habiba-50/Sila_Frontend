import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationService from "../../services/notificationService";
import Loader from "../Loader/Loader";
import { describeNotification } from "../../utils/constants";
import { extractList, getId } from "../../utils/api";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications({ page: 1, limit: 20 }).then((r) => r.data),
  });

    const markAllRead = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
    onError: (error) => {
      console.error("mark-all-as-read failed:", error?.response?.status, error?.response?.data || error);
    },
  });

  const remove = useMutation({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },  
  });

  const notifications = extractList(data);

  useEffect(() => {
    if (notifications.some((notification) => !notification.isRead) && !markAllRead.isPending) {
      markAllRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, markAllRead.isPending]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-[21px] font-semibold">Notifications</h1>
        {/* <button
          onClick={() => markAllRead.mutate()}
          className="text-sm font-semibold text-primary"
        >
          Mark all as read
        </button> */}
      </div>

      {isLoading && <Loader />}

      {!isLoading && notifications.length === 0 && (
        <p className="text-sm text-ink-faint text-center py-10">You're all caught up.</p>
      )}

      <div className="divide-y divide-border">
        {notifications.map((n) => {
          const isIncomingFriendRequest = n.type === "FRIEND_REQUEST" && n.friendRequestStatus === "PENDING";
          const postId = typeof n.postId === "string" ? n.postId : getId(n.postId);
          const canOpenProfile = ["FOLLOW", "FRIEND_REQUEST"].includes(n.type) && n.sender?.id;
          const canOpen = Boolean(postId || canOpenProfile);
          return (
            <div
              key={getId(n)}
              className={`flex items-start gap-3 py-3.5 ${!n.isRead ? "bg-primary-soft/40 -mx-3 px-3 rounded-lg" : ""}`}
            >
              <span className="text-lg flex-shrink-0 leading-none mt-0.5">{describeNotification(n).icon}</span>
              <button
                type="button"
                disabled={!canOpen}
                onClick={() => {
                  if (postId) {
                    navigate(`/post/${postId}`);
                  } else if (canOpenProfile) {
                    navigate(`/profile/${n.sender.id}`, {
                      state: { friendRequestId: isIncomingFriendRequest ? n.requestId : undefined },
                    });
                  }
                }}
                className={`flex-1 min-w-0 text-left ${canOpen ? "cursor-pointer hover:text-primary" : "cursor-default"}`}
              >
                <p className="text-sm">{n.text || describeNotification(n).text}</p>
                <p className="text-xs text-ink-faint mt-0.5">{timeAgo(n.createdAt)}</p>
              </button>
              <button onClick={() => remove.mutate(getId(n))} className="text-xs text-ink-faint hover:text-like flex-shrink-0">
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
