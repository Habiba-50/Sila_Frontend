import { useQuery } from "@tanstack/react-query";
import { getFeed } from "../services/postService";

export default function useFeed(params) {
  return useQuery({
    queryKey: ["posts", "feed", params],
    queryFn: async () => {
      const response = await getFeed(params);
      return response.data.data.docs;
    },
  });
}
