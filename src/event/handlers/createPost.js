// /event/handlers/postModal.js
import { eventBus } from "/utils/eventBus.js";
import {
  makePostModalPage as pageOpenPostModal,
  closePostModalPage as pageClosePostModal,
  submitPostModalPage as pageSubmitPostModal,
} from "/pages/makePostModalPage.js";

import {reInitUserSelfPosts} from "/pages/userSelfPage.js";

/** 開啟發文 Modal */
export function openPostModal() {
  console.log("[postModal] openPostModal");
  // 關掉可能打開中的 mainPage 貼文選單，避免遮擋
  document.querySelectorAll("[id^='mainPage-menu-']").forEach(el => {
    el.classList.add("hidden");
  });
  pageOpenPostModal();
}

/** 關閉發文 Modal */
export function closePostModal() {
  console.log("[postModal] closePostModal");
  pageClosePostModal();
}

/** 送出發文 Modal */
export function submitPostModal() {
  console.log("[postModal] submitPostModal");
  pageSubmitPostModal();
}

/** 註冊 Post Modal 相關事件 */
export function registerPostModalHandlers() {
  // 開啟
  eventBus.on("openMakePostModal", (params) => {
    console.log("[event] openMakePostModal:", params);
    openPostModal();
  });

  // 關閉
  eventBus.on("closePostModalPage", (params) => {
    console.log("[event] closePostModalPage:", params);
    closePostModal();
  });

  // 送出
  eventBus.on("submitPostModalPage", (params) => {
    console.log("[event] submitPostModalPage:", params);
    submitPostModal();
  });
  eventBus.on("postMakePost:Complete", (params) => {
    console.log("postMakePost:Complete", params);
    const dot = document.getElementById("unread-profile-dot");
    if (dot) {
      dot.classList.remove("hidden"); // 顯示紅點
      console.log("🔴 顯示 unread-profile-dot 提醒使用者刷新個人頁");
    }
    reInitUserSelfPosts();
  });
  console.log("✅ registerPostModalHandlers: post modal events registered.");
}

