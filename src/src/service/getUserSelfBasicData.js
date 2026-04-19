import { handleServiceNetworkError } from "./networkErrorHandler.js";
// ./service/userExtraData.js
import { getMyPostReports,getUserBlockList,getUserLanguage, getProfilePictureUrl, getCurrentUserIdentity } from "../api/api.client.js";
import { DEFAULT_AVATAR_URL, normalizeAvatarUrl } from "../utils/avatar.js";

/**
 * Service 層：取得目前登入使用者名稱
 * @returns {Promise<string>} - 成功回傳 username，失敗回傳空字串 ""
 */
export async function fetchUsername() {
  try {
    const res = await getCurrentUserIdentity();

    if (res?.status !== "success" || !res.data?.username) {
      console.warn("⚠️ fetchUsername: 回傳格式不符或缺少 username:", res);
      return "";
    }

    return res.data.username;
  } catch (err) {
    handleServiceNetworkError(err, "getUserSelfBasicData.js");
    console.error("❌ fetchUsername error:", err);
    return "";
  }
}

/**
 * Service 層：取得使用者語言
 * @returns {Promise<{ targetlanguage: string, nativelanguage: string }>}
 */
export async function fetchUserLanguage() {
  try {
    const identityRes = await getCurrentUserIdentity();

    if (identityRes?.status !== "success" || !identityRes.data?.user_id) {
      console.warn("⚠️ fetchUserLanguage: 無法取得 user_id:", identityRes);
      return { targetlanguage: "?", nativelanguage: "?" };
    }

    const userId = identityRes.data.user_id;
    const langRes = await getUserLanguage(userId);

    if (langRes?.status !== "success" || !langRes.data) {
      console.warn("⚠️ fetchUserLanguage: 回傳格式不符:", langRes);
      return { targetlanguage: "?", nativelanguage: "?" };
    }

    const { targetlanguage = "?", nativelanguage = "?" } = langRes.data;
    return { targetlanguage, nativelanguage };
  } catch (err) {
    handleServiceNetworkError(err, "getUserSelfBasicData.js");
    console.error("❌ fetchUserLanguage error:", err);
    return { targetlanguage: "?", nativelanguage: "?" };
  }
}

/**
 * Service 層：取得目前登入使用者的頭貼 URL
 * @returns {Promise<string>} - 成功回傳 URL，失敗回傳預設圖示
 */
export async function fetchUserProfilePicUrl() {
  try {
    const identityRes = await getCurrentUserIdentity();

    if (identityRes?.status !== "success" || !identityRes.data?.user_id) {
      console.warn("⚠️ fetchUserProfilePicUrl: 無法取得 user_id:", identityRes);
      return DEFAULT_AVATAR_URL;
    }

    const userId = identityRes.data.user_id;
    const picRes = await getProfilePictureUrl(userId);

    if (picRes?.status !== "success" || !picRes.data || typeof picRes.data !== "string") {
      console.warn("⚠️ fetchUserProfilePicUrl: 回傳格式不符:", picRes);
      return DEFAULT_AVATAR_URL;
    }

    const url = picRes.data.trim();
    return normalizeAvatarUrl(url || DEFAULT_AVATAR_URL);
  } catch (err) {
    handleServiceNetworkError(err, "getUserSelfBasicData.js");
    console.error("❌ fetchUserProfilePicUrl error:", err);
    return DEFAULT_AVATAR_URL;
  }
}


export async function fetchUserBlockList() {
  try {
    const res = await getUserBlockList();

    if (res?.status === "success" && Array.isArray(res.data)) {
      return res.data;
    }

    console.warn("⚠️ fetchUserBlockList: 回傳非 success 或格式不符:", res);
    return [];
  } catch (error) {
    handleServiceNetworkError(error, "getUserSelfBasicData.js");
    console.error("❌ fetchUserBlockList error:", error);
    return [];
  }
}

export async function fetchMyPostReports() {
  try {
    const res = await getMyPostReports();

    if (res?.status === "success" && Array.isArray(res.data)) {
      return res.data;
    }

    console.warn("⚠️ fetchMyPostReports: 回傳非 success 或格式不符:", res);
    return [];
  } catch (error) {
    handleServiceNetworkError(error, "getUserSelfBasicData.js");
    console.error("❌ fetchMyPostReports error:", error);
    return [];
  }
}


export async function fetchCurrentUserIdentity() {
  try {
    const res = await getCurrentUserIdentity();

    if (res?.status === "success" && res.data && typeof res.data === "object") {
      return res.data;
    }

    console.warn("⚠️ fetchCurrentUserIdentity: 回傳非 success 或格式不符:", res);
    return null;
  } catch (err) {
    handleServiceNetworkError(err, "getUserSelfBasicData.js");
    console.error("❌ fetchCurrentUserIdentity error:", err);
    return null;
  }
}
