import React from "react";
import { useSubscribedState } from "../StateViewBase.jsx";
import { eventBus } from "../../utils/eventBus.js";
import { toAvatarSrc, UI_DEFAULT_AVATAR_SRC } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";

function getMenuLocale() {
  if (typeof navigator !== "undefined" && typeof navigator.language === "string") {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("zh")) return "zh";
  }
  return "en";
}

const MENU_TEXT = {
  en: {
    loading: "Loading...",
    unknown: "Unknown",
    potentialFriend: "Potential Friend",
    friendRequest: "Friend Request",
    mainPage: "Main Page",
    yourFriends: "Your friends",
    messages: "Messages",
    onlineUsers: "Online users",
    makePost: "Make Post",
  },
  zh: {
    loading: "載入中...",
    unknown: "未知",
    potentialFriend: "潛在好友",
    friendRequest: "好友邀請",
    mainPage: "主頁",
    yourFriends: "你的好友",
    messages: "訊息",
    onlineUsers: "在線用戶",
    makePost: "發文",
  },
};

export default function MenuBar() {
  const s = useSubscribedState("MenuBar", {
    loading: false,
    username: "",
    profileUrl: UI_DEFAULT_AVATAR_SRC,
  });
  const text = MENU_TEXT[getMenuLocale()] || MENU_TEXT.en;

  const actionList = JSON.stringify([
    { type: "click", action: "openMakePostModal", eventParameter: {} },
  ]);
  const emitMenuNavigate = (target) => {
    eventBus.emit("menuNavigate", { target, from: "ui/MenuBar" });
  };

  return (
    <aside className="flex flex-row justify-around items-center w-full h-16 fixed bottom-0 left-0 right-0 z-40 bg-gray-100 overflow-hidden py-2 md:flex-col md:justify-start md:items-stretch md:w-56 md:h-auto md:top-16 md:bottom-0 md:py-4">
      <div id="startuserselfpage-button" onClick={() => emitMenuNavigate("UserSelfPage")} className="menu-item flex items-center md:gap-3 justify-center md:justify-start cursor-pointer py-3 md:px-4 hover:bg-gray-200 transition group">
        <div className="flex items-center gap-3 w-full min-w-0">
          {s.loading ? (
            <div className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <AvatarImage src={toAvatarSrc(s.profileUrl)} alt={`${s.username || "unknown"} avatar`} className="w-10 h-10 rounded-full object-cover border border-gray-300" />
          )}
          <span className="font-semibold hidden md:block min-w-0 whitespace-normal break-words leading-tight">{s.loading ? text.loading : s.username || text.unknown}</span>
          <span id="unread-profile-dot" className="notification-dot hidden w-2 h-2 bg-red-500 rounded-full right-3 md:left-6 top-2"></span>
        </div>
      </div>

      <div id="showpotentialfriend-button" onClick={() => emitMenuNavigate("PotentialFriendsPage")} className="menu-item flex items-center md:gap-3 justify-center md:justify-start cursor-pointer py-3 md:px-4 hover:bg-gray-200 transition group">
        <i className="ti ti-user-plus text-xl md:text-2xl w-6 block text-center" data-outline-icon="ti-user-plus" data-filled-icon=""></i>
        <span className="AnnotationText hidden md:inline-flex">{text.potentialFriend}</span>
      </div>

      <div id="gotofriendrequest-button" onClick={() => emitMenuNavigate("FriendRequestsPage")} className="menu-item flex items-center md:gap-3 justify-center md:justify-start cursor-pointer py-3 md:px-4 hover:bg-gray-200 transition group relative">
        <i className="ti ti-user-check text-xl md:text-2xl w-6 block text-center" data-outline-icon="ti-user-check" data-filled-icon=""></i>
        <span className="AnnotationText hidden md:inline-flex">{text.friendRequest}</span>
        <span id="unread-friendrequest-dot" className="notification-dot w-2 h-2 bg-red-500 rounded-full right-3 md:left-4 top-2 hidden"></span>
      </div>

      <div id="gotomainpage-button" onClick={() => emitMenuNavigate("postContainer")} className="menu-item flex items-center md:gap-3 justify-center md:justify-start cursor-pointer py-3 md:px-4 hover:bg-gray-200 transition group">
        <i className="ti ti-home text-xl md:text-2xl w-6 block text-center leading-none" data-outline-icon="ti-home" data-filled-icon="ti-home"></i>
        <span className="AnnotationText hidden md:inline-flex">{text.mainPage}</span>
      </div>

      <div id="startfriendslistpage-button" onClick={() => emitMenuNavigate("FriendsListPage")} className="menu-item flex items-center md:gap-3 justify-center md:justify-start cursor-pointer py-3 md:px-4 hover:bg-gray-200 transition group relative">
        <i className="ti ti-friends text-xl md:text-2xl w-6 block text-center" data-outline-icon="ti-friends" data-filled-icon=""></i>
        <span className="AnnotationText hidden md:inline-flex">{text.yourFriends}</span>
        <span id="unread-acceptfriend-dot" className="notification-dot w-2 h-2 bg-red-500 rounded-full right-3 md:left-4 top-2 hidden"></span>
      </div>

      <div id="startmessagespage-button" onClick={() => emitMenuNavigate("messagespage")} className="menu-item flex items-center md:gap-3 justify-center md:justify-start cursor-pointer py-3 md:px-4 hover:bg-gray-200 transition group relative">
        <i className="ti ti-message-circle text-xl md:text-2xl w-6 block text-center" data-outline-icon="ti-message-circle" data-filled-icon="ti-message-circle-filled"></i>
        <span className="AnnotationText hidden md:inline-flex">{text.messages}</span>
        <span id="unread-message-dot" className="notification-dot w-2 h-2 bg-red-500 rounded-full right-3 md:left-4 top-2 hidden"></span>
      </div>

      <div id="gotoOnlineUsers-button" onClick={() => emitMenuNavigate("OnlineUsersPage")} className="menu-item flex items-center md:gap-3 justify-center md:justify-start cursor-pointer py-3 md:px-4 hover:bg-gray-200 transition group relative">
        <i className="ti ti-world text-xl md:text-2xl w-6 block text-center" data-outline-icon="ti-world" data-filled-icon=""></i>
        <span className="AnnotationText hidden md:inline-flex">{text.onlineUsers}</span>
      </div>

      <div id="startpost-button" onClick={() => eventBus.emit("openMakePostModal", { from: "ui/menu/startpost" })} className="menu-item flex items-center md:gap-3 justify-center md:justify-start cursor-pointer py-3 md:px-4 hover:bg-gray-200 transition group" data-action-list={actionList}>
        <i className="ti ti-circle-plus text-xl md:text-2xl w-6 block text-center" data-outline-icon="ti-circle-plus" data-filled-icon="ti-circle-plus-filled"></i>
        <span className="AnnotationText hidden md:inline-flex">{text.makePost}</span>
      </div>
    </aside>
  );
}
