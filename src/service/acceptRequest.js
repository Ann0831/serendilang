// /service/acceptFriendService.js
import { postAcceptFriendRequest } from "../api/post_api.js";

/**
 * ✅ Service 層：接受好友請求
 * @param {string|number} targetId - 對方 external user id
 * @returns {Promise<boolean>} - true 表示成功，false 表示失敗
 */
export async function acceptFriendRequest(targetId) {
  if (!targetId) {
    console.warn("[Service:acceptFriendRequest] ⚠️ 缺少 targetId");
    return false;
  }

  try {
    const res = await postAcceptFriendRequest(targetId);

    // ✅ 統一檢查 API 狀態
    if (res && res.status === "success") {
      console.log("[Service:acceptFriendRequest] ✅ 成功:", res);
      return true;
    }

    console.warn("[Service:acceptFriendRequest] ⚠️ 失敗或格式錯誤:", res);
    return false;
  } catch (err) {
    console.error("[Service:acceptFriendRequest] ❌ exception:", err);
    return false;
  }
}

