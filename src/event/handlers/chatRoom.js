// /event/handlers/chatRoom.js
import { eventBus } from "/utils/eventBus.js";
import {updateUnreadMessageDot} from "/pages/refreshMenuDot.js" ;
// Page 層
import {
  openChatRoom as pageOpenChatRoom,
  closeChatRoom as pageCloseChatRoom,
  handleLoadMoreMessages as pageHandleLoadMoreMessages,
  checkChatRoomStatus as pageCheckChatRoomStatus,
  initChatRoomsContainer
} from "/pages/chatRoomsContainer.js";
import {
  refreshSingleConversation
} from "/pages/messagesScreenPage.js";

// UI 控制層
import { sendMessage as uiSendMessage } from "/ui_controll/renderChatRoom.js";

// 使用者狀態 / 封鎖名單
import {
  getCurrentUserIdentity_Global,
  getCurrentUserBlockList_Global,
} from "/user_identity/user_identity.js";

// WSS
import { sendWssMessage_wssCenter } from "/wss/wssCenter.js";

// Utils
import { findDirectChildByUserId } from "/utils/Dom/find.js";

/** 取得（或建立）指定 userId 的聊天室 DOM 元素 */
async function getChatRoomEl(userId) {
  if (!userId) return null;
  const container = await pageOpenChatRoom(userId);
  if (!container) return null;
  return findDirectChildByUserId(container, userId);
}

