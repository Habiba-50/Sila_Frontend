import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "../services/notificationService";

export default function useUnreadCount(enabled) {
  return useQuery({
    queryKey: ["unread-count"],
    queryFn: () => getUnreadNotifications({ page: 1, size: 50 }).then((res) => res.data),
    enabled,
    refetchInterval: 30000,
    select: (data) => extractList(data).filter((n) => n.type !== "NEW_LOGIN").length,
  });
}
