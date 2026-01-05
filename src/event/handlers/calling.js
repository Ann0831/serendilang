// /event/handlers/calling.js
import { eventBus } from "../../utils/eventBus.js";

// page / route 層
import { openChatRoom } from "../../pages/chatRoomsContainer.js";
import { openCallPage as routeOpenCallPage, openAcceptCallPage as routeOpenAcceptCallPage } from "../../route/openCallPage.js";

// user_identity / utils / ui 控制
import { getCurrentUserBlockList_Global } from "/user_identity/user_identity.js";
import { findDirectChildByUserId } from "/utils/Dom/find.js";
import {
  showCallRequest as uiShowCallRequest,
  cancelCallRequest as uiCancelCallRequest,
} from "../../ui_controll/controllChatRoom.js";

/**
 * 取得（或建立）指定 userId 的聊天室 DOM 元素
 * @param {string} userId
 * @returns {Promise<HTMLElement|null>}
 */
async function getChatRoomEl(userId) {
  if (!userId) return null;
  const container = await openChatRoom(userId);
  if (!container) return null;
  return findDirectChildByUserId(container, userId);
}

/**
 * 開啟主叫通話頁
 * @param {string} target_id
 * @param {boolean} useCamera - true=影片、false=語音
 */
export function openCallPage(target_id, useCamera) {
  console.log("[calling] openCallPage:", { target_id, useCamera });
  if (!target_id) return;
  routeOpenCallPage(target_id, !!useCamera);
}

/**
 * 被叫方接受通話頁
 * @param {string} user_id - 對方的 userId（來電者）
 * @param {boolean} useCamera - true=影片、false=語音
 */
export function openAcceptCallPage(user_id, useCamera) {
  console.log("[calling] openAcceptCallPage:", { user_id, useCamera });
  if (!user_id) return;
  routeOpenAcceptCallPage(user_id, !!useCamera);
}

/**
 * 顯示「對方來電中」的 UI
 * @param {HTMLElement|null} chatRoomEl
 */
export function showCallRequest(chatRoomEl) {
  console.log("[calling] showCallRequest");
  if (!chatRoomEl) return;
  uiShowCallRequest(chatRoomEl);
}

/**
 * 關閉「來電中 / 通話中」的 UI
 * @param {HTMLElement|null} chatRoomEl
 */
export function cancelCallRequest(chatRoomEl) {
  console.log("[calling] cancelCallRequest");
  if (!chatRoomEl) return;
  uiCancelCallRequest(chatRoomEl);
}

/**
 * 註冊所有通話相關事件到 eventBus
 */
export function registerCallHandlers() {
  // 使用者點「語音通話」
  eventBus.on("start-voice-call", (params) => {
    const { target_id } = params || {};
    console.log("[event] start-voice-call:", { target_id });
    openCallPage(target_id, false);
  });

  // 使用者點「視訊通話」
  eventBus.on("start-video-call", (params) => {
    const { target_id } = params || {};
    console.log("[event] start-video-call:", { target_id });
    openCallPage(target_id, true);
  });

  // 來電被取消（或主叫掛斷） → 關閉來電提示
  eventBus.on("call-TurnOffCall", async (params) => {
    const { from_id } = params || {};
    console.log("[event] call-TurnOffCall:", { from_id });
    if (!from_id){ 
	    return;
    }

    // 封鎖名單過濾
    try {
      const blockList = await getCurrentUserBlockList_Global();
      if (Array.isArray(blockList) && blockList.includes(from_id)) {
        console.log("[event] call-request: caller in block list → ignore");
        return;
      }
    } catch (e) {
      console.warn("[event] call-request: block list check failed:", e);
    }

    const chatRoomEl = await getChatRoomEl(from_id);
    if(chatRoomEl){
       cancelCallRequest(chatRoomEl);
    }
  });

  eventBus.on("agreeCall:sync", async (params) => {
    const { agreeWhom } = params || {};
    console.log("[event] agreeCall:sync", params);
    const chatRoomEl = await getChatRoomEl(agreeWhom);
    if(chatRoomEl){
       cancelCallRequest(chatRoomEl);
    }
  });

  // 收到來電（顯示來電提示 UI）
  eventBus.on("call-request", async (params) => {
    const { from_id } = params || {};
    console.log("[event] call-request:", { from_id });
    if (!from_id) return;

    // 封鎖名單過濾
    try {
      const blockList = await getCurrentUserBlockList_Global();
      if (Array.isArray(blockList) && blockList.includes(from_id)) {
        console.log("[event] call-request: caller in block list → ignore");
        return;
      }
    } catch (e) {
      console.warn("[event] call-request: block list check failed:", e);
    }

    const chatRoomEl = await getChatRoomEl(from_id);
    if (chatRoomEl) {
      showCallRequest(chatRoomEl);
    }
  });

  // 接受「視訊」來電
  eventBus.on("accept-video-call", async (params) => {
    const { user_id } = params || {};
    console.log("[event] accept-video-call:", { user_id });
    if (!user_id) return;

    openAcceptCallPage(user_id, true);

    const chatRoomEl = await getChatRoomEl(user_id);
    cancelCallRequest(chatRoomEl);
  });

  // 接受「語音」來電
  eventBus.on("accept-voice-call", async (params) => {
    const { user_id } = params || {};
    console.log("[event] accept-voice-call:", { user_id });
    if (!user_id) return;

    openAcceptCallPage(user_id, false);

    const chatRoomEl = await getChatRoomEl(user_id);
    cancelCallRequest(chatRoomEl);
  });

  // 拒絕來電（僅關掉提示 UI）
  eventBus.on("reject-call", async (params) => {
    const { user_id } = params || {};
    console.log("[event] reject-call:", { user_id });
    if (!user_id) return;

    const chatRoomEl = await getChatRoomEl(user_id);
    cancelCallRequest(chatRoomEl);
  });
  eventBus.on("call-notifyCallSuccess", async (params) => {
    try {
      const { from_id } = params || {};
      if (!from_id) return;

      const chatRoomEl = await getChatRoomEl(from_id);
      cancelCallRequest(chatRoomEl);

    } catch (err) {
      console.error("[call-notifyCallSuccess] handler error:", err);
    }
  });


  console.log("✅ registerCallHandlers: calling events registered.");
}

