import React, { useEffect } from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState, Empty } from "../StateViewBase.jsx";
import LoginPageHeader from "../common/LoginPageHeader.jsx";
import { useOnlineUsersSet } from "../common/useOnlineUsersSet.js";
import { formatLanguageName } from "../../utils/language/languageDisplay.js";
import { toAvatarSrc } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";

export default function FriendRequestsPage() {
  const s = useSubscribedState("FriendRequestsPage", {});
  const onlineIds = useOnlineUsersSet();
  const list = Array.isArray(s.friendRequests) ? s.friendRequests : [];
  const visible = new Set(Array.isArray(s.visibleRequestIds) ? s.visibleRequestIds : []);
  const rows = list.filter((x) => visible.has(x?.sender_id));
  const initialized = !!s.friendRequestsInitialized;
  const canScrollLeft = !!s.canScrollLeft;
  const canScrollRight = !!s.canScrollRight;
  const loadingMore = !!s.loadingFriendRequestCardLock;
  const showInitSkeleton = !initialized && rows.length === 0;
  const showEmpty = initialized && rows.length === 0 && !loadingMore;

  useEffect(() => {
    eventBus.emit("friendRequests:refreshScrollState", { from: "ui/friendRequests/effect" });
  }, [rows.length]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <LoginPageHeader title="Friend Requests" />
      <div className="relative h-[calc(100vh-7rem)] min-h-0 max-h-[calc(100vh-7rem)]">
        <button
          type="button"
          aria-label="Scroll left"
          aria-disabled={!canScrollLeft}
          className={`absolute left-2 top-1/2 z-20 -translate-y-1/2 w-10 h-10 rounded-full border shadow flex items-center justify-center text-xl leading-none ${canScrollLeft ? "bg-white text-gray-700 hover:bg-gray-100" : "bg-gray-100 text-gray-300 opacity-70"}`}
          onClick={() => eventBus.emit("friendRequests:scrollLeft", { from: "ui/friendRequests/left" })}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          aria-disabled={!canScrollRight}
          className={`absolute right-2 top-1/2 z-20 -translate-y-1/2 w-10 h-10 rounded-full border shadow flex items-center justify-center text-xl leading-none ${canScrollRight ? "bg-white text-gray-700 hover:bg-gray-100" : "bg-gray-100 text-gray-300 opacity-70"}`}
          onClick={() => eventBus.emit("friendRequests:scrollRight", { from: "ui/friendRequests/right" })}
        >
          ›
        </button>
        <div
          id="friendRequestsContainer"
          className="h-full min-h-0 max-h-full overflow-x-auto overflow-y-hidden hide-scrollbar snap-x snap-mandatory whitespace-nowrap px-12 scroll-smooth flex items-center"
        >
        {showEmpty ? <Empty text="No requests" /> : null}
        {rows.map((req, idx) => {
        const id = req?.sender_id || `req-${idx}`;
        const name = req?.sender_name || req?.username || id;
        const profile = req?.profilePicUrl;
        const isOnline = onlineIds.has(String(id));
        const detailReady = req?.detailStatus === "ready" || req?.detailStatus === "error";
        const nativeLang = formatLanguageName(req?.language?.nativelanguage || req?.nativelanguage || "?", "?");
        const targetLang = formatLanguageName(req?.language?.targetlanguage || req?.targetlanguage || "?", "?");

      const isRemoving = req?.actionStatus === "removing";

      return (
          <div
            key={id}
            className={`relative inline-block p-6 bg-white rounded-2xl shadow m-4 snap-center flex flex-col items-center justify-between border border-gray-200 transition-all duration-300 ease-out ${isRemoving ? "opacity-0 scale-95 -translate-y-2 pointer-events-none" : "opacity-100 scale-100 translate-y-0"}`}
          >
            {req?.is_read === false ? (
              <div className="absolute top-2 right-3 bg-yellow-300 text-yellow-800 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow animate-pulse inline-flex items-center gap-1">
                <i className="ti ti-sparkles text-[11px]"></i>
                <span>NEW</span>
              </div>
            ) : null}

            <div className="relative w-24 h-24 mt-6">
              <div className="w-24 h-24 rounded-full overflow-hidden">
              {detailReady ? (
                <AvatarImage src={toAvatarSrc(profile)} alt={`${name} avatar`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              )}
              </div>
              {detailReady && isOnline ? <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border border-white"></span> : null}
            </div>

            <button className="text-lg font-semibold mt-4" onClick={() => eventBus.emit("openUserPage", { author_id: id, from: "ui/friendRequests/name" })}>
              {name}
            </button>

            {detailReady ? (
              <div className="text-sm text-gray-500">
                Native: {nativeLang} → Target: {targetLang}
              </div>
            ) : (
              <div className="h-4 w-44 rounded bg-gray-200 animate-pulse mt-1" />
            )}

            <div className="flex gap-4 my-6">
              {(() => {
                const status = req?.actionStatus || "idle";
                const isLoading = status === "loading";
                const isError = status === "error";
                const isAccepted = status === "accepted" || status === "removing";
                return (
              <button
                className={`px-4 py-2 rounded-xl text-white font-medium transition min-w-24 flex items-center justify-center ${isError ? "bg-red-600 hover:bg-red-700" : isAccepted ? "bg-emerald-600" : "bg-green-600 hover:bg-green-700"} ${isLoading || isAccepted ? "opacity-80 cursor-not-allowed" : ""}`}
                disabled={isLoading || isAccepted}
                onClick={() => eventBus.emit("acceptFriendRequest", { target_id: id, from: "ui/friendRequests/accept" })}
              >
                {isLoading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : isError ? (
                  "Retry"
                ) : isAccepted ? (
                  "Accepted"
                ) : (
                  "Accept"
                )}
              </button>
                );
              })()}
            </div>
          </div>
        );
      })}
        {loadingMore || showInitSkeleton ? [0, 1, 2].map((n) => (
          <div key={`friend-request-skeleton-${n}`} className="relative inline-block p-6 bg-white rounded-2xl shadow m-4 snap-center flex flex-col items-center justify-between border border-gray-200">
            <div className="w-24 h-24 rounded-full overflow-hidden mt-6">
              <div className="w-full h-full bg-gray-200 animate-pulse" />
            </div>
            <div className="h-6 w-24 rounded bg-gray-200 animate-pulse mt-4" />
            <div className="h-4 w-44 rounded bg-gray-200 animate-pulse mt-2" />
            <div className="my-6 h-10 w-28 rounded-xl bg-gray-200 animate-pulse" />
          </div>
        )) : null}
        </div>
      </div>
    </div>
  );
}
