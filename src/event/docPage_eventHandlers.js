import {registerNULLHandler} from "/event/handlers/Null.js";

import { registerIdentityHandlers } from "/event/handlers/identity.js";


let __docPageHandlersRegistered = false;

/**
 * 註冊「使用者頁」會用到的全部事件
 * 冪等：重複呼叫只會註冊一次
 */
export function registerDocPageEventHandlers() {
  if (__docPageHandlersRegistered) {
    console.warn("[docpage] registerDocPageEventHandlers: already registered, skip.");
    return;
  }

  registerNULLHandler();
  registerIdentityHandlers(); 
  // ✅ 讀取全域設定（若未設定則給預設空物件）

  __docPageHandlersRegistered = true;
  console.log("✅ Doc Page: all event handlers registered.");
}



