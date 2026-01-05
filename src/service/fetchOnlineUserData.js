// /service/fetchOnlineUserData.js
import { getUserLanguage, getProfilePictureUrl } from "../api/api.js";

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
    const [langRes, profileRes] = await Promise.all([
      getUserLanguage(targetId),
      getProfilePictureUrl(targetId),
    ]);

    // ✅ 統一檢查語言資料
    const langData =
      langRes && langRes.status === "success" && langRes.data
        ? langRes.data
        : {};

    // ✅ 統一檢查頭像
    const profileUrl =
      profileRes && profileRes.status === "success" && profileRes.data
        ? profileRes.data
        : "/assets/images/defaultAvatar.svg";

    const result = {
      userId: targetId,
      ...langData,
      profilePicture: profileUrl,
    };

    console.log("[Service:fetchOnlineUserData] ✅ 組合結果:", result);
    return result;
  } catch (err) {
    console.error("[Service:fetchOnlineUserData] ❌ exception:", err);
    // ⚠️ 保底 fallback
    return { userId: targetId, profilePicture: "/assets/images/defaultAvatar.svg" };
  }
}

