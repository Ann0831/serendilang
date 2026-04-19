// /event/handlers/chatRoom.js
import { eventBus } from "../../utils/eventBus.js";
import {updateUnreadMessageDot} from "../../pages/refreshMenuDot.js" ;
// Page 層
import {
  openChatRoom as pageOpenChatRoom,
  closeChatRoom as pageCloseChatRoom,
  handleLoadMoreMessages as pageHandleLoadMoreMessages,
  checkChatRoomStatus as pageCheckChatRoomStatus,
  initChatRoomsContainer,
  appendPendingOutgoingMessage,
  confirmOutgoingMessageSent,
  markOutgoingMessageFailed,
  reconcileChatRoomWithLatest,
} from "../../pages/chatRoomsContainer.js";
import {
  bumpConversationActivity,
  refreshSingleConversation
} from "../../pages/messagesScreenPage.js";

// 使用者狀態 / 封鎖名單
import {
  getCurrentUserIdentity_Global,
  getCurrentUserBlockList_Global,
} from "../../userSelfData/userSelfData.js";
import { sendMessageData } from "../../service/sendMessageData.js";
import { markConversationAsRead } from "../../service/markIsRead.js";

// WSS
import { sendWssMessage_wssCenter } from "../../wss/wssCenter.js";

// Utils
import { findDirectChildByUserId } from "../../utils/Dom/find.js";

/** 取得（或建立）指定 userId 的聊天室 DOM 元素 */
async function getChatRoomEl(userId) {
  if (!userId) return null;
  const container = await pageOpenChatRoom(userId);
  if (!container) return null;
  return findDirectChildByUserId(container, userId);
}

async function waitChatRoomEl(userId, retries = 8, waitMs = 40) {
  for (let i = 0; i < retries; i += 1) {
    const el = await getChatRoomEl(userId);
    if (el) return el;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  return null;
}

function closeAllChatRoomMenus(exceptMenuId = "") {
  document.querySelectorAll("[id^='ChatRoom_Menu-']").forEach((el) => {
    if (!exceptMenuId || el.id !== exceptMenuId) {
      el.classList.add("hidden");
    }
  });
}

/** =============== 事件註冊 =============== */
export function registerChatRoomHandlers() {
  /** 開啟聊天室 */
  eventBus.on("openChatRoom", async (params) => {
    const { user_id } = params || {};
    if (!user_id) return;
    closeAllChatRoomMenus();
    const chatRoomEl = await waitChatRoomEl(user_id);
    if (chatRoomEl) {
      await pageHandleLoadMoreMessages(chatRoomEl, { toBottom: "true", amount: "20" });
    }
    await markConversationAsRead(user_id);
    await refreshSingleConversation(user_id);
    await updateUnreadMessageDot();
  });

  /** 關閉聊天室 */
  eventBus.on("closeChatRoom", async (params) => {
    const { user_id } = params || {};
    if (!user_id) return;
    closeAllChatRoomMenus();
    await pageCloseChatRoom(user_id);
  });



  /** 聊天室滾動（僅到頂部載入更多） */
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

    // 只在「到頂部」才載入更多，並用 latch 避免停在頂部連續觸發
    if (typeof scrollTop !== "number") return;
    const topLatch = wrapper?._topLoadLatch === true;
    if (scrollTop > 8 && wrapper) {
      wrapper._topLoadLatch = false;
      return;
    }
    if (
      scrollTop <= 5 &&
      !topLatch &&
      typeof scrollHeight === "number" &&
      typeof clientHeight === "number" &&
      scrollHeight > clientHeight + 1
    ) {
      if (wrapper) wrapper._topLoadLatch = true;
      pageHandleLoadMoreMessages(wrapper, { showSpinner: "true", keepLoc: "true" });
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

    await pageOpenChatRoom(from_id);
    const chatRoomEl = await waitChatRoomEl(from_id);
    if (chatRoomEl) {
      await pageHandleLoadMoreMessages(chatRoomEl, { toBottom: "true", amount: "20" });
    }
    await markConversationAsRead(from_id);
    refreshSingleConversation(from_id);
    await updateUnreadMessageDot();
  });

  /** 送出訊息（直接 service 寫入） */
  eventBus.on("sendMessage", async (params, el) => {
    const { user_id } = params || {};
    if (!user_id) return;

    let text = (params?.text || "").trim();
    if (!text && el) {
      const chatRoomEl = el.closest('[data-chatroom-root="true"]');
      const inputEl = chatRoomEl?.querySelector("textarea[data-action='chat-input']");
      text = (inputEl?.value || "").trim();
      if (inputEl && text) inputEl.value = "";
    }
    if (!text) return;

    const pendingId = appendPendingOutgoingMessage(user_id, text);
    const res = await sendMessageData(user_id, text);
    if (res?.result === "success") {
      const sentAtMs = Date.now();
      confirmOutgoingMessageSent(user_id, pendingId, res);
      await reconcileChatRoomWithLatest(user_id, 20);
      eventBus.emit("sendMessage:Complete", {
        target_id: user_id,
        pending_id: pendingId,
        timestamp_ms: sentAtMs,
        timestamp: new Date(sentAtMs).toISOString(),
        messageText: text,
      });
    } else {
      markOutgoingMessageFailed(user_id, pendingId);
      await reconcileChatRoomWithLatest(user_id, 20);
    }
  });

  /**
   * 訊息送出完成後 → 通知 WSS 做同步（主動告知對方）
   * params: { target_id }
   */
  eventBus.on("sendMessage:Complete", (params) => {
    const { target_id, timestamp_ms, timestamp, messageText } = params || {};
    if (!target_id) return;

    // fromwhom 目前留空/null（可視需求補上）
    const user_id = null;
    sendWssMessage_wssCenter("sendChatRoomMessage", { fromwhom: user_id, towhom: target_id });
    bumpConversationActivity(target_id, {
      timestamp_ms: timestamp_ms || Date.now(),
      timestamp: timestamp || undefined,
      messageText: messageText || "",
      sender_id: "self",
      is_read: 1,
    });
    refreshSingleConversation(target_id, {
      forceTop: true,
      optimisticTimestampMs: timestamp_ms || Date.now(),
    });
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
      pageHandleLoadMoreMessages(chatRoomEl, { toBottom: "true", amount: "20" });
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
    closeAllChatRoomMenus(menuId);

    // 切換當前
    menu.classList.toggle("hidden");
  });

  eventBus.on("chatRoomMenuCloseAll", () => {
    closeAllChatRoomMenus();
  });

  eventBus.on("chatRoomMenuReport", (params) => {
    const { target_id, target_name } = params || {};
    if (!target_id) return;
    closeAllChatRoomMenus();
    eventBus.emit("openReportUserModal", {
      target_id,
      target_name: target_name || "Unknown",
      from: "chatRoom/menu/report",
    });
  });

  eventBus.on("chatRoomMenuBlock", (params) => {
    const { target_id, target_name } = params || {};
    if (!target_id) return;
    closeAllChatRoomMenus();
    eventBus.emit("openBlockUserModal", {
      target_id,
      target_name: target_name || "Unknown",
      from: "chatRoom/menu/block",
    });
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
