import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "../services/notificationService";

export default function useUnreadCount(enabled) {
  return useQuery({
    queryKey: ["unread-count"],
    queryFn: () => getUnreadCount().then((res) => res.data),
    enabled,
    refetchInterval: 30000,
    select: (data) => data?.data?.count ?? data?.count ?? 0,
  });
}
