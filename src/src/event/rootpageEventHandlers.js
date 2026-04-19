// /event/rootpageEventHandlers.js


import {registerNULLHandler} from "./handlers/Null.js";
// 共用 handlers（登出等帳號事件）
import { registerIdentityHandlers } from "./handlers/identity.js";
// 網路 / WSS 橫幅（可選：若 root 頁也需要顯示）
import { registerNetworkHandlers } from "./handlers/network.js";
import { registerErrorMessagesHandlers } from "./handlers/errorMessages.js";
import { registerNotificationMessagesHandlers } from "./handlers/notificationMessages.js";
import { registerFrontendNotificationHandlers } from "./handlers/frontendNotification.js";
import { notLogin_PostPage_LoadMore } from "../pages/not_login_PostPage.js";

import { eventBus } from "../utils/eventBus.js";

let __rootHandlersRegistered = false;

/**
 * Root Page 專用：註冊需要用到的事件
 * - 冪等：重複呼叫不會重複綁定
 */
export function registerRootPageEventHandlers() {
  if (__rootHandlersRegistered) {
    console.warn("[rootpage] registerRootPageEventHandlers: already registered, skip.");
    return;
  }

    registerNULLHandler();

  // 先註冊共用的系統級事件
  registerNetworkHandlers();   // 若不需要可移除
  registerIdentityHandlers();  // 內含 executeLogout/toggleLogout 等
  registerErrorMessagesHandlers();
  registerNotificationMessagesHandlers();
  registerFrontendNotificationHandlers();

  // Root 頁面自訂：開啟使用者頁（導向 /userpage/:id）
  eventBus.on("openUserPage", (params) => {
    console.log("[event] openUserPage:", params);
    const { author_id } = params || {};
    if (author_id != null) {
      window.open(`/user/${String(author_id)}`, "_blank");
    }
  });

  // Root 未登入主頁：貼文滾動加載（由 UI 發射）
  eventBus.on("notLoginPostPageLoadMore", async (params) => {
    console.log("[event] notLoginPostPageLoadMore:", params);
    await notLogin_PostPage_LoadMore(params || {});
  });

  __rootHandlersRegistered = true;
  console.log("✅ Root Page: event handlers registered.");
}

export default registerRootPageEventHandlers;
