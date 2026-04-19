import { eventBus } from "../../utils/eventBus.js";
import { getCurrentUserBlockList_Global } from "../../userSelfData/userSelfData.js";
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

  __callPageChatHandlersRegistered = true;
}

export default registerCallPageChatHandlers;
