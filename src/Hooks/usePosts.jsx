import { useQuery } from "@tanstack/react-query";
import { getPosts } from "../services/postService";

export default function usePosts(params) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => getPosts(params).then((res) => res.data.docs),
  });
}
