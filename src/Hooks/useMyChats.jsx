import { useQuery } from "@tanstack/react-query";
import { getMyChats } from "../services/chatService";

export default function useMyChats(params) {
  return useQuery({
    queryKey: ["my-chats", params],
    queryFn: () => getMyChats(params).then((r) => r.data),
  });
}
