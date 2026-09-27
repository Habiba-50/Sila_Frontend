import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as blockService from "../../services/blockService";
import Loader from "../Loader/Loader";
import { initials, ensureArray } from "../../utils/constants";
import { getId } from "../../utils/api";

export default function BlockedUsers() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: () => blockService.getBlockedUsers().then((r) => r.data),
  });

  const unblock = useMutation({
    mutationFn: (id) => blockService.unblockUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blocked-users"] }),
  });

  const blocked = extractList(data);

  return (
    <div>
      <h1 className="font-display text-[21px] font-semibold mb-4">Blocked accounts</h1>
      {isLoading && <Loader />}
      {!isLoading && blocked.length === 0 && (
        <p className="text-sm text-ink-faint text-center py-10">You haven't blocked anyone.</p>
      )}
      <div className="divide-y divide-border">
        {blocked.map((u) => (
          <div key={getId(u)} className="flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ink-faint to-border text-white flex items-center justify-center text-sm font-semibold">
              {initials(u.username)}
            </div>
            <p className="font-semibold text-sm flex-1">{u.username}</p>
            <button
              onClick={() => unblock.mutate(getId(u))}
              className="border border-border text-ink-soft text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              Unblock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
