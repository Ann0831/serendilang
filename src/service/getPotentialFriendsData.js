// ./service/potentialFriendsService.js
import { getPotentialFriends, getUserLanguage, getProfilePictureUrl } from "../api/api.js";

/**
 * ✅ 取得潛在好友清單
 * @returns {Promise<{ status: string, data: Array }>}
 *import { getPotentialFriends, getUserLanguage, getProfilePictureUrl } from "../api/api.js";

/**
 * Service: 取得所有潛在朋友
 * @returns {Promise<Array>} - 成功回傳潛在朋友陣列，失敗則 []
 */
export async function getAllPotentialFriends() {
  try {
    const res = await getPotentialFriends();

    if (res?.status === "success" && Array.isArray(res.data)) {
      return res.data;
    }

    console.warn("⚠️ getAllPotentialFriends: 回傳格式不符或失敗:", res);
    return [];
  } catch (err) {
    console.error("❌ getAllPotentialFriends error:", err);
    return [];
  }
}

/**
 * Service: 擴充潛在朋友卡片資料（語言、頭貼）
 * @param {Object} conv - 原始潛在朋友資料
 * @returns {Promise<Object>} - 加上 language 與 profilePicUrl 的完整資料
 */
export async function enrichPotentialFriendCardData(conv) {
  const userId = conv?.user_id;
  if (!userId) return conv;

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
      "✅ enrichPotentialFriendCardData extra:",
      extra
    );

    return { ...conv, ...extra };
  } catch (err) {
    console.error("❌ enrichPotentialFriendCardData error:", err);
    return conv;
  }
}

