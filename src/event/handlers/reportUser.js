// /event/handlers/reportUser.js
import { eventBus } from "/utils/eventBus.js";
import {
  openReportUserModal as pageOpenReportUserModal,
  closeReportUserModal as pageCloseReportUserModal,
  submitReportUserModal as pageSubmitReportUserModal,
} from "/pages/reportUserModal.js";

/** 開啟檢舉使用者 Modal */
export function openReportUserModal(target_id, target_name) {
  console.log("[reportUser] openReportUserModal:", { target_id, target_name });

  // 關閉所有聊天選單，避免覆蓋
  document.querySelectorAll('[id^="ChatRoom_Menu-"]').forEach((el) => {
    el.classList.add("hidden");
  });

  pageOpenReportUserModal(target_id, target_name);
}

/** 關閉檢舉使用者 Modal */
export function closeReportUserModal() {
  console.log("[reportUser] closeReportUserModal");
  pageCloseReportUserModal();
}

/** 送出檢舉使用者 Modal */
export function submitReportUserModal() {
  console.log("[reportUser] submitReportUserModal");
  pageSubmitReportUserModal();
}

/** 集中註冊：Report User 相關事件 */
export function registerReportUserHandlers() {
  // 開啟
  eventBus.on("openReportUserModal", (params) => {
    const { target_id, target_name } = params || {};
    console.log("[event] openReportUserModal:", params);
    openReportUserModal(target_id, target_name);
  });

  // 關閉
  eventBus.on("closeReportUserModal", (params) => {
    console.log("[event] closeReportUserModal:", params);
    closeReportUserModal();
  });

  // 送出
  eventBus.on("submitReportUserModal", (params) => {
    console.log("[event] submitReportUserModal:", params);
    submitReportUserModal();
  });

  console.log("✅ registerReportUserHandlers: report user events registered.");
}
