import { useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createPost } from "../../services/postService";
import { UserContext } from "../../context/UserContext";
import Avatar from "../Avatar/Avatar";
import MentionInput from "../MentionInput/MentionInput";

export default function CreatePost() {
  const { userData } = useContext(UserContext);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [image, setImage] = useState(null);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("content", content);
      tags.forEach((friend) => formData.append("tags", friend.id));
      if (image) formData.append("attachments", image);
      return createPost(formData);
    },
    onSuccess: () => {
      setContent("");
      setTags([]);
      setImage(null);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Couldn't publish your post.");
    },
  });

  return (
    <div className="bg-panel border border-border rounded-2xl p-4 sm:p-4.5 mb-5">
      <div className="flex gap-3">
        <Avatar user={userData} size={40} />
        <MentionInput
          value={content}
          onChange={setContent}
          onTagsChange={setTags}
          placeholder="Share something with your circle… Type @ to tag a friend"
          rows={2}
          className="flex-1 min-w-0"
          inputClassName="w-full resize-none border-none outline-none text-[15.5px] pt-1.5 bg-transparent"
        />
      </div>

      {image && (
        <div className="relative mt-2 ml-[52px] inline-block">
          <img
            src={URL.createObjectURL(image)}
            alt="Upload preview"
            className="h-28 w-28 object-cover rounded-xl border border-border shadow-sm"
          />
          <button
            type="button"
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-black/70 hover:bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors"
            title="Remove image"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mt-2 pt-3 border-t border-border">
        <label className="text-sm font-medium text-ink-soft border border-border rounded-lg px-4 py-2 cursor-pointer hover:bg-black/[0.03]">
          📷 Add photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </label>
        <button
          disabled={(!content.trim() && !image) || isPending}
          onClick={() => mutate()}
          className="bg-primary text-white font-semibold text-sm rounded-lg px-5 py-2 disabled:opacity-50"
        >
          {isPending ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
