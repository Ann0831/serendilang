import React from "react";
import { createRoot } from "react-dom/client";
import MessagesPage from "../ui/pages/MessagesPage.jsx";
import FriendRequestsPage from "../ui/pages/FriendRequestsPage.jsx";
import PotentialFriendsPage from "../ui/pages/PotentialFriendsPage.jsx";
import FriendsListPage from "../ui/pages/FriendsListPage.jsx";
import OnlineUsersFullscreen from "../ui/pages/OnlineUsersFullscreen.jsx";
import LoginPostPage from "../ui/pages/LoginPostPage.jsx";
import UserSelfPage from "../ui/pages/UserSelfPage.jsx";

let loginPagesRoot = null;

function h(type, props, ...children) {
  return React.createElement(type, props, ...children);
}

const LOGIN_PAGE_LAYOUT_CLASS = "w-full min-h-screen box-border pt-16 pb-16 md:pb-0 md:pl-56 lg:pr-72 bg-gray-100";

function createPageShell({ id, bodyClassName = "", contentClassName = "", child }) {
  return h(
    "section",
    { id, className: `${LOGIN_PAGE_LAYOUT_CLASS} flex flex-col ${bodyClassName}` },
    h("div", { className: `flex-1 min-h-0 ${contentClassName}` }, child)
  );
}

function createLoginPageNode(screenId) {
  if (screenId === "postContainer") {
    return createPageShell({ id: "postContainer", child: h(LoginPostPage, null) });
  }

  if (screenId === "messagespage") {
    return createPageShell({ id: "messagespage", child: h(MessagesPage, null) });
  }

  if (screenId === "PotentialFriendsPage") {
    return createPageShell({
      id: "PotentialFriendsPage",
      bodyClassName: "relative h-main bg-gray-100",
      child: h(PotentialFriendsPage, null),
    });
  }

  if (screenId === "FriendRequestsPage") {
    return createPageShell({
      id: "FriendRequestsPage",
      bodyClassName: "relative h-main bg-gray-100",
      child: h(FriendRequestsPage, null),
    });
  }

  if (screenId === "FriendsListPage") {
    return createPageShell({ id: "FriendsListPage", child: h(FriendsListPage, null) });
  }

  if (screenId === "UserSelfPage") {
    return createPageShell({ id: "UserSelfPage", child: h(UserSelfPage, null) });
  }

  if (screenId === "OnlineUsersPage") {
    return createPageShell({ id: "OnlineUsersPage", child: h(OnlineUsersFullscreen, null) });
  }

  return null;
}

export function mountLoginScreen(screenId) {
  const host = document.getElementById("login_pages");
  if (!host) return;

  if (loginPagesRoot) {
    loginPagesRoot.unmount();
    loginPagesRoot = null;
  }
  host.replaceChildren();

  const node = createLoginPageNode(screenId);
  if (!node) return;

  loginPagesRoot = createRoot(host);
  loginPagesRoot.render(node);
}
