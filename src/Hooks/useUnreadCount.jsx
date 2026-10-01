import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "../services/notificationService";

export default function useUnreadCount(enabled, userId) {
  return useQuery({
    queryKey: ["unread-count", userId],
    queryFn: () => getUnreadCount().then((res) => res.data?.data?.count ?? res.data?.count ?? 0),
    enabled: enabled && !!userId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
}
