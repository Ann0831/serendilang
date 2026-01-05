// ./service/unreadService.js
import {
  getUnreadMessageCount,
  getUnreadFriendRequestCount,
  getUnreadAcceptFriendCount,
} from "/api/api.js";

/**
 * ✅ Service：取得未讀訊息數量
 * @returns {Promise<{ result: string, count?: number }>}
 */
export async function fetchUnreadMessageCountService() {
  try {
    const res = await getUnreadMessageCount();

    if (res && res.status === "success") {
      console.log("[Service:fetchUnreadMessageCountService] ✅ 成功:", res);
      return { result: "success", count: res.data ?? 0 };
    }

    console.warn("[Service:fetchUnreadMessageCountService] ⚠️ 失敗:", res);
    return { result: "fail", count: 0 };
  } catch (err) {
    console.error("[Service:fetchUnreadMessageCountService] ❌ 例外:", err);
    return { result: "fail", count: 0 };
  }
}

/**
 * ✅ Service：取得未讀好友邀請數量
 * @returns {Promise<{ result: string, count?: number }>}
 */
export async function fetchUnreadFriendRequestCountService() {
  try {
    const res = await getUnreadFriendRequestCount();

    if (res && res.status === "success") {
      console.log("[Service:fetchUnreadFriendRequestCountService] ✅ 成功:", res);
      return { result: "success", count: res.data ?? 0 };
    }

    console.warn("[Service:fetchUnreadFriendRequestCountService] ⚠️ 失敗:", res);
    return { result: "fail", count: 0 };
  } catch (err) {
    console.error("[Service:fetchUnreadFriendRequestCountService] ❌ 例外:", err);
    return { result: "fail", count: 0 };
  }
}

/**
 * ✅ Service：取得未讀「好友邀請被接受」通知數量
 * @returns {Promise<{ result: string, count?: number }>}
 */
export async function fetchUnreadAcceptFriendCountService() {
  try {
    const res = await getUnreadAcceptFriendCount();

    if (res && res.status === "success") {
      console.log("[Service:fetchUnreadAcceptFriendCountService] ✅ 成功:", res);
      return { result: "success", count: res.data ?? 0 };
    }

    console.warn("[Service:fetchUnreadAcceptFriendCountService] ⚠️ 失敗:", res);
    return { result: "fail", count: 0 };
  } catch (err) {
    console.error("[Service:fetchUnreadAcceptFriendCountService] ❌ 例外:", err);
    return { result: "fail", count: 0 };
  }
}

