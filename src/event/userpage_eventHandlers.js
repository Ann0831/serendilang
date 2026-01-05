// /event/userpage_eventHandlers.js
// 專給「使用者頁」用的事件總註冊器：把會在使用者頁出現的功能都註冊起來

// 事件總線不用在這裡直接用（已經拆到各 handlers 裡）
// import { eventBus } from "../utils/eventBus.js";

// === 功能模組（你前面已建立） ===


import {registerNULLHandler} from "/event/handlers/Null.js";

// 聊天室（開關、滾動、送訊息、選單）
import { registerChatRoomHandlers } from "/event/handlers/chatRoom.js";

// 文章行為（按讚、主頁選單、檢舉貼文、刪文、開使用者頁）
import { registerPostActionsHandlers } from "/event/handlers/postActions.js";

// 檢舉使用者
import { registerReportUserHandlers } from "/event/handlers/reportUser.js";

// 封鎖/解除封鎖、封鎖名單
import { registerUserBlockHandlers } from "/event/handlers/userBlock.js";

// 身分/帳戶（這裡用到：toggleLogout、reloadChatRoom、userself dropdown、reInitUserSelfPosts）
import { registerIdentityHandlers } from "/event/handlers/identity.js";

// 網路 & WSS 橫幅（openNetworkBanner / closeNetworkBanner / wssConnected / wssDisconnected / RateLimitExceeded）
import { registerNetworkHandlers } from "/event/handlers/network.js";

// 好友請求（送出/接受）
import { registerFriendRequestHandlers } from "/event/handlers/friendRequests.js";

// （可選）如果使用者頁也會開發文 Modal，就加上這個：
// import { registerPostModalHandlers } from "/event/handlers/postModal.js";



// Calling（語音/視訊、來電提示、接受/拒絕）
import { registerCallHandlers } from "/event/handlers/calling.js";


let __userPageHandlersRegistered = false;

/**
 * 註冊「使用者頁」會用到的全部事件
 * 冪等：重複呼叫只會註冊一次
 */
export function registerUserPageEventHandlers() {
  if (__userPageHandlersRegistered) {
    console.warn("[userpage] registerUserPageEventHandlers: already registered, skip.");
    return;
  }

  registerNULLHandler();

  // ✅ 讀取全域設定（若未設定則給預設空物件）
  const cfg = window.USER_PAGE_CONFIG || {};

  // 依系統 → 功能的順序註冊（僅在未被禁用時執行）
  if (!cfg.disableNetworkHandlers)        registerNetworkHandlers();        // network banners / wss banners
  if (!cfg.disableIdentityHandlers)       registerIdentityHandlers();       // logout / reloadChatRoom / userself dropdown
  if (!cfg.disableFriendRequestHandlers)  registerFriendRequestHandlers();  // sendFriendRequest / acceptFriendRequest
  if (!cfg.disableUserBlockHandlers)      registerUserBlockHandlers();      // block / unblock / blocked list
  if (!cfg.disableReportUserHandlers)     registerReportUserHandlers();     // report user modal
  if (!cfg.disablePostActionsHandlers)    registerPostActionsHandlers();    // like, togglePostMenu, report post, delete post, openUserPage
  if (!cfg.disableChatRoomHandlers)       {
	  registerCallHandlers();
	  registerChatRoomHandlers();       // open/close, scroll, sendMessage, menu toggle
  }

  // 如需在使用者頁也打開發文 Modal，可自行啟用
  // if (!cfg.disablePostModalHandlers)   registerPostModalHandlers();

  __userPageHandlersRegistered = true;
  console.log("✅ User Page: all event handlers registered.");
}

export default registerUserPageEventHandlers;

