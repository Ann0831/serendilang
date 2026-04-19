// /event/handlers/postModal.js
import { eventBus } from "../../utils/eventBus.js";
import {
  makePostModalPage as pageOpenPostModal,
  closePostModalPage as pageClosePostModal,
  submitPostModalPage as pageSubmitPostModal,
  updateMakePostText as pageUpdateMakePostText,
  updateMakePostFile as pageUpdateMakePostFile,
  updateMakePostCrop as pageUpdateMakePostCrop,
  resetMakePostCrop as pageResetMakePostCrop,
  confirmMakePostCrop as pageConfirmMakePostCrop,
  reopenMakePostCrop as pageReopenMakePostCrop,
  clearMakePostFile as pageClearMakePostFile,
} from "../../pages/modalsMerged.js";

import { userSelfPage_ReInitAll } from "../../pages/userSelfPage.js";
import { login_PostPage_ReInitAll } from "../../pages/loginPostPage.js";

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
  pageUpdateMakePostText("");
  pageClearMakePostFile();
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

  eventBus.on("postModalInputText", (params) => {
    pageUpdateMakePostText(params?.text || "");
  });

  eventBus.on("postModalSelectImage", (params) => {
    pageUpdateMakePostFile(params?.file || null);
  });

  eventBus.on("postModalClearImage", () => {
    pageClearMakePostFile();
  });

  eventBus.on("postModalSetCrop", (params) => {
    pageUpdateMakePostCrop(params?.crop || null);
  });

  eventBus.on("postModalResetCrop", () => {
    pageResetMakePostCrop();
  });

  eventBus.on("postModalConfirmCrop", () => {
    pageConfirmMakePostCrop();
  });

  eventBus.on("postModalReopenCrop", () => {
    pageReopenMakePostCrop();
  });

  eventBus.on("postMakePost:Complete", (params) => {
    console.log("postMakePost:Complete", params);
    const dot = document.getElementById("unread-profile-dot");
    if (dot) {
      dot.classList.remove("hidden"); // 顯示紅點
      console.log("🔴 顯示 unread-profile-dot 提醒使用者刷新個人頁");
    }
    void userSelfPage_ReInitAll();
    void login_PostPage_ReInitAll();
  });
  console.log("✅ registerPostModalHandlers: post modal events registered.");
}