/** =============== 事件註冊 =============== */
export function registerChatRoomHandlers() {
  /** 開啟聊天室 */
  eventBus.on("openChatRoom", async (params) => {
    const { user_id } = params || {};
    if (!user_id) return;
    await pageOpenChatRoom(user_id);
  });

  /** 關閉聊天室 */
  eventBus.on("closeChatRoom", async (params) => {
    const { user_id } = params || {};
    if (!user_id) return;
    await pageCloseChatRoom(user_id);
  });



  /** 聊天室滾動（頂端載入更多） */
  eventBus.on("ChatRoomScroll", (params, el) => {
    const { user_id, scrollTop, scrollHeight, clientHeight } = params || {};
    if (!el || !user_id) return;

    // 緩存當下滾動狀態（可用於回填）
    const wrapper = el?.parentElement;
    if (wrapper) {
      wrapper._scrollCache = {
        top: scrollTop,
        height: scrollHeight,
        client: clientHeight,
      };
    }

    // 滾到頂就載入更多
    if (typeof scrollTop === "number" && scrollTop <= 5) {
      pageHandleLoadMoreMessages(el.parentElement, { showSpinner: "true", keepLoc: "true" });
    }
  });

  /**
   * 從 WSS 收到訊息 → 自動打開聊天室並抓最新 10 則到底
   * params: { from_id }
   */
  eventBus.on("receiveChatRoomMessage:wss", async (params) => {
    console.log("receiveChatRoomMessage:wss  params: ",params);
    const { from_id } = params || {};
    if (!from_id) return;

    // 封鎖過濾
    try {
      const blockList = await getCurrentUserBlockList_Global();
      if (Array.isArray(blockList) && blockList.includes(from_id)) return;
    } catch (e) {
      console.warn("[chatRoom] receiveChatRoomMessage:wss: block list check failed:", e);
    }

    const container = initChatRoomsContainer();
    if (!container) return;

    const openedContainer = await pageOpenChatRoom(from_id);
    const chatRoomEl = findDirectChildByUserId(openedContainer, from_id);
    if (chatRoomEl) {
      pageHandleLoadMoreMessages(chatRoomEl, { toBottom: "true", amount: "10" });
    }
    refreshSingleConversation(from_id);
    await updateUnreadMessageDot();
  });

  /** 送出訊息（UI 層組裝 + 寫入） */
  eventBus.on("sendMessage", (params, el) => {
    const { user_id } = params || {};
    if (!user_id || !el) return;

    
    const chatRoomEl = el.closest('[data-chatroom-root="true"]');
    if (!chatRoomEl) return;

    // 在該容器內尋找 textarea
    const inputEl = chatRoomEl.querySelector("textarea[data-action='chat-input']");
    if (!inputEl) return;

    uiSendMessage(chatRoomEl, inputEl, user_id);
  });

  /**
   * 訊息送出完成後 → 通知 WSS 做同步（主動告知對方）
   * params: { target_id }
   */
  eventBus.on("sendMessage:Complete", (params) => {
    const { target_id } = params || {};
    if (!target_id) return;

    // fromwhom 目前留空/null（可視需求補上）
    const user_id = null;
    sendWssMessage_wssCenter("sendChatRoomMessage", { fromwhom: user_id, towhom: target_id });
    refreshSingleConversation(target_id);
  });
    
  /**
   * 送出訊息後本地同步（主視角）
   * params: { from_id, to_id }
   */
  eventBus.on("sendChatRoomMessage:sync", async (params) => {
    const { from_id, to_id } = params || {};
    if (!from_id || !to_id) return;

    // 僅在「我就是發送者」時才處理
    let me = null;
    try {
      const identity = await getCurrentUserIdentity_Global();
      me = identity?.user_id ?? null;
    } catch (e) {
      console.warn("[chatRoom] sendChatRoomMessage:sync: identity fetch failed:", e);
    }
    if (!me || me !== from_id) return;

    // 封鎖過濾（避免載入被我封鎖對象的訊息）
    try {
      const blockList = await getCurrentUserBlockList_Global();
      if (Array.isArray(blockList) && blockList.includes(to_id)) return;
    } catch (e) {
      console.warn("[chatRoom] sendChatRoomMessage:sync: block list check failed:", e);
    }

    const container = document.getElementById("chatRoomsContainer");
    if (!container) return;

    const openedContainer = await pageOpenChatRoom(to_id);
    const chatRoomEl = findDirectChildByUserId(openedContainer, to_id);
    if (chatRoomEl) {
      pageHandleLoadMoreMessages(chatRoomEl, { toBottom: "true", amount: "10" });
    }
  });

  /**
   * 切換聊天室的「更多選單」
   * params: { target_id }
   */
  eventBus.on("Toggle_ChatRoom_Menu", (params) => {
    const { target_id } = params || {};
    if (!target_id) return;

    const menuId = `ChatRoom_Menu-${target_id}`;
    const menu = document.getElementById(menuId);
    if (!menu) return;

    // 關掉其他開啟的聊天選單
    document.querySelectorAll("[id^='ChatRoom_Menu-']").forEach((el) => {
      if (el.id !== menuId) el.classList.add("hidden");
    });

    // 切換當前
    menu.classList.toggle("hidden");
  });

  // ✅ emoji 選單開關事件
  eventBus.on("toggleEmojiMenu", (params, el) => {
    const { user_id } = params || {};
    if (!user_id || !el) return;

    const menu = document.getElementById(`EmojiMenu-${user_id}`);
    if (!menu) return;

    // 先記錄目前是否為 hidden
    const wasHidden = menu.classList.contains("hidden");

    // 🔒 關閉所有其他 emojiMenu
    document.querySelectorAll("[id^='EmojiMenu-']").forEach(m => m.classList.add("hidden"));


    // 🔁 如果原本是 hidden，就打開；否則保持關閉
    if (wasHidden) menu.classList.remove("hidden");
  });


  console.log("✅ registerChatRoomHandlers: chat room events registered.");
}

/** =============== 如需在其他地方直接用到的 API（可選） =============== */
export const openChatRoom = pageOpenChatRoom;
export const closeChatRoom = pageCloseChatRoom;
export const handleLoadMoreMessages = pageHandleLoadMoreMessages;
export const checkChatRoomStatus = pageCheckChatRoomStatus;

