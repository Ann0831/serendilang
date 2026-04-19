import React, { useEffect } from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState, Empty } from "../StateViewBase.jsx";
import LoginPageHeader from "../common/LoginPageHeader.jsx";
import { useOnlineUsersSet } from "../common/useOnlineUsersSet.js";
import { formatLanguageName } from "../../utils/language/languageDisplay.js";
import { toAvatarSrc } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";

export default function PotentialFriendsPage() {
  const s = useSubscribedState("PotentialFriendsPage", {});
  const onlineIds = useOnlineUsersSet();
  const list = Array.isArray(s.potentialFriends) ? s.potentialFriends : [];
  const visible = new Set(Array.isArray(s.visiblePotentialFriendIds) ? s.visiblePotentialFriendIds : []);
  const rows = list.filter((x) => visible.has(x?.user_id));
  const initialized = !!s.potentialFriendsInitialized;
  const canScrollLeft = !!s.canScrollLeft;
  const canScrollRight = !!s.canScrollRight;
  const loadingMore = !!s.loadingPotentialFriendCardLock;
  const showInitSkeleton = !initialized && rows.length === 0;
  const showEmpty = initialized && rows.length === 0 && !loadingMore;

  useEffect(() => {
    eventBus.emit("potentialFriends:refreshScrollState", { from: "ui/potential/effect" });
  }, [rows.length]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <LoginPageHeader title="Potential Friends" />
      <div className="relative h-[calc(100vh-7rem)] min-h-0 max-h-[calc(100vh-7rem)]">
        <button
          type="button"
          aria-label="Scroll left"
          aria-disabled={!canScrollLeft}
          className={`absolute left-2 top-1/2 z-20 -translate-y-1/2 w-10 h-10 rounded-full border shadow flex items-center justify-center text-xl leading-none ${canScrollLeft ? "bg-white text-gray-700 hover:bg-gray-100" : "bg-gray-100 text-gray-300 opacity-70"}`}
          onClick={() => eventBus.emit("potentialFriends:scrollLeft", { from: "ui/potential/left" })}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          aria-disabled={!canScrollRight}
          className={`absolute right-2 top-1/2 z-20 -translate-y-1/2 w-10 h-10 rounded-full border shadow flex items-center justify-center text-xl leading-none ${canScrollRight ? "bg-white text-gray-700 hover:bg-gray-100" : "bg-gray-100 text-gray-300 opacity-70"}`}
          onClick={() => eventBus.emit("potentialFriends:scrollRight", { from: "ui/potential/right" })}
        >
          ›
        </button>
        <div
          id="potentialfriendsContainer"
          className="h-full min-h-0 max-h-full overflow-x-auto overflow-y-hidden hide-scrollbar snap-x snap-mandatory whitespace-nowrap px-12 scroll-smooth flex items-center"
        >
        {showEmpty ? <Empty text="No potential friends" /> : null}
        {rows.map((u, idx) => {
        const id = u?.user_id || `u-${idx}`;
        const name = u?.username || id;
        const isOnline = onlineIds.has(String(id));
        const nativeLang = formatLanguageName(u?.language?.nativelanguage || u?.nativelanguage || "?", "?");
        const targetLang = formatLanguageName(u?.language?.targetlanguage || u?.targetlanguage || "?", "?");

      return (
          <div
            key={id}
            className={`relative inline-block p-6 bg-white rounded-2xl shadow m-4 snap-center flex flex-col items-center justify-between border border-gray-200 transition-all duration-300 ease-out ${u?.actionStatus === "removing" ? "opacity-0 scale-95 -translate-y-2 pointer-events-none" : "opacity-100 scale-100 translate-y-0"}`}
          >
            <div className="relative w-24 h-24 mt-6">
              <div className="w-24 h-24 rounded-full overflow-hidden">
                {u?.detailStatus === "ready" || u?.detailStatus === "error" ? (
                  <AvatarImage src={toAvatarSrc(u?.profilePicUrl)} alt={`${name} avatar`} className="w-full h-full object-cover" />
                ) : (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              )}
              </div>
              {(u?.detailStatus === "ready" || u?.detailStatus === "error") && isOnline ? <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border border-white"></span> : null}
            </div>

            <button className="text-lg font-semibold mt-4" onClick={() => eventBus.emit("openUserPage", { author_id: id, from: "ui/potential/name" })}>
              {name}
            </button>

            {u?.detailStatus === "ready" || u?.detailStatus === "error" ? (
              <div className="text-sm text-gray-500">
                Native: {nativeLang} → Target: {targetLang}
              </div>
            ) : (
              <div className="h-4 w-44 rounded bg-gray-200 animate-pulse mt-1" />
            )}

            {(() => {
              const status = u?.actionStatus || "idle";
              const isLoading = status === "loading";
              const isError = status === "error";
              const isSent = status === "sent" || status === "removing";
              return (
                <button
                  className={`my-6 px-4 py-2 rounded-xl text-white font-medium transition min-w-28 flex items-center justify-center ${isError ? "bg-red-600 hover:bg-red-700" : isSent ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"} ${isLoading || isSent ? "opacity-80 cursor-not-allowed" : ""}`}
                  disabled={isLoading || isSent}
                  onClick={() => eventBus.emit("sendFriendRequest", { target_id: id, from: "ui/potential/add" })}
                >
                  {isLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : isError ? (
                    "Retry"
                  ) : isSent ? (
                    "Sent"
                  ) : (
                    "Add Friend"
                  )}
                </button>
              );
            })()}
          </div>
        );
      })}
        {loadingMore || showInitSkeleton ? [0, 1, 2].map((n) => (
          <div key={`potential-skeleton-${n}`} className="relative inline-block p-6 bg-white rounded-2xl shadow m-4 snap-center flex flex-col items-center justify-between border border-gray-200">
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
