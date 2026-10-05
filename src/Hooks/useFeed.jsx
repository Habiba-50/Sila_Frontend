import { useQuery } from "@tanstack/react-query";
import { getFeed } from "../services/postService";

export default function useFeed(params) {
  return useQuery({
    queryKey: ["posts", "feed", params],
    queryFn: async () => {
      const response = await getFeed(params);
      const docs = response.data.data.docs ?? [];

      // Deduplicate by unique post id to guard against backend returning the
      // same post more than once (e.g. as both an original and a repost entry).
      const seen = new Set();
      return docs.filter((post) => {
        const id = post?._id ?? post?.id;
        if (!id || seen.has(String(id))) return false;
        seen.add(String(id));
        return true;
      });
    },
  });
}
