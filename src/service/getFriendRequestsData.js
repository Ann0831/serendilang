// ./service/getFriendRequestsData.js
import { getRequestedFriendData, getUserLanguage, getProfilePictureUrl } from "../api/api.js";

/**
 * Service 層：取得好友請求資料
 * - 統一以 res.status 判斷
 * - 若失敗則回傳空陣列
 */
export async function getAllFriendRequests() {
  try {
    const res = await getRequestedFriendData();

    if (res?.status === "success" && Array.isArray(res.data)) {
      return res.data.reverse();
    }

    console.warn("⚠️ getAllFriendRequests: 回傳非 success 或格式不符:", res);
    return [];
  } catch (err) {
    console.error("❌ getAllFriendRequests error:", err);
    return [];
  }
}

/**
 * Service 層：擴充好友請求卡片資料（語言、頭貼）
 * @param {Object} req - 原始好友請求資料
 * @returns {Promise<Object>} - 加上 language 與 profilePicUrl 的完整資料
 */
export async function enrichFriendRequestCardData(req) {
  const userId = req?.sender_id;
  if (!userId) return req;

  try {
    const [langRes, picRes] = await Promise.all([
      getUserLanguage(userId),
      getProfilePictureUrl(userId),
    ]);

    const language =
      langRes?.status === "success" ? langRes.data : {};
    const profilePicUrl =
      picRes?.status === "success"
        ? picRes.data
        : "/assets/images/defaultAvatar.svg";

    const extra = { language, profilePicUrl };

    console.log(
      "✅ enrichFriendRequestCardData extra:",
      extra
    );

    return { ...req, ...extra };
  } catch (err) {
    console.error("❌ enrichFriendRequestCardData error:", err);
    return req;
  }
}

