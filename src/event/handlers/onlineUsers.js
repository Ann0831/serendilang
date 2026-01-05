// /event/handlers/onlineUsers.js
import { eventBus } from "/utils/eventBus.js";
import {
  scheduleWriteAndSyncOnlineUsers,
  sortOnlineUserScheduler,
} from "/pages/onlineUsersContainer.js";

/**
 * 寫入並同步上線名單（供 WSS 廣播或其他來源呼叫）
 * @param {any} payload - 伺服端推播的 onlinelist payload（你的 pages 層會處理結構）
 */
export function syncOnlineUsers(payload) {
  console.log("[onlineUsers] syncOnlineUsers: payload:", payload);
  scheduleWriteAndSyncOnlineUsers(payload);
}

/**
 * 觸發排序（可能是 debounce/throttle 的 scheduler）
 */
export function sortOnlineUsers() {
  console.log("[onlineUsers] sortOnlineUsers: trigger scheduler");
  // Scheduler 本身是函式物件（帶狀態），維持你原本的呼叫語義
  sortOnlineUserScheduler.call();
}

/**
 * 集中註冊：上線名單相關事件
 */
export function registerOnlineUsersHandlers() {
  // 由伺服器廣播線上名單（WSS 收到後轉事件）
  eventBus.on("onlineUsers-list-broadcast", (params) => {
    console.log("[event] onlineUsers-list-broadcast:", params);
    scheduleWriteAndSyncOnlineUsers();
  });

  // 前端請求重新排序（例如點擊排序按鈕或定時）
  eventBus.on("sortOnlineUsers", (params) => {
    console.log("[event] sortOnlineUsers:", params);
    sortOnlineUsers();
  });

  console.log("✅ registerOnlineUsersHandlers: online users events registered.");
}

