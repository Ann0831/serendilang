import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState, Empty } from "../StateViewBase.jsx";
import { useOnlineUsersSet } from "../common/useOnlineUsersSet.js";
import { formatLanguageName } from "../../utils/language/languageDisplay.js";
import { toAvatarSrc } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";

function getLocale() {
  if (typeof navigator !== "undefined" && typeof navigator.language === "string") {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("zh")) return "zh";
  }
  return "en";
}

const TEXT = {
  en: {
    unknown: "Unknown",
    blockedBadge: "Blocked",
    unblock: "Unblock",
    blockedUsers: "Blocked Users",
    blockedFriends: "Blocked Friends",
    emptyBlockedUsers: "You haven't blocked anyone.",
    emptyBlockedFriends: "No blocked friends found.",
    fetchFailed: "Fetch failed",
  },
  zh: {
    unknown: "未知",
    blockedBadge: "已封鎖",
    unblock: "解除封鎖",
    blockedUsers: "封鎖名單",
    blockedFriends: "被封鎖好友",
    emptyBlockedUsers: "你目前沒有封鎖任何人。",
    emptyBlockedFriends: "找不到被封鎖好友。",
    fetchFailed: "抓取失敗",
  },
};

function BlockedUserRow({ user, isOnline, text }) {
  const userId = user?.friend_id;
  const userName = user?.friend_name || userId || text.unknown;
  const profileUrl = toAvatarSrc(user?.profilePicUrl);

  return (
    <div
      className="w-full flex items-center p-3 border-b border-gray-200 bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => eventBus.emit("openChatRoom", { user_id: userId, from: "blockedUsersPage/item" })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          eventBus.emit("openChatRoom", { user_id: userId, from: "blockedUsersPage/item/keyboard" });
        }
      }}
    >
      <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
        <AvatarImage src={profileUrl} alt="avatar" className="w-full h-full object-cover" />
        {isOnline ? <span className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border border-white"></span> : null}
      </div>

      <div className="ml-3 flex-1 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-gray-900 truncate">{userName}</span>
          <span className="text-xs text-red-600 font-semibold flex-shrink-0 inline-flex items-center gap-1">
            <i className="ti ti-ban text-[12px]"></i>
            <span>{text.blockedBadge}</span>
          </span>
        </div>
        <div className="text-xs text-gray-500 whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            <i className="ti ti-language text-[12px]"></i>
            <span>{formatLanguageName(user?.language?.nativelanguage, "-")} → {formatLanguageName(user?.language?.targetlanguage, "-")}</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        className="ml-2 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
        onClick={(e) => {
          e.stopPropagation();
          eventBus.emit("openUnblockUserModal", {
            target_id: userId,
            target_name: userName,
            from: "blockedUsersPage/unblock",
          });
        }}
      >
        <span className="inline-flex items-center gap-1">
          <i className="ti ti-lock-open-2 text-[12px]"></i>
          <span>{text.unblock}</span>
        </span>
      </button>
    </div>
  );
}

export default function BlockedUsersListPage() {
  const text = TEXT[getLocale()] || TEXT.en;
  const s = useSubscribedState("ModalsPage", {});
  const onlineIds = useOnlineUsersSet();
  const blockedUsersList = s?.blockedUsersList || {};
  const filter = blockedUsersList?.filter || "all";
  const loading = !!blockedUsersList?.loading;
  const result = blockedUsersList?.result || "";
  const list = Array.isArray(blockedUsersList?.list) ? blockedUsersList.list : [];
  const title = filter === "friendsOnly" ? text.blockedFriends : text.blockedUsers;

  let emptyText = text.emptyBlockedUsers;
  if (filter === "friendsOnly") emptyText = text.emptyBlockedFriends;

  return (
    <section
      id="BlockedUsersListPage"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-[1px] p-4"
      onClick={() => eventBus.emit("closeBlockedUsersListModal", { from: "blockedUsersPage/backdrop" })}
    >
      <div
        className="w-full max-w-2xl h-[72vh] max-h-[760px] min-h-[420px] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b bg-white">
          <h2 className="font-semibold text-lg text-gray-800">{title}</h2>
          <button
            type="button"
            className="h-8 w-8 rounded-full hover:bg-gray-100 transition text-gray-600 flex items-center justify-center"
            onClick={() => eventBus.emit("closeBlockedUsersListModal", { from: "blockedUsersPage/close" })}
          >
            ✕
          </button>
        </div>

        <div id="blockedUsersList-content" className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center p-6 text-gray-500">
              <span className="w-6 h-6 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : null}

          {!loading && result === "fail" ? (
            <p className="text-sm text-red-600 p-4">{text.fetchFailed}</p>
          ) : null}

          {!loading && result !== "fail" && list.length === 0 ? (
            <p className="text-sm text-gray-500 p-4">{emptyText}</p>
          ) : null}

          {!loading && list.length > 0 ? (
            <div>
              {list.map((user) => (
                <BlockedUserRow
                  key={String(user?.friend_id || user?.friend_name)}
                  user={user}
                  isOnline={onlineIds.has(String(user?.friend_id || ""))}
                  text={text}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
