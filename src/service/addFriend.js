import { postAddFriend } from "../api/post_api.js";

/**
 * Service 層：發送好友請求
 * @param {string|number} targetId - 對方的 external user id
 * @returns {Promise<boolean>} - true 表示成功，false 表示失敗
 */
export async function addFriend(targetId) {
  try {
    const res = await postAddFriend(targetId);
    return res?.status === "success";
  } catch (err) {
    console.error("addFriend error:", err);
    return false;
  }
}

