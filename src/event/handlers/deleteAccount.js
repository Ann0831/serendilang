// /event/handlers/deleteAccount.js
import { eventBus } from "/utils/eventBus.js";
import {
  openDeleteUserAccountModal as pageOpenDeleteUserAccountModal,
  closeDeleteUserAccountModal as pageCloseDeleteUserAccountModal,
  submitDeleteUserAccountModal as pageSubmitDeleteUserAccountModal,
} from "/pages/DeleteUserAccountModal.js";

/** 開啟「刪除帳號」Modal */
export function openDeleteUserAccountModal() {
  console.log("[deleteAccount] openDeleteUserAccountModal");

  // 若需要先關掉其他可能干擾的下拉或選單，可視需求保留：
  document.querySelectorAll('[id^="ChatRoom_Menu-"],[id^="SelfPage-menu-"],[id^="mainPage-menu-"]').forEach(el => {
    el.classList.add("hidden");
  });

  pageOpenDeleteUserAccountModal();
}

/** 關閉「刪除帳號」Modal */
export function closeDeleteUserAccountModal() {
  console.log("[deleteAccount] closeDeleteUserAccountModal");
  pageCloseDeleteUserAccountModal();
}

/** 送出「刪除帳號」Modal（確認刪除） */
export function submitDeleteUserAccountModal() {
  console.log("[deleteAccount] submitDeleteUserAccountModal");
  // 這裡是正確的一次呼叫，避免誤寫成 ()();
  pageSubmitDeleteUserAccountModal();
}

/** 集中註冊：刪除帳號相關事件 */
export function registerDeleteAccountHandlers() {
  // 開啟
  eventBus.on("openDeleteUserAccountModal", (params) => {
    console.log("[event] openDeleteUserAccountModal:", params);
    openDeleteUserAccountModal();
  });

  // 關閉
  eventBus.on("closeDeleteUserAccountModal", (params) => {
    console.log("[event] closeDeleteUserAccountModal:", params);
    closeDeleteUserAccountModal();
  });

  // 送出
  eventBus.on("submitDeleteUserAccountModal", (params) => {
    console.log("[event] submitDeleteUserAccountModal:", params);
    submitDeleteUserAccountModal();
  });

  console.log("✅ registerDeleteAccountHandlers: delete account events registered.");
}

