import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState, Empty } from "../StateViewBase.jsx";
import LoginPageHeader from "../common/LoginPageHeader.jsx";
import { useOnlineUsersSet } from "../common/useOnlineUsersSet.js";
import { formatLanguageName } from "../../utils/language/languageDisplay.js";
import { toAvatarSrc } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";
import { formatChatListDate } from "../../utils/dateTimeFormat.js";

export default function MessagesPage() {
  const s = useSubscribedState("MessagesPage", {});
  const onlineIds = useOnlineUsersSet();
  const list = Array.isArray(s.conversations) ? s.conversations : [];
  const visible = new Set(Array.isArray(s.visibleConversationIds) ? s.visibleConversationIds : []);
  const rows = list.filter((x) => visible.has(x?.other_user?.user_id));
  const initialized = !!s.initialized;
  const loading = !!s.loading;
  const showSkeleton = rows.length === 0 && (!initialized || loading);
  const showEmpty = rows.length === 0 && initialized && !loading;

  return (
    <div className="flex h-full min-h-full flex-col">
      <LoginPageHeader
        title="Messages"
        right={(
          <button
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
            onClick={() => eventBus.emit("openBlockedUsersListModal", { from: "ui/messages/header" })}
          >
            Blocked Users
          </button>
        )}
      />
      <div id="messagesContainer" className="flex-1 overflow-y-auto">
        {showEmpty ? <div className="p-4"><Empty text="No conversations" /></div> : null}
        {showSkeleton ? [0, 1, 2].map((n) => (
          <div key={`message-skeleton-${n}`} className="flex w-full items-center p-3 border-b border-gray-200">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 animate-pulse"></div>
            <div className="ml-3 flex-1">
              <div className="h-4 w-32 rounded bg-gray-200 animate-pulse"></div>
              <div className="h-3 w-48 rounded bg-gray-100 animate-pulse mt-2"></div>
            </div>
            <div className="h-3 w-10 rounded bg-gray-100 animate-pulse"></div>
          </div>
        )) : null}
        {rows.map((conv, idx) => {
          const uid = conv?.other_user?.user_id || `unknown-${idx}`;
          const username = conv?.other_user?.username || uid;
          const profile = toAvatarSrc(conv?.profilePicUrl);
          const msg = conv?.messageText || "";
          const unread = conv?.sender_id === uid && conv?.is_read !== 1;
          const fromSelf = conv?.sender_id && conv?.sender_id !== uid;
          const blocked = !!conv?.isBlocked;
          const isOnline = onlineIds.has(String(uid));
          const detailReady = conv?.detailStatus === "ready";

          return (
            <button
              key={uid}
              className={blocked
                ? "flex w-full items-center p-3 border-b border-gray-200 bg-gray-50 opacity-70 hover:bg-gray-100 transition cursor-pointer"
                : "flex w-full items-center p-3 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer"}
              onClick={() => eventBus.emit("openChatRoom", { user_id: uid, from: "ui/messages/item" })}
            >
              {detailReady && profile ? (
                <div className="relative w-10 h-10 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <AvatarImage src={profile} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  {isOnline ? <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-green-500 rounded-full border border-white"></span> : null}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 animate-pulse"></div>
              )}

              <div className="ml-3 flex-1 overflow-hidden text-left">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{username}</div>
                  {detailReady && conv?.language ? (
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 whitespace-nowrap">
                      {formatLanguageName(conv.language.nativelanguage, "-")} → {formatLanguageName(conv.language.targetlanguage, "-")}
                    </div>
                  ) : (
                    <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                  )}
                </div>

                {blocked ? (
                  <div className="text-sm text-red-600 font-semibold truncate inline-flex items-center gap-1">
                    <i className="ti ti-ban text-sm"></i>
                    <span>Blocked</span>
                  </div>
                ) : (
                  <div className={unread ? "text-sm font-semibold text-gray-900 truncate" : "text-sm text-gray-500 truncate"}>{msg}</div>
                )}
              </div>

              <div className="ml-2 flex items-center gap-1 whitespace-nowrap">
                {fromSelf ? <span className="text-xs text-indigo-500">↗</span> : null}
                <div className="text-xs text-gray-400">{formatChatListDate(conv?.timestamp)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
