import { handleServiceNetworkError } from "./networkErrorHandler.js";
// /service/fetchOnlineUserData.js
import { getUserLanguage, getProfilePictureUrl, getUsernameById } from "../api/api.client.js";

/**
 * ✅ Service：下載並組合使用者的詳細資料
 * @param {string} targetId - 使用者 external ID
 * @returns {Promise<object>} 使用者詳細資料物件
 */
export async function fetchOnlineUserData(targetId) {
  if (!targetId) {
    console.warn("[Service:fetchOnlineUserData] ⚠️ 缺少 targetId");
    return {};
  }

  try {
    console.log("[Service:fetchOnlineUserData] fetching user info for:", targetId);

    // 並行請求
    const [langSettled, profileSettled, usernameSettled] = await Promise.allSettled([
      getUserLanguage(targetId),
      getProfilePictureUrl(targetId),
      getUsernameById(targetId),
    ]);
    if (langSettled.status === "rejected") handleServiceNetworkError(langSettled.reason, "fetchOnlineUserData.js");
    if (profileSettled.status === "rejected") handleServiceNetworkError(profileSettled.reason, "fetchOnlineUserData.js");
    if (usernameSettled.status === "rejected") handleServiceNetworkError(usernameSettled.reason, "fetchOnlineUserData.js");
    const langRes = langSettled.status === "fulfilled" ? langSettled.value : null;
    const profileRes = profileSettled.status === "fulfilled" ? profileSettled.value : null;
    const usernameRes = usernameSettled.status === "fulfilled" ? usernameSettled.value : null;

    // ✅ 統一檢查語言資料
    const langData =
      langRes && langRes.status === "success" && langRes.data
        ? langRes.data
        : {};

    // ✅ 統一檢查頭像
    const profileUrl =
      profileRes && profileRes.status === "success" && profileRes.data
        ? profileRes.data
        : `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`;

    const result = {
      userId: targetId,
      username:
        usernameRes && usernameRes.status === "success" && usernameRes.data
          ? usernameRes.data
          : "",
      ...langData,
      profilePicture: profileUrl,
    };

    console.log("[Service:fetchOnlineUserData] ✅ 組合結果:", result);
    return result;
  } catch (err) {
    handleServiceNetworkError(err, "fetchOnlineUserData.js");
    console.error("[Service:fetchOnlineUserData] ❌ exception:", err);
    // ⚠️ 保底 fallback
    return { userId: targetId, profilePicture: `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg` };
  }
}
