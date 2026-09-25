import { useQuery } from "@tanstack/react-query";
import { getFollowers, getFollowing } from "../services/followService";

export function useFollowers(params, enabled = true) {
  return useQuery({
    queryKey: ["followers", params],
    queryFn: () => getFollowers(params).then((r) => r.data),
    enabled,
  });
}

export function useFollowing(params, enabled = true) {
  return useQuery({
    queryKey: ["following", params],
    queryFn: () => getFollowing(params).then((r) => r.data),
    enabled,
  });
}
