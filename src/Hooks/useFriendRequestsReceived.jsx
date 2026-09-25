import { useQuery } from "@tanstack/react-query";
import { getRequestsReceived } from "../services/friendRequestService";

export default function useFriendRequestsReceived(params) {
  return useQuery({
    queryKey: ["friend-requests-received", params],
    queryFn: () => getRequestsReceived(params).then((res) => res.data),
  });
}
