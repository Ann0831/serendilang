// /event/handlers/postActions.js
import { eventBus } from "/utils/eventBus.js";

// UI 控制：按讚
import { toggleLike } from "/ui_controll/controllPostCard.js";

// 檢舉貼文 Modal
import {
  openReportPostModal as pageOpenReportPostModal,
  closeReportPostModal as pageCloseReportPostModal,
  submitReportPostModal as pageSubmitReportPostModal,
} from "/pages/reportPostModal.js";

// 刪除貼文 Modal（自介頁）
import {
  openDeletePostModal as pageOpenDeletePostModal,
  closeDeletePostModal as pageCloseDeletePostModal,
  confirmDeletePost as pageConfirmDeletePost,
} from "/pages/deletePostModal.js";

/** ===== 導出可重用 API（選用） ===== */

// 切換主頁貼文三點選單
export function togglePostMenu(menuId) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  document.querySelectorAll("[id^='mainPage-menu-']").forEach(el => {
    if (el.id !== menuId) el.classList.add("hidden");
  });
  menu.classList.toggle("hidden");
}

// 按讚 / 取消讚
export function likeOrUnlike(post_id, el) {
  if (!post_id || !el) return;
  const likecountEl = el.nextElementSibling;
  toggleLike(el, likecountEl, post_id);
}

// 檢舉貼文 Modal
export function openReportPostModal(post_id) {
  // 關掉其他主頁選單，避免遮蓋
  document.querySelectorAll("[id^='mainPage-menu-']").forEach(el => el.classList.add("hidden"));
  pageOpenReportPostModal(post_id);
}
export function closeReportPostModal() {
  pageCloseReportPostModal();
}
export function submitReportPostModal() {
  pageSubmitReportPostModal();
}

// 刪除貼文 Modal（自介頁）
export function openDeletePostModal(post_id) {
  // 關掉自介頁的其他選單
  document.querySelectorAll("[id^='SelfPage-menu-']").forEach(el => el.classList.add("hidden"));
  pageOpenDeletePostModal(post_id);
}
export function closeDeletePostModal(post_id) {
  // 若有需要可依 post_id 做額外處理
  pageCloseDeletePostModal(post_id);
}
export function confirmDeletePost(post_id) {
  pageConfirmDeletePost(post_id);
}

// 開啟使用者頁
export function openUserPage(author_id) {
  if (!author_id) return;
  window.open(`/user/${String(author_id)}`, "_blank");
}

/** ===== 集中註冊 ===== */
export function registerPostActionsHandlers() {
  // 按讚
  eventBus.on("like_or_unlike", (params, el) => {
    const { post_id } = params || {};
    console.log("[event] like_or_unlike:", params);
    likeOrUnlike(post_id, el);
  });

  // 三點選單切換（主頁）
  eventBus.on("togglePostMenu", (params) => {
    const { menuId } = params || {};
    console.log("[event] togglePostMenu:", params);
    if (menuId) togglePostMenu(menuId);
  });

  // 檢舉貼文
  eventBus.on("openReportPostModal", (params) => {
    const { post_id } = params || {};
    console.log("[event] openReportPostModal:", params);
    if (post_id) openReportPostModal(post_id);
  });
  eventBus.on("closeReportPostModal", (params) => {
    console.log("[event] closeReportPostModal:", params);
    closeReportPostModal();
  });
  eventBus.on("submitReportPostModal", (params) => {
    console.log("[event] submitReportPostModal:", params);
    submitReportPostModal();
  });

  // 自介頁刪除貼文
  eventBus.on("openDeletePostModal", (params) => {
    const { post_id } = params || {};
    console.log("[event] openDeletePostModal:", params);
    if (post_id) openDeletePostModal(post_id);
  });
  eventBus.on("closeDeletePostModal", (params) => {
    const { post_id } = params || {};
    console.log("[event] closeDeletePostModal:", params);
    closeDeletePostModal(post_id);
  });
  eventBus.on("confirmDeletePost", (params) => {
    const { post_id } = params || {};
    console.log("[event] confirmDeletePost:", params);
    if (post_id) confirmDeletePost(post_id);
  });

  // 開啟使用者頁
  eventBus.on("openUserPage", (params) => {
    const { author_id } = params || {};
    console.log("[event] openUserPage:", params);
    openUserPage(author_id);
  });

  console.log("✅ registerPostActionsHandlers: post actions events registered.");
}

