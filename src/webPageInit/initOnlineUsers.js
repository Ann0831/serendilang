import {scheduleWriteAndSyncOnlineUsers} from "/pages/onlineUsersContainer.js";

import {recordFirstOnlineList} from "/service/analyticsService.js";

// 🌍 全域旗標 — 確保只記錄一次
let hasRecordedFirstSidebarList = false;

/**
 * 🚀 初始化側欄上線名單：
 * 1. 抓取最新上線名單並同步到 UI
 * 2. 若是第一次載入側欄 → 回報 analytics
 */
export async function initSidebarOnlineUsers() {
  try {
    console.log("[SidebarInit] 🚀 Initializing sidebar online users...");
    const onlineList = await scheduleWriteAndSyncOnlineUsers();

    // ✅ 第一次載入時才記錄
    if (!hasRecordedFirstSidebarList) {
      hasRecordedFirstSidebarList = true;
      console.log("[SidebarInit] 🧠 First sidebar entry detected, recording analytics...");

      try {
        await recordFirstOnlineList(onlineList, "sidebar");
      } catch (err) {
        console.warn("[SidebarInit] ⚠️ Failed to record first sidebar online list:", err);
      }
    }
  } catch (err) {
    console.error("[SidebarInit] ❌ Failed to initialize sidebar:", err);
  }
}

// ✅ 立即執行初始化
initSidebarOnlineUsers();
