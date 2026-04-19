// /event/handlers/calling.js
import { eventBus } from "../../utils/eventBus.js";

// page / route 層
import { openChatRoom, setChatRoomIncomingCall } from "../../pages/chatRoomsContainer.js";
import { openCallPage as routeOpenCallPage, openAcceptCallPage as routeOpenAcceptCallPage } from "../../route/openCallPage.js";

// userSelfData / utils / ui 控制
import { getCurrentUserBlockList_Global } from "../../userSelfData/userSelfData.js";
import { sendWssMessage_wssCenter } from "../../wss/wssCenter.js";
import { soundPlayer } from "../../utils/soundPlayer.js";

const INCOMING_CALL_SOUND_URL = `${import.meta.env.BASE_URL}assets/sounds/incoming_call_sound.mp3`;

/**
 * 取得（或建立）指定 userId 的聊天室 DOM 元素
 * @param {string} userId
 * @returns {Promise<HTMLElement|null>}
 */
async function ensureChatRoomOpened(userId) {
  if (!userId) return null;
  return openChatRoom(userId);
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
 * @param {string} userId
 */
export function showCallRequest(userId) {
  console.log("[calling] showCallRequest");
  if (!userId) return;
  setChatRoomIncomingCall(userId, true);
  try {
    soundPlayer.loop(INCOMING_CALL_SOUND_URL, 1);
  } catch (err) {
    console.warn("[calling] incoming call sound play failed:", err);
  }
}

/**
 * 關閉「來電中 / 通話中」的 UI
 * @param {string} userId
 */
export function cancelCallRequest(userId) {
  console.log("[calling] cancelCallRequest");
  if (!userId) return;
  setChatRoomIncomingCall(userId, false);
  try {
    soundPlayer.stop(INCOMING_CALL_SOUND_URL);
  } catch (err) {
    console.warn("[calling] incoming call sound stop failed:", err);
  }
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

    const chatRoomEl = await ensureChatRoomOpened(from_id);
    if (chatRoomEl) cancelCallRequest(from_id);
  });

  eventBus.on("agreeCall:sync", async (params) => {
    const { agreeWhom } = params || {};
    console.log("[event] agreeCall:sync", params);
    const chatRoomEl = await ensureChatRoomOpened(agreeWhom);
    if (chatRoomEl) cancelCallRequest(agreeWhom);
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

    const chatRoomEl = await ensureChatRoomOpened(from_id);
    if (chatRoomEl) showCallRequest(from_id);
  });

  // 接受「視訊」來電
  eventBus.on("accept-video-call", async (params) => {
    const { user_id } = params || {};
    console.log("[event] accept-video-call:", { user_id });
    if (!user_id) return;

    openAcceptCallPage(user_id, true);

    await ensureChatRoomOpened(user_id);
    cancelCallRequest(user_id);
  });

  // 接受「語音」來電
  eventBus.on("accept-voice-call", async (params) => {
    const { user_id } = params || {};
    console.log("[event] accept-voice-call:", { user_id });
    if (!user_id) return;

    openAcceptCallPage(user_id, false);

    await ensureChatRoomOpened(user_id);
    cancelCallRequest(user_id);
  });

  // 拒絕來電（僅關掉提示 UI）
  eventBus.on("reject-call", async (params) => {
    const { user_id, silent } = params || {};
    console.log("[event] reject-call:", { user_id });
    if (!user_id) return;
    if (!silent) {
      sendWssMessage_wssCenter("cancelCallRequest", { towhom: user_id });
    }

    await ensureChatRoomOpened(user_id);
    cancelCallRequest(user_id);
  });
  eventBus.on("call-notifyCallSuccess", async (params) => {
    try {
      const { from_id } = params || {};
      if (!from_id) return;

      await ensureChatRoomOpened(from_id);
      cancelCallRequest(from_id);

    } catch (err) {
      console.error("[call-notifyCallSuccess] handler error:", err);
    }
  });


  console.log("✅ registerCallHandlers: calling events registered.");
}
