// /event/handlers/friendRequests.js
import { eventBus } from "/utils/eventBus.js";

// UI 控制層：卡片上的動作
import { handleAddFriendClick } from "/ui_controll/renderPotentialFriendCard.js";
import { handleAcceptButtonClick } from "/ui_controll/renderFriendRequestCard.js";


import { sendWssMessage_wssCenter } from "/wss/wssCenter.js";

import {updateUnreadAcceptFriendDot,updateUnreadFriendRequestDot} from "/pages/refreshMenuDot.js";

/** 送出好友邀請 */
export function sendFriendRequest(target_id, el) {
  if (!target_id) {
    console.warn("[friendRequests] sendFriendRequest: missing target_id");
    return;
  }
  console.log("[friendRequests] sendFriendRequest:", { target_id });
  // el 常用於更新按鈕狀態 / loading 樣式
  handleAddFriendClick(el || null, target_id);
}

/** 接受好友邀請 */
export function acceptFriendRequest(target_id, el) {
  if (!target_id) {
    console.warn("[friendRequests] acceptFriendRequest: missing target_id");
    return;
  }
  console.log("[friendRequests] acceptFriendRequest:", { target_id });
  handleAcceptButtonClick(el || null, target_id);
}

/** 集中註冊：好友請求事件 */
export function registerFriendRequestHandlers() {
  // 點擊「加好友」按鈕
  eventBus.on("sendFriendRequest", (params, el) => {
    const { target_id } = params || {};
    console.log("[event] sendFriendRequest:", params);
    sendFriendRequest(target_id, el);
  });

  // 點擊「接受好友邀請」按鈕
  eventBus.on("acceptFriendRequest", (params, el) => {
    const { target_id } = params || {};
    console.log("[event] acceptFriendRequest:", params);
    acceptFriendRequest(target_id, el);
  });

  eventBus.on("sendFriendRequest:Complete", (params, el) => {
    const { target_id } = params || {};
    console.log("[event] sendFriendRequest:Complete ", params);
    sendWssMessage_wssCenter("sendFriendRequest", {towhom: target_id });  
  });

  // 點擊「接受好友邀請」按鈕
  eventBus.on("acceptFriendRequest:Complete", (params, el) => {
    const { target_id } = params || {};
    console.log("[event] acceptFriendRequest:Complete", params);
    sendWssMessage_wssCenter("acceptFriendRequest", {towhom: target_id });
  });

  eventBus.on("receiveFriendRequest:wss", async (params) => {
    console.log("receiveFriendRequest:wss  params: ",params);
    const { from_id } = params || {};
    if (!from_id) return;

    // 封鎖過濾
    try {
      const blockList = await getCurrentUserBlockList_Global();
      if (Array.isArray(blockList) && blockList.includes(from_id)) return;
    } catch (e) {
      console.warn("receiveFriendRequest:wss block list check failed:", e);
    }

    await updateUnreadFriendRequestDot();
  });

  eventBus.on("receiveAcceptFriendRequest:wss", async (params) => {
    console.log("receiveAcceptFriendRequest:wss  params: ",params);
    const { from_id } = params || {};
    if (!from_id) return;

    // 封鎖過濾
    try {
      const blockList = await getCurrentUserBlockList_Global();
      if (Array.isArray(blockList) && blockList.includes(from_id)) return;
    } catch (e) {
      console.warn("receiveAcceptFriendRequest:wss", e);
    }

    await updateUnreadAcceptFriendDot();
  });

  console.log("✅ registerFriendRequestHandlers: friend request events registered.");
}

