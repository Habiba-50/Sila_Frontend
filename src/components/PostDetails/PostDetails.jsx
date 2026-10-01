import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import * as postService from "../../services/postService";
import { extractItem } from "../../utils/api";
import Loader from "../Loader/Loader";
import PostCard from "../PostCard/PostCard";

export default function PostDetails() {
  const { id } = useParams();
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["post", id],
    queryFn: () => postService.getPost(id).then((response) => extractItem(response.data)),
    enabled: !!id,
  });

  if (isLoading) return <Loader />;
  if (isError || !post) {
    return <p className="text-sm text-ink-faint text-center py-12">This post isn't available.</p>;
  }

  return (
    <div className="pt-4">
      <h1 className="font-display text-[21px] font-semibold mb-4">Post</h1>
      <div className="bg-panel border border-border rounded-2xl px-4 sm:px-5 py-5">
        <PostCard post={post} />
      </div>
    </div>
  );
}
