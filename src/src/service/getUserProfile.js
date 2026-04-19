import { handleServiceNetworkError } from "./networkErrorHandler.js";
import {
  loadUserPublicData,
  saveUserPublicData,
} from "../utils/cache/userPublicDataCache.js";

import {apiGetFriendshipStatus, getUsernameById, getUserLanguage, getProfilePictureUrl } from "../api/api.client.js";
import { DEFAULT_AVATAR_URL, normalizeAvatarUrl } from "../utils/avatar.js";

/**
 * ✅ 取得使用者名稱（含快取）
 */
export async function fetchUserProfileUsername(userId) {
  console.log("[Service:fetchUserProfileUsername] userId:", userId);
  if (!userId) return "";

  // 🧩 嘗試從快取讀取
  const cached = loadUserPublicData(userId);
  if (cached?.username) {
    console.log(`[Cache Hit] username for ${userId}:`, cached.username);
    return cached.username;
  }

  try {
    const res = await getUsernameById(userId);
    const usernameFromObject =
      typeof res?.data?.username === "string" ? res.data.username : "";
    const usernameFromString =
      typeof res?.data === "string" ? res.data : "";
    const username = (usernameFromObject || usernameFromString || "").trim();

    // 相容兩種 API 格式：
    // 1) { status: "success", data: { username: "alice" } }
    // 2) { status: "success", data: "alice" }
    if (res && res.status === "success" && username) {
      console.log("[Service:fetchUserProfileUsername] ✅ username:", username);

      // ✏️ 寫入快取
      const existing = loadUserPublicData(userId) || {};
      saveUserPublicData(userId, { ...existing, username });

      return username;
    }

    console.warn("[Service:fetchUserProfileUsername] ⚠️ API 回傳無效:", res);
    return "";
  } catch (err) {
    handleServiceNetworkError(err, "getUserProfile.js");
    console.error("[Service:fetchUserProfileUsername] ❌ error:", err);
    return "";
  }
}

/**
 * ✅ 取得使用者語言（含快取）
 */
export async function fetchUserProfileLanguage(userId) {
  if (!userId) return { targetlanguage: "?", nativelanguage: "?" };

  // 🧩 嘗試從快取讀取
  const cached = loadUserPublicData(userId);
  if (cached?.targetlanguage && cached?.nativelanguage) {
    console.log(`[Cache Hit] language for ${userId}:`, cached);
    return {
      targetlanguage: cached.targetlanguage,
      nativelanguage: cached.nativelanguage,
    };
  }

  try {
    const res = await getUserLanguage(userId);

    if (res && res.status === "success" && res.data) {
      const lang = res.data;
      const result = {
        targetlanguage: lang.targetlanguage || "?",
        nativelanguage: lang.nativelanguage || "?",
      };
      console.log("[Service:fetchUserProfileLanguage] ✅ 取得語言:", result);

      // ✏️ 寫入快取
      const existing = loadUserPublicData(userId) || {};
      saveUserPublicData(userId, { ...existing, ...result });

      return result;
    }

    console.warn("[Service:fetchUserProfileLanguage] ⚠️ API 回傳無效:", res);
    return { targetlanguage: "?", nativelanguage: "?" };
  } catch (err) {
    handleServiceNetworkError(err, "getUserProfile.js");
    console.error("[Service:fetchUserProfileLanguage] ❌ error:", err);
    return { targetlanguage: "?", nativelanguage: "?" };
  }
}

/**
 * ✅ 取得使用者頭貼 URL（含快取）
 */
