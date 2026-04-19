import "../css/index.css";
import { showOnlineUsersSidebar } from "../pages/onlineUsersContainer.js";

/**
 * 🚀 初始化側欄上線名單：
 * 1. 抓取最新上線名單並同步到 UI
 * 2. 若是第一次載入側欄 → 回報 analytics
 */
export async function initSidebarOnlineUsers() {
  return showOnlineUsersSidebar();
}

// ✅ 立即執行初始化
initSidebarOnlineUsers();
