import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState, Empty } from "../StateViewBase.jsx";
import LoginPageHeader from "../common/LoginPageHeader.jsx";
import { useOnlineUsersSet } from "../common/useOnlineUsersSet.js";
import { formatLanguageName } from "../../utils/language/languageDisplay.js";
import { toAvatarSrc } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";

export default function FriendsListPage() {
  const s = useSubscribedState("FriendsListPage", {});
  const onlineIds = useOnlineUsersSet();
  const list = Array.isArray(s.friendsList) ? s.friendsList : [];
  const visible = new Set(Array.isArray(s.visibleFriendIds) ? s.visibleFriendIds : []);
  const rows = list.filter((f) => visible.has(f?.friend_id));
  const initialized = !!s.initialized;
  const loading = !!s.loading;
  const showSkeleton = rows.length === 0 && (!initialized || loading);
  const showEmpty = rows.length === 0 && initialized && !loading;

  return (
    <div className="flex h-full min-h-full flex-col">
      <LoginPageHeader
        title="Friends List"
        right={(
          <button
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
            onClick={() => eventBus.emit("openBlockedFriendsListModal", { from: "ui/friends/header" })}
          >
            Blocked Friends
          </button>
        )}
      />
      <div id="friendslistpage" className="w-full min-h-full p-6">
        {showEmpty ? <Empty text="No friends" /> : null}
        {showSkeleton ? [0, 1, 2].map((n) => (
          <div key={`friend-skeleton-${n}`} className="w-full flex items-center p-3 border-b border-gray-200">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 animate-pulse"></div>
            <div className="ml-3 flex-1">
              <div className="h-4 w-32 rounded bg-gray-200 animate-pulse"></div>
              <div className="h-3 w-24 rounded bg-gray-100 animate-pulse mt-2"></div>
            </div>
          </div>
        )) : null}
        {rows.map((f) => {
          const id = f.friend_id;
          const blocked = !!f.isBlocked;
          const isOnline = onlineIds.has(String(id));
          const detailReady = f?.detailStatus === "ready";

          return (
            <button
              key={String(id)}
              className={blocked
                ? "w-full flex items-center p-3 border-b border-gray-200 bg-gray-50 opacity-70 hover:bg-gray-100 transition cursor-pointer"
                : "relative w-full flex items-center p-3 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer"}
              onClick={() => eventBus.emit("openChatRoom", { user_id: id, from: "ui/friends/item" })}
            >
              {detailReady && f.profilePicUrl ? (
                <div className="relative w-10 h-10 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <AvatarImage src={toAvatarSrc(f.profilePicUrl)} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  {isOnline ? <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-green-500 rounded-full border border-white"></span> : null}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 animate-pulse"></div>
              )}

              <div className="ml-3 flex-1 overflow-hidden text-left">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-gray-900 truncate">{f.friend_name || id}</span>
                  {detailReady ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 whitespace-nowrap">
                      {formatLanguageName(f?.language?.nativelanguage, "-")} → {formatLanguageName(f?.language?.targetlanguage, "-")}
                    </span>
                  ) : (
                    <div className="h-3 w-28 rounded bg-gray-200 animate-pulse"></div>
                  )}
                  {blocked ? (
                    <span className="text-xs text-red-600 font-semibold inline-flex items-center gap-1">
                      <i className="ti ti-ban text-[12px]"></i>
                      <span>Blocked</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-[11px] text-indigo-700 whitespace-nowrap">
                      Friend
                    </span>
                  )}
                </div>
              </div>

              {f?.is_read === false ? (
                <div className="absolute top-1 right-2 bg-yellow-300 text-yellow-800 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow animate-pulse inline-flex items-center gap-1">
                  <i className="ti ti-sparkles text-[11px]"></i>
                  <span>NEW FRIEND</span>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