export async function fetchUserProfilePicUrl(userId) {
  if (!userId) return DEFAULT_AVATAR_URL;

  // 🧩 嘗試從快取讀取
  const cached = loadUserPublicData(userId);
  if (cached?.avatarUrl) {
    console.log(`[Cache Hit] avatar for ${userId}:`, cached.avatarUrl);
    return cached.avatarUrl;
  }

  try {
    const res = await getProfilePictureUrl(userId);

    if (res && res.status === "success" && typeof res.data === "string" && res.data.trim()) {
      const avatarUrl = normalizeAvatarUrl(res.data);
      console.log("[Service:fetchUserProfilePicUrl] ✅ 取得頭貼:", avatarUrl);

      // ✏️ 寫入快取
      const existing = loadUserPublicData(userId) || {};
      saveUserPublicData(userId, { ...existing, avatarUrl });

      return avatarUrl;
    }

    console.warn("[Service:fetchUserProfilePicUrl] ⚠️ 使用預設頭貼:", res);
    return DEFAULT_AVATAR_URL;
  } catch (err) {
    handleServiceNetworkError(err, "getUserProfile.js");
    console.error("[Service:fetchUserProfilePicUrl] ❌ error:", err);
    return DEFAULT_AVATAR_URL;
  }
}


/**
 * ✅ 聚合：完整使用者 Profile（含好友狀態）
 */

export async function getUserProfile(userId) {
  console.log("[Service:getUserProfile] fetching for:", userId);
  if (!userId) return null;

  try {
    // ⚙️ 先試著從快取抓基本資料（不含好友狀態）
    const cached = loadUserPublicData(userId);
    let baseProfile = null;

    if (
      cached?.username &&
      cached?.targetlanguage &&
      cached?.nativelanguage &&
      cached?.avatarUrl
    ) {
      console.log(`[Cache Hit] base profile for ${userId}`);
      baseProfile = {
        user_id: userId,
        username: cached.username,
        targetlanguage: cached.targetlanguage,
        nativelanguage: cached.nativelanguage,
        profile_picture_url: cached.avatarUrl,
      };
    } else {
      // 🚀 並行抓三個基本資料（不包含 friendship）
      const [usernameSettled, languageSettled, pictureSettled] = await Promise.allSettled([
        fetchUserProfileUsername(userId),
        fetchUserProfileLanguage(userId),
        fetchUserProfilePicUrl(userId),
      ]);
      const username = usernameSettled.status === "fulfilled" ? usernameSettled.value : "";
      const language = languageSettled.status === "fulfilled"
        ? languageSettled.value
        : { targetlanguage: "?", nativelanguage: "?" };
      const profile_picture_url = pictureSettled.status === "fulfilled" ? pictureSettled.value : DEFAULT_AVATAR_URL;

      baseProfile = {
        user_id: userId,
        username,
        targetlanguage: language.targetlanguage,
        nativelanguage: language.nativelanguage,
        profile_picture_url,
      };

      // ✏️ 寫入整合快取（但不儲存好友狀態）
      const existing = loadUserPublicData(userId) || {};
      saveUserPublicData(userId, {
        ...existing,
        username,
        targetlanguage: language.targetlanguage,
        nativelanguage: language.nativelanguage,
        avatarUrl: profile_picture_url,
      });
    }

    // 🧩 每次都即時抓好友狀態，不使用快取
    const friendshipRes = await apiGetFriendshipStatus(userId).catch((err) => {
      console.error("[Service:getUserProfile] friendship error:", err);
      return { status: "error", data: { in: {}, out: {} } };
    });

    const friendship =
      friendshipRes && friendshipRes.status === "success" && friendshipRes.data
        ? friendshipRes.data
        : { in: {}, out: {} };

    const result = {
      ...baseProfile,
      friendship_status: friendship,
    };

    console.log("[Service:getUserProfile] ✅ 結果:", result);
    return result;
  } catch (err) {
    handleServiceNetworkError(err, "getUserProfile.js");
    console.error("[Service:getUserProfile] ❌ exception:", err);
    return {
      user_id: userId,
      username: "",
      targetlanguage: "?",
      nativelanguage: "?",
      profile_picture_url: DEFAULT_AVATAR_URL,
      friendship_status: { in: {}, out: {} },
    };
  }
}
