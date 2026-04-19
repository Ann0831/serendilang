import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState, Empty } from "../StateViewBase.jsx";
import LoginPageHeader from "../common/LoginPageHeader.jsx";
import { formatLanguageName } from "../../utils/language/languageDisplay.js";
import { toAvatarSrc } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";

export default function OnlineUsersFullscreen() {
  const s = useSubscribedState("OnlineUsersFullscreen", {});
  const list = Array.isArray(s.list) ? s.list : [];
  const initialized = !!s.initialized;
  const loading = !!s.loading;
  const showSkeleton = list.length === 0 && (!initialized || loading);
  const showEmpty = list.length === 0 && initialized && !loading;

  return (
    <div className="flex h-full min-h-full flex-col">
      <LoginPageHeader title="Online Users" />
      <div id="onlineUsersPageContainer" className="flex-1 overflow-y-auto p-4 space-y-2">
        {showEmpty ? <Empty text="No online users" /> : null}
        {showSkeleton ? [0, 1, 2].map((n) => (
          <div key={`online-page-skeleton-${n}`} className="w-full flex items-center space-x-2 rounded-md p-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="min-w-0 flex-1">
              <div className="h-3.5 w-20 rounded bg-gray-200 animate-pulse"></div>
              <div className="h-3 w-36 rounded bg-gray-100 animate-pulse mt-2"></div>
            </div>
          </div>
        )) : null}
        {list.map((u) => (
          <button
            key={u.userId}
            className="online-user w-full flex items-center space-x-2 rounded-md p-2 hover:bg-gray-200 transition cursor-pointer text-left"
            onClick={() => eventBus.emit("openChatRoom", { user_id: u.userId, from: "ui/online/fullscreen" })}
          >
            <span className="relative w-8 h-8 flex-shrink-0">
              <AvatarImage
                src={toAvatarSrc(u.profilePicture)}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-green-500 rounded-full border border-white"></span>
            </span>
            <span className="min-w-0 flex items-center gap-2">
              <span className="username truncate text-sm text-gray-900 font-medium">{u.username || u.userId}</span>
              <span className="languages inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 whitespace-nowrap">
                {formatLanguageName(u.nativelanguage, "-")} → {formatLanguageName(u.targetlanguage, "-")}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
