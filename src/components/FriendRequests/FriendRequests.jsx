import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as friendRequestService from "../../services/friendRequestService";
import Loader from "../Loader/Loader";
import Avatar from "../Avatar/Avatar";
import { extractList, getId } from "../../utils/api";

export default function FriendRequests() {
  const [tab, setTab] = useState("received");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["friend-requests", tab],
    queryFn: () =>
      (tab === "received"
        ? friendRequestService.getRequestsReceived({ page: 1, size: 20 })
        : friendRequestService.getRequestsSent({ page: 1, size: 20 })
      ).then((r) => r.data),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
  }

  const accept = useMutation({ mutationFn: friendRequestService.acceptFriendRequest, onSuccess: invalidate });
  const reject = useMutation({ mutationFn: friendRequestService.rejectFriendRequest, onSuccess: invalidate });
  const cancel = useMutation({ mutationFn: friendRequestService.cancelFriendRequest, onSuccess: invalidate });

  const requests = extractList(data);

  return (
    <div>
      <h1 className="font-display text-[21px] font-semibold mb-4">Friend requests</h1>

      <div className="flex gap-1 border-b border-border mb-4">
        {["received", "sent"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 -mb-px ${
              tab === t ? "border-primary text-primary" : "border-transparent text-ink-faint"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading && <Loader />}
      {!isLoading && requests.length === 0 && (
        <p className="text-sm text-ink-faint text-center py-10">Nothing here.</p>
      )}

      <div className="divide-y divide-border">
        {requests.map((r) => {
          const person = tab === "received"
            ? (r.senderId ?? r.sender)
            : (r.receiverId ?? r.receiver);
          const personId = getId(person);
          const personName = person?.username || [person?.firstName, person?.lastName].filter(Boolean).join(" ").trim() || person?.email || "Someone";
          return (
            <div key={getId(r)} className="flex items-center gap-3 py-3">
              {personId ? (
                <Link to={`/profile/${personId}`} className="flex items-center gap-3 flex-1 min-w-0 hover:text-primary" aria-label={`View ${personName}'s profile`}>
                  <Avatar user={person} size={40} />
                  <span className="font-semibold text-sm truncate">{personName}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar user={person} size={40} />
                  <span className="font-semibold text-sm truncate">{personName}</span>
                </div>
              )}

              {tab === "received" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => accept.mutate(getId(r))}
                    className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => reject.mutate(getId(r))}
                    className="border border-border text-ink-soft text-xs font-semibold px-3 py-1.5 rounded-lg"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => cancel.mutate(getId(r))}
                  className="border border-border text-ink-soft text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
