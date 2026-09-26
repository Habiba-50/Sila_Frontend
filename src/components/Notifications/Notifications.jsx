import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationService from "../../services/notificationService";
import Loader from "../Loader/Loader";
import { describeNotification, ensureArray } from "../../utils/constants";
import { extractList } from "../../utils/api";
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
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      notificationService
        .getNotifications({ page: 1, limit: 20 })
        .then((r) => r.data),
  });

  const markAllRead = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = extractList(data);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-[21px] font-semibold">
          Notifications
        </h1>
        <button
          onClick={() => markAllRead.mutate()}
          className="text-sm font-semibold text-primary"
        >
          Mark all as read
        </button>
      </div>

      {isLoading && <Loader />}

      {!isLoading && notifications.length === 0 && (
        <p className="text-sm text-ink-faint text-center py-10">
          You're all caught up.
        </p>
      )}

      <div className="divide-y divide-border">
        {notifications.map((n) => (
          <div
            key={n._id}
            className={`flex items-start gap-3 py-3.5 ${!n.isRead ? "bg-primary-soft/40 -mx-3 px-3 rounded-lg" : ""}`}
          >
            <span className="text-lg flex-shrink-0 leading-none mt-0.5">
              {describeNotification(n).icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{describeNotification(n).text}</p>
              <p className="text-xs text-ink-faint mt-0.5">
                {timeAgo(n.createdAt)}
              </p>
            </div>
            <button
              onClick={() => remove.mutate(n._id)}
              className="text-xs text-ink-faint hover:text-like flex-shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
