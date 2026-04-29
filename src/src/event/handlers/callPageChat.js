import { eventBus } from "../../utils/eventBus.js";
import { getCurrentUserBlockList_Global } from "../../userSelfData/userSelfData.js";
import { sendWssMessage_wssCenter } from "../../wss/wssCenter.js";
import { getChatMessages } from "../../service/getChatRoomData.js";
import { sendMessageData } from "../../service/sendMessageData.js";
import {
  isCallPageChatEnabled,
  isCallPageChatTarget,
} from "../../pages/callPageChat.js";

let __callPageChatHandlersRegistered = false;

// Call page chat-only event bridge.
// Intentionally excludes any incoming-call events.
export function registerCallPageChatHandlers() {
  if (__callPageChatHandlersRegistered) return;

  eventBus.on("receiveChatRoomMessage:wss", async (params = {}) => {
    console.log("callpage ---  receiveChatRoomMessage:wss")
    const fromId = String(params?.from_id || "");
    if (!fromId) return;
    if (!isCallPageChatEnabled()) return;
    if (!isCallPageChatTarget(fromId)) return;

    try {
      const blockList = await getCurrentUserBlockList_Global();
      if (Array.isArray(blockList) && blockList.includes(fromId)) return;
    } catch (e) {
      console.warn("[callPageChat] receiveChatRoomMessage:wss: block list check failed:", e);
    }

    eventBus.emit("callPage:chatSyncRequested", {
      from_id: fromId,
      to_id: "",
      source: "receive",
    });
  });

  eventBus.on("sendChatRoomMessage:sync", async (params = {}) => {
    const fromId = String(params?.from_id || "");
    const toId = String(params?.to_id || "");
    if (!fromId && !toId) return;
    if (!isCallPageChatEnabled()) return;
    if (!isCallPageChatTarget(fromId) && !isCallPageChatTarget(toId)) return;

    try {
      const blockList = await getCurrentUserBlockList_Global();
      if (Array.isArray(blockList) && (blockList.includes(fromId) || blockList.includes(toId))) return;
    } catch (e) {
      console.warn("[callPageChat] sendChatRoomMessage:sync: block list check failed:", e);
    }

    eventBus.emit("callPage:chatSyncRequested", {
      from_id: fromId,
      to_id: toId,
      source: "sync",
    });
  });

  eventBus.on("callPage:chatMessageSent", (params = {}) => {
    const toId = String(params?.to_id || "").trim();
    if (!toId) return;
    if (!isCallPageChatEnabled()) return;
    if (!isCallPageChatTarget(toId)) return;

    sendWssMessage_wssCenter("sendChatRoomMessage", {
      fromwhom: null,
      towhom: toId,
    });
  });

  eventBus.on("callPage:chatLoadRequested", async (params = {}) => {
    const requestId = String(params?.request_id || "").trim();
    const targetId = String(params?.target_id || "").trim();
    const amount = params?.amount;
    console.log("[callPageChat] chatLoadRequested", {
      requestId,
      targetId,
      amount,
    });
    if (!requestId || !targetId) return;
    if (!isCallPageChatEnabled()) return;
    if (!isCallPageChatTarget(targetId)) return;
    try {
      const rows = await getChatMessages(targetId, amount);
      console.log("[callPageChat] chatLoaded emit", {
        requestId,
        targetId,
        rows: Array.isArray(rows) ? rows.length : -1,
      });
      eventBus.emit("callPage:chatLoaded", {
        request_id: requestId,
        target_id: targetId,
        rows: Array.isArray(rows) ? rows : [],
      });
    } catch (error) {
      eventBus.emit("callPage:chatLoadFailed", {
        request_id: requestId,
        target_id: targetId,
        error: error?.message || "chat_load_failed",
      });
    }
  });

  eventBus.on("callPage:chatSendRequested", async (params = {}) => {
    const targetId = String(params?.target_id || "").trim();
    const text = String(params?.text || "");
    const pendingId = String(params?.pending_id || "");
    if (!targetId || !text) return;
    if (!isCallPageChatEnabled()) return;
    if (!isCallPageChatTarget(targetId)) return;
    try {
      const res = await sendMessageData(targetId, text);
      if (res?.result === "success") {
        eventBus.emit("callPage:chatMessageSent", {
          to_id: targetId,
          from: "event/callPageChat/send",
        });
        eventBus.emit("callPage:chatSendSucceeded", {
          target_id: targetId,
          pending_id: pendingId,
        });
        return;
      }
      eventBus.emit("callPage:chatSendFailed", {
        target_id: targetId,
        pending_id: pendingId,
        reason: "api_fail",
      });
    } catch (error) {
      eventBus.emit("callPage:chatSendFailed", {
        target_id: targetId,
        pending_id: pendingId,
        reason: error?.message || "exception",
      });
    }
  });

  __callPageChatHandlersRegistered = true;
}

export default registerCallPageChatHandlers;
