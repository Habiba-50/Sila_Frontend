import { useQuery } from "@tanstack/react-query";
import { getPosts } from "../services/postService";

export default function usePosts(params) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: async () => {
      const res = await getPosts(params);
      return res.data.data.docs;
    },
  });
}