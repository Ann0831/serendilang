// /event/handlers/friendRequests.js
import { eventBus } from "../../utils/eventBus.js";
import { sendWssMessage_wssCenter } from "../../wss/wssCenter.js";
import { updateUnreadAcceptFriendDot, updateUnreadFriendRequestDot } from "../../pages/refreshMenuDot.js";
import { addFriend } from "../../service/addFriend.js";
import { acceptFriendRequest as acceptFriendRequestService } from "../../service/acceptRequest.js";
import { getCurrentUserBlockList_Global } from "../../userSelfData/userSelfData.js";
import {
  handleAcceptFriendRequest,
  scrollFriendRequestsLeft,
  scrollFriendRequestsRight,
  refreshFriendRequestsScrollState,
} from "../../pages/friendRequestsPage.js";
import {
  handleSendFriendRequestFromPotential,
  scrollPotentialFriendsLeft,
  scrollPotentialFriendsRight,
  refreshPotentialFriendsScrollState,
} from "../../pages/potentialFriendsPage.js";

/** 送出好友邀請 */
export function sendFriendRequest(target_id, el) {
  if (!target_id) {
    console.warn("[friendRequests] sendFriendRequest: missing target_id");
    return;
  }
  console.log("[friendRequests] sendFriendRequest:", { target_id });
  Promise.resolve(addFriend(target_id))
    .then((ok) => {
      if (ok) {
        eventBus.emit("sendFriendRequest:Complete", { target_id });
        if (el) {
          el.disabled = true;
          el.textContent = "Sent";
        }
      } else if (el) {
        el.disabled = false;
      }
    })
    .catch(() => {
      if (el) el.disabled = false;
    });
}

/** 接受好友邀請 */
export function acceptFriendRequest(target_id, el) {
  if (!target_id) {
    console.warn("[friendRequests] acceptFriendRequest: missing target_id");
    return;
  }
  console.log("[friendRequests] acceptFriendRequest:", { target_id });
  Promise.resolve(acceptFriendRequestService(target_id))
    .then((ok) => {
      if (ok) {
        eventBus.emit("acceptFriendRequest:Complete", { target_id });
        if (el) {
          el.disabled = true;
          el.textContent = "Accepted";
        }
      } else if (el) {
        el.disabled = false;
      }
    })
    .catch(() => {
      if (el) el.disabled = false;
    });
}

/** 集中註冊：好友請求事件 */
export function registerFriendRequestHandlers() {
  // 點擊「加好友」按鈕
  eventBus.on("sendFriendRequest", async (params, el) => {
    const { target_id } = params || {};
    console.log("[event] sendFriendRequest:", params);
    if (!target_id) return;

    if (params?.from === "ui/potential/add") {
      const ok = await handleSendFriendRequestFromPotential(target_id);
      if (ok) eventBus.emit("sendFriendRequest:Complete", { target_id });
      return;
    }

    sendFriendRequest(target_id, el);
  });

  // 點擊「接受好友邀請」按鈕
  eventBus.on("acceptFriendRequest", async (params, el) => {
    const { target_id } = params || {};
    console.log("[event] acceptFriendRequest:", params);
    if (!target_id) return;

    if (params?.from === "ui/friendRequests/accept") {
      const ok = await handleAcceptFriendRequest(target_id);
      if (ok) eventBus.emit("acceptFriendRequest:Complete", { target_id });
      return;
    }

    acceptFriendRequest(target_id, el);
  });

  eventBus.on("sendFriendRequest:Complete", (params, el) => {
    const { target_id } = params || {};
    console.log("[event] sendFriendRequest:Complete ", params);
    sendWssMessage_wssCenter("sendFriendRequest", {towhom: target_id });  
  });

  // 點擊「接受好友邀請」按鈕
  eventBus.on("acceptFriendRequest:Complete", async (params, el) => {
    const { target_id } = params || {};
    console.log("[event] acceptFriendRequest:Complete", params);
    sendWssMessage_wssCenter("acceptFriendRequest", {towhom: target_id });
    await updateUnreadAcceptFriendDot();
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

  eventBus.on("friendRequests:scrollLeft", () => {
    scrollFriendRequestsLeft();
  });

  eventBus.on("friendRequests:scrollRight", () => {
    scrollFriendRequestsRight();
  });

  eventBus.on("friendRequests:refreshScrollState", () => {
    refreshFriendRequestsScrollState();
  });

  eventBus.on("potentialFriends:scrollLeft", () => {
    scrollPotentialFriendsLeft();
  });

  eventBus.on("potentialFriends:scrollRight", () => {
    scrollPotentialFriendsRight();
  });

  eventBus.on("potentialFriends:refreshScrollState", () => {
    refreshPotentialFriendsScrollState();
  });

  console.log("✅ registerFriendRequestHandlers: friend request events registered.");
}
