// /event/handlers/selfPostMenu.js
import { eventBus } from "/utils/eventBus.js";

/**
 * 切換使用者自己的貼文三點選單 (SelfPage-menu-)
 */
export function toggleSelfPostMenu(menuId) {
  console.log("[selfPostMenu] toggleSelfPostMenu:", menuId);

  const menu = document.getElementById(menuId);
  if (!menu) return;

  // 關掉其他打開的 SelfPage 貼文選單
  document.querySelectorAll("[id^='SelfPage-menu-']").forEach((el) => {
    if (el.id !== menuId) el.classList.add("hidden");
  });

  // 切換自己這個
  menu.classList.toggle("hidden");
}

/**
 * 註冊 self post menu 事件
 */
export function registerSelfPostMenuHandlers() {
  eventBus.on("toggleSelfPostMenu", (params) => {
    const { menuId } = params || {};
    console.log("[event] toggleSelfPostMenu:", params);
    if (menuId) toggleSelfPostMenu(menuId);
  });

  console.log("✅ registerSelfPostMenuHandlers: self post menu events registered.");
}

