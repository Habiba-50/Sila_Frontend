import { useQuery } from "@tanstack/react-query";
import { getMySavedPosts } from "../../services/bookmarkService";
import PostCard from "../PostCard/PostCard";
import Loader from "../Loader/Loader";
import { ensureArray } from "../../utils/constants";

export default function Bookmarks() {
  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => getMySavedPosts().then((r) => r.data),
  });

  const list = ensureArray(data, ["bookmarks", "docs"]);
  const posts = list.map((b) => b.post || b);

  return (
    <div>
      <h1 className="font-display text-[21px] font-semibold mb-4">Saved posts</h1>
      {isLoading && <Loader />}
      {!isLoading && posts.length === 0 && (
        <p className="text-sm text-ink-faint text-center py-10">Nothing saved yet.</p>
      )}
      {posts.map((post) => (
        <PostCard key={post._id} post={{ ...post, isBookmarked: true }} />
      ))}
    </div>
  );
}
