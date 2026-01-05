// /pages/OnlineUsersPage.js

import { scheduleWriteAndSyncOnlineUsers } from "/pages/onlineUsersContainer.js";
import {recordFirstOnlineList} from "/service/analyticsService.js";


let hasEnteredOnlineUsersPage = false;

/**
 * 🚀 進入 OnlineUsersPage 時執行：
 * 1. 從後端取得最新線上名單
 * 2. 呼叫 scheduleWriteAndSyncOnlineUsers() 更新 UI
 */

export async function OnlineUsersPage_Enter() {
  console.log("[OnlineUsersPage] Enter → fetching online users...");
  try {
    const container = document.getElementById("onlineUsersContainer");
    if (container) {
      container.classList.remove("hidden"); // ✅ 顯示頁面
    }

    // 取得線上名單
    const onlineList = await scheduleWriteAndSyncOnlineUsers();

    // ✅ 第一次進入才記錄
    if (!hasEnteredOnlineUsersPage) {
      hasEnteredOnlineUsersPage = true;
      console.log("[OnlineUsersPage] 🧠 First entry detected, recording analytics...");
      try {
        // 呼叫 service 層 → 讓後端記錄首次看到的名單
        await recordFirstOnlineList(onlineList, "page");
      } catch (err) {
        console.warn("[OnlineUsersPage] ⚠️ Failed to record first online list:", err);
      }
    }

  } catch (error) {
    console.error("[OnlineUsersPage] ❌ Failed to load online users:", error);
  }
}
/**
 * 🚪 離開 OnlineUsersPage 時執行：
 * - 清除暫存資料或中斷輪詢（如果未來有設自動更新）
 * - 移除 loading 狀態或取消 UI 更新
 */
export function OnlineUsersPage_Leave() {
  console.log("[OnlineUsersPage] Leave → hiding page container...");
  const container = document.getElementById("OnlineUsersPage");
  if (container) {
    // 將整個線上使用者容器隱藏起來
    container.classList.add("hidden");
  }
}

