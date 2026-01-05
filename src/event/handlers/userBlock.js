// /event/handlers/userBlock.js
import { eventBus } from "/utils/eventBus.js";

// Block User Modal
import {
  openBlockUserModal as pageOpenBlockUserModal,
  closeBlockUserModal as pageCloseBlockUserModal,
  submitBlockUserModal as pageSubmitBlockUserModal,
} from "/pages/blockUserModal.js";

// Unblock User Modal
import {
  openUnblockUserModal as pageOpenUnblockUserModal,
  closeUnblockUserModal as pageCloseUnblockUserModal,
  submitUnblockUserModal as pageSubmitUnblockUserModal,
} from "/pages/UnblockUserModal.js";

// Blocked Users List Modal
import {
  openBlockedUsersListModal as pageOpenBlockedUsersListModal,
  closeBlockedUsersListModal as pageCloseBlockedUsersListModal,
} from "/pages/BlockedUsersListModal.js";

/** ===== 導出可重用 API（選用） ===== */
export function openBlockUserModal(target_id, target_name) {
  console.log("[userBlock] openBlockUserModal:", { target_id, target_name });
  // 關閉所有聊天選單，避免覆蓋
  document.querySelectorAll('[id^="ChatRoom_Menu-"]').forEach((el) => el.classList.add("hidden"));
  pageOpenBlockUserModal(target_id, target_name);
}

export function closeBlockUserModal() {
  console.log("[userBlock] closeBlockUserModal");
  pageCloseBlockUserModal();
}

export function submitBlockUserModal() {
  console.log("[userBlock] submitBlockUserModal");
  pageSubmitBlockUserModal();
}

export function openUnblockUserModal(target_id, target_name) {
  console.log("[userBlock] openUnblockUserModal:", { target_id, target_name });
  // 關閉所有聊天選單，避免覆蓋
  document.querySelectorAll('[id^="ChatRoom_Menu-"]').forEach((el) => el.classList.add("hidden"));
  pageOpenUnblockUserModal(target_id, target_name);
}

export function closeUnblockUserModal() {
  console.log("[userBlock] closeUnblockUserModal");
  pageCloseUnblockUserModal();
}

export function submitUnblockUserModal() {
  console.log("[userBlock] submitUnblockUserModal");
  pageSubmitUnblockUserModal();
}

export function openBlockedUsersListAll() {
  console.log("[userBlock] openBlockedUsersListAll");
  pageOpenBlockedUsersListModal({ filter: "all" });
}

export function openBlockedFriendsListOnly() {
  console.log("[userBlock] openBlockedFriendsListOnly");
  pageOpenBlockedUsersListModal({ filter: "friendsOnly" });
}

export function closeBlockedUsersList() {
  console.log("[userBlock] closeBlockedUsersList");
  pageCloseBlockedUsersListModal();
}

/** ===== 集中註冊 ===== */
export function registerUserBlockHandlers() {
  // Block User Modal
  eventBus.on("openBlockUserModal", (params) => {
    const { target_id, target_name } = params || {};
    console.log("[event] openBlockUserModal:", params);
    openBlockUserModal(target_id, target_name);
  });

  eventBus.on("closeBlockUserModal", (params) => {
    console.log("[event] closeBlockUserModal:", params);
    closeBlockUserModal();
  });

  eventBus.on("submitBlockUserModal", (params) => {
    console.log("[event] submitBlockUserModal:", params);
    submitBlockUserModal();
  });

  // Unblock User Modal
  eventBus.on("openUnblockUserModal", (params) => {
    const { target_id, target_name } = params || {};
    console.log("[event] openUnblockUserModal:", params);
    openUnblockUserModal(target_id, target_name);
  });

  eventBus.on("closeUnblockUserModal", (params) => {
    console.log("[event] closeUnblockUserModal:", params);
    closeUnblockUserModal();
  });

  eventBus.on("submitUnblockUserModal", (params) => {
    console.log("[event] submitUnblockUserModal:", params);
    submitUnblockUserModal();
  });

  // Blocked Users List Modal（全部 / 僅好友）
  eventBus.on("openBlockedUsersListModal", (params) => {
    console.log("[event] openBlockedUsersListModal (all):", params);
    openBlockedUsersListAll();
  });

  eventBus.on("closeBlockedUsersListModal", (params) => {
    console.log("[event] closeBlockedUsersListModal:", params);
    closeBlockedUsersList();
  });

  eventBus.on("openBlockedFriendsListModal", (params) => {
    console.log("[event] openBlockedFriendsListModal (friendsOnly):", params);
    openBlockedFriendsListOnly();
  });

  eventBus.on("closeBlockedFriendsListModal", (params) => {
    console.log("[event] closeBlockedFriendsListModal:", params);
    closeBlockedUsersList();
  });

  console.log("✅ registerUserBlockHandlers: user block/unblock & list events registered.");
}

