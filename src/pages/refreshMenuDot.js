// ./scripts/unreadDotsController.js
import {
  fetchUnreadMessageCountService,
  fetchUnreadFriendRequestCountService,
  fetchUnreadAcceptFriendCountService,
} from "/service/unreadService.js";

/**
 * ✅ 更新導覽列的紅點顯示狀態
 */
export async function updateUnreadDots() {
  try {
    // 並行請求，提高速度
    const [
      msgRes,
      friendReqRes,
      acceptRes
    ] = await Promise.all([
      fetchUnreadMessageCountService(),
      fetchUnreadFriendRequestCountService(),
      fetchUnreadAcceptFriendCountService(),
    ]);

    // --- 找到紅點元素 ---
    const msgDot = document.getElementById("unread-message-dot");
    const friendReqDot = document.getElementById("unread-friendrequest-dot");
    const acceptDot = document.getElementById("unread-acceptfriend-dot");

    // --- 根據未讀數決定顯示或隱藏 ---
    if (msgRes?.count > 0) {
      msgDot?.classList.remove("hidden");
    } else {
      msgDot?.classList.add("hidden");
    }

    if (friendReqRes?.count > 0) {
      friendReqDot?.classList.remove("hidden");
    } else {
      friendReqDot?.classList.add("hidden");
    }

    if (acceptRes?.count > 0) {
      acceptDot?.classList.remove("hidden");
    } else {
      acceptDot?.classList.add("hidden");
    }

    console.log("[updateUnreadDots] ✅ 更新完成", {
      msgCount: msgRes?.count,
      friendReqCount: friendReqRes?.count,
      acceptCount: acceptRes?.count,
    });
  } catch (err) {
    console.error("[updateUnreadDots] ❌ 更新失敗:", err);
  }
}


// ✅ 只更新訊息紅點
export async function updateUnreadMessageDot() {
  try {
    const msgRes = await fetchUnreadMessageCountService();
    const msgDot = document.getElementById("unread-message-dot");

    if (msgRes?.count > 0) {
      msgDot?.classList.remove("hidden");
    } else {
      msgDot?.classList.add("hidden");
    }

    console.log("[updateUnreadMessageDot] ✅ 更新完成", { msgCount: msgRes?.count });
  } catch (err) {
    console.error("[updateUnreadMessageDot] ❌ 更新失敗:", err);
  }
}


// ✅ 只更新好友邀請紅點
export async function updateUnreadFriendRequestDot() {
  try {
    const friendReqRes = await fetchUnreadFriendRequestCountService();
    const friendReqDot = document.getElementById("unread-friendrequest-dot");

    if (friendReqRes?.count > 0) {
      friendReqDot?.classList.remove("hidden");
    } else {
      friendReqDot?.classList.add("hidden");
    }

    console.log("[updateUnreadFriendRequestDot] ✅ 更新完成", { friendReqCount: friendReqRes?.count });
  } catch (err) {
    console.error("[updateUnreadFriendRequestDot] ❌ 更新失敗:", err);
  }
}


// ✅ 只更新已接受好友紅點
export async function updateUnreadAcceptFriendDot() {
  try {
    const acceptRes = await fetchUnreadAcceptFriendCountService();
    const acceptDot = document.getElementById("unread-acceptfriend-dot");

    if (acceptRes?.count > 0) {
      acceptDot?.classList.remove("hidden");
    } else {
      acceptDot?.classList.add("hidden");
    }

    console.log("[updateUnreadAcceptFriendDot] ✅ 更新完成", { acceptCount: acceptRes?.count });
  } catch (err) {
    console.error("[updateUnreadAcceptFriendDot] ❌ 更新失敗:", err);
  }
}

