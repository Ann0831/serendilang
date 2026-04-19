import { handleServiceNetworkError } from "./networkErrorHandler.js";
// ./service/potentialFriendsService.js
import { getPotentialFriends, getUserLanguage, getProfilePictureUrl } from "../api/api.client.js";

/**
 * ✅ 取得潛在好友清單
 * @returns {Promise<{ status: string, data: Array }>}
 *import { getPotentialFriends, getUserLanguage, getProfilePictureUrl } from "../api/api.client.js";

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
    handleServiceNetworkError(err, "getPotentialFriendsData.js");
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
    const [langSettled, picSettled] = await Promise.allSettled([
      getUserLanguage(userId),
      getProfilePictureUrl(userId),
    ]);
    if (langSettled.status === "rejected") handleServiceNetworkError(langSettled.reason, "getPotentialFriendsData.js");
    if (picSettled.status === "rejected") handleServiceNetworkError(picSettled.reason, "getPotentialFriendsData.js");
    const langRes = langSettled.status === "fulfilled" ? langSettled.value : null;
    const picRes = picSettled.status === "fulfilled" ? picSettled.value : null;

    const language =
      langRes?.status === "success"
        ? (langRes?.data && typeof langRes.data === "object"
          ? langRes.data
          : {
              nativelanguage:
                langRes?.nativelanguage ??
                langRes?.native_language ??
                langRes?.nativeLanguage ??
                "?",
              targetlanguage:
                langRes?.targetlanguage ??
                langRes?.target_language ??
                langRes?.targetLanguage ??
                "?",
            })
        : {};
    const profilePicUrl =
      picRes?.status === "success"
        ? picRes.data
        : `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`;

    const extra = { language, profilePicUrl };

    console.log(
      "✅ enrichPotentialFriendCardData extra:",
      extra
    );

    return { ...conv, ...extra };
  } catch (err) {
    handleServiceNetworkError(err, "getPotentialFriendsData.js");
    console.error("❌ enrichPotentialFriendCardData error:", err);
    return conv;
  }
}
