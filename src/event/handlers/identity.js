// /event/handlers/identity.js
import { eventBus } from "/utils/eventBus.js";

// 身分 / 狀態
import { refreshUserData } from "/user_identity/user_identity.js";

// Top bar（登出控制）
import {
  toggleLogout as topToggleLogout,
  executeLogout as topExecuteLogout,
  executeLogoutAll as topExecuteLogoutAll,
} from "/pages/topBar.js";

// Chat room（reload chat 時需要）
import {
  openChatRoom as pageOpenChatRoom,
  closeChatRoom as pageCloseChatRoom,
  checkChatRoomStatus as pageCheckChatRoomStatus,
} from "/pages/chatRoomsContainer.js";

// User self page
import { reInitUserSelfPosts as pageReInitUserSelfPosts } from "/pages/userSelfPage.js";

/** ===== 導出可重用 API（選用） ===== */
export function toggleLogout() {
  console.log("[identity] toggleLogout");
  topToggleLogout();
}

export function executeLogout() {
  console.log("[identity] executeLogout");
  topExecuteLogout();
}

export function executeLogoutAll() {
  console.log("[identity] executeLogoutAll");
  const confirmed = confirm("Are you sure you want to log out from all devices?");
  if (!confirmed) return;
  topExecuteLogoutAll();
}

export async function reloadChatRoom(target_id) {
  if (!target_id) return;
  // 先刷新使用者資料，確保權限/封鎖/好友狀態最新
  await refreshUserData();

  const status = pageCheckChatRoomStatus(target_id);
  if (status === "active") {
    await pageCloseChatRoom(target_id);
    await pageOpenChatRoom(target_id);
  } else if (status === "hidden") {
    await pageCloseChatRoom(target_id);
  }
}

export function reInitUserSelfPosts() {
  console.log("[identity] reInitUserSelfPosts");
  pageReInitUserSelfPosts();
}

export function toggleUserSelfDropdown() {
  console.log("[identity] toggleUserSelfDropdown");
  const dropdown = document.getElementById("userselfpage-user-dropdown");
  if (!dropdown) return;
  dropdown.classList.toggle("hidden");
}

/** ===== 集中註冊 ===== */
export function registerIdentityHandlers() {
  // 登出相關
  eventBus.on("toggleLogout", (params) => {
    console.log("[event] toggleLogout:", params);
    toggleLogout();
  });

  eventBus.on("executeLogout", (params) => {
    console.log("[event] executeLogout:", params);
    executeLogout();
  });

  eventBus.on("executeLogoutAll", (params) => {
    console.log("[event] executeLogoutAll:", params);
    executeLogoutAll();
  });

  // ChatRoom 重載（僅保留此一項）
  eventBus.on("reloadChatRoom", async (params) => {
    const { target_id } = params || {};
    if (target_id) {
      await reloadChatRoom(target_id);
    }
  });

  // UserSelf 快捷
  eventBus.on("reInitUserSelfPosts", (params) => {
    console.log("[event] reInitUserSelfPosts:", params);
    reInitUserSelfPosts();
  });

  eventBus.on("toggle-userself-user-dropdown", (params) => {
    console.log("[event] toggle-userself-user-dropdown:", params);
    toggleUserSelfDropdown();
  });

  console.log("✅ registerIdentityHandlers: identity & account events registered (page reload parts removed).");
}

