import {
  postSetFriendRequestRead,
  postSetAcceptFriendRead,
  setMessageRead
} from "../api/post_api.js";


/**
 * Service 層：標記指定對話訊息為已讀
 * @param {string|number} targetId - 對方 external user id
 * @returns {Promise<boolean>} - true 表示成功，false 表示失敗
 */
export async function markConversationAsRead(targetId) {
  try {
    const res = await setMessageRead(targetId);
    return res?.status === "success";
  } catch (err) {
    console.error("❌ markConversationAsRead error:", err);
    return false;
  }
}

/**
 * Service 層：標記所有好友邀請為已讀
 * @returns {Promise<boolean>}
 */
export async function markFriendRequestsAsRead() {
  try {
    const res = await postSetFriendRequestRead();
    return res?.status === "success";
  } catch (err) {
    console.error("❌ markFriendRequestsAsRead error:", err);
    return false;
  }
}

/**
 * Service 層：標記所有已接受好友邀請為已讀
 * @returns {Promise<boolean>}
 */
export async function markAcceptedFriendsAsRead() {
  try {
    const res = await postSetAcceptFriendRead();
    return res?.status === "success";
  } catch (err) {
    console.error("❌ markAcceptedFriendsAsRead error:", err);
    return false;
  }
}

