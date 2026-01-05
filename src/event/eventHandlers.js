// /event/index.js
// 集中註冊所有事件處理器（避免重複註冊，內建一次性防護）

// —— 呼叫順序大致依系統層→功能層 → UI層 ——

import {registerNULLHandler} from "/event/handlers/Null.js";

//systerm-user-notifications



import { registerSelfPostMenuHandlers } from "/event/handlers/selfPostMenu.js";

// Network / WSS
import { registerNetworkHandlers } from "/event/handlers/network.js";

// Identity / Account（不含 page reload，已獨立）
import { registerIdentityHandlers } from "/event/handlers/identity.js";

// Page reload（messages / friends / blocked-users modal）
import { registerPageLoadHandlers } from "/event/handlers/pageLoad.js";

// Online users（清單廣播、排序）
import { registerOnlineUsersHandlers } from "/event/handlers/onlineUsers.js";

// Chat room（開關、滾動、訊息送出/同步、選單）
import { registerChatRoomHandlers } from "/event/handlers/chatRoom.js";

// Calling（語音/視訊、來電提示、接受/拒絕）
import { registerCallHandlers } from "/event/handlers/calling.js";

// Post Modal（發文）
import { registerPostModalHandlers } from "/event/handlers/createPost.js";

// Post Actions（按讚、主頁選單、檢舉貼文、刪文、自介頁選單、開使用者頁）
import { registerPostActionsHandlers } from "/event/handlers/postActions.js";

// Friend requests（送出/接受）
import { registerFriendRequestHandlers } from "/event/handlers/friendRequests.js";

// Report user（檢舉使用者）
import { registerReportUserHandlers } from "/event/handlers/reportUser.js";

// Delete account（刪除帳號）
import { registerDeleteAccountHandlers } from "/event/handlers/deleteAccount.js";

// User block / unblock / blocked list
import { registerUserBlockHandlers } from "/event/handlers/userBlock.js";

// Edit UserData modal
import { registerUserSelfModalHandlers } from "/event/handlers/editUserDataModal.js";


let __eventHandlersRegistered = false;

/**
 * 一次性註冊全站事件處理器
 * - 具備冪等：重複呼叫也不會再次綁定
 */
export function registerEventHandlers() {
  if (__eventHandlersRegistered) {
    console.warn("[event] registerEventHandlers: already registered, skip.");
    return;
  }

  registerNULLHandler();

  // —— 建議順序：系統級 → 資料級 → UI/功能級 ——
  registerNetworkHandlers();
  registerIdentityHandlers();
  registerPageLoadHandlers();
  registerOnlineUsersHandlers();

  registerChatRoomHandlers();
  registerCallHandlers();

  registerPostModalHandlers();
  registerPostActionsHandlers();
  registerFriendRequestHandlers();

  registerReportUserHandlers();
  registerDeleteAccountHandlers();
  registerUserBlockHandlers();

  registerUserSelfModalHandlers();
  registerSelfPostMenuHandlers();


  __eventHandlersRegistered = true;
  console.log("✅ All event handlers registered.");
}

// 可選：預設匯出
export default registerEventHandlers;

