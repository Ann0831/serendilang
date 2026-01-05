// /event/handlers/pageLoad.js
import { eventBus } from "/utils/eventBus.js";
import { refreshUserData } from "/user_identity/user_identity.js";

// Pages reload
import { reloadMessagesPage } from "/pages/messagesScreenPage.js";
import { reloadFriendsListPage } from "/pages/FriendsListPage.js";
import { reloadBlockedUsersListModal } from "/pages/BlockedUsersListModal.js";

/** ===== 導出可重用 API（選用） ===== */
export async function reloadMessages() {
  console.log("[pageLoad] reloadMessages");
  await refreshUserData();
  reloadMessagesPage();
}

export async function reloadFriendsList() {
  console.log("[pageLoad] reloadFriendsList");
  await refreshUserData();
  reloadFriendsListPage();
}

export async function reloadBlockedUsers() {
  console.log("[pageLoad] reloadBlockedUsers");
  await refreshUserData();
  reloadBlockedUsersListModal();
}

/** ===== 集中註冊 ===== */
export function registerPageLoadHandlers() {
  eventBus.on("reloadMessagesPage", async (params) => {
    console.log("[event] reloadMessagesPage:", params);
    await reloadMessages();
  });

  eventBus.on("reloadFriendsListPage", async (params) => {
    console.log("[event] reloadFriendsListPage:", params);
    await reloadFriendsList();
  });

  eventBus.on("reloadBlockedUsersListModal", async (params) => {
    console.log("[event] reloadBlockedUsersListModal:", params);
    await reloadBlockedUsers();
  });

  console.log("✅ registerPageLoadHandlers: page reload events registered.");
}

