import {
  loadUserPublicData,
  saveUserPublicData,
} from "/utils/cache/userPublicDataCache.js";

import {apiGetFriendshipStatus, getUsernameById, getUserLanguage, getProfilePictureUrl } from "../api/api.js";

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

    if (res && res.status === "success" && typeof res.data?.username === "string") {
      const username = res.data.username;
      console.log("[Service:fetchUserProfileUsername] ✅ username:", username);

      // ✏️ 寫入快取
      const existing = loadUserPublicData(userId) || {};
      saveUserPublicData(userId, { ...existing, username });

      return username;
    }

    console.warn("[Service:fetchUserProfileUsername] ⚠️ API 回傳無效:", res);
    return "";
  } catch (err) {
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
    console.error("[Service:fetchUserProfileLanguage] ❌ error:", err);
    return { targetlanguage: "?", nativelanguage: "?" };
  }
}

/**
 * ✅ 取得使用者頭貼 URL（含快取）
 */
export async function fetchUserProfilePicUrl(userId) {
  if (!userId) return "/assets/images/defaultAvatar.svg";

  // 🧩 嘗試從快取讀取
  const cached = loadUserPublicData(userId);
  if (cached?.avatarUrl) {
    console.log(`[Cache Hit] avatar for ${userId}:`, cached.avatarUrl);
    return cached.avatarUrl;
  }

  try {
    const res = await getProfilePictureUrl(userId);

    if (res && res.status === "success" && typeof res.data === "string" && res.data.trim()) {
      const avatarUrl = res.data;
      console.log("[Service:fetchUserProfilePicUrl] ✅ 取得頭貼:", avatarUrl);

      // ✏️ 寫入快取
      const existing = loadUserPublicData(userId) || {};
      saveUserPublicData(userId, { ...existing, avatarUrl });

      return avatarUrl;
    }

    console.warn("[Service:fetchUserProfilePicUrl] ⚠️ 使用預設頭貼:", res);
    return "/assets/images/defaultAvatar.svg";
  } catch (err) {
    console.error("[Service:fetchUserProfilePicUrl] ❌ error:", err);
    return "/assets/images/defaultAvatar.svg";
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
      const [username, language, profile_picture_url] = await Promise.all([
        fetchUserProfileUsername(userId),
        fetchUserProfileLanguage(userId),
        fetchUserProfilePicUrl(userId),
      ]);

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
    console.error("[Service:getUserProfile] ❌ exception:", err);
    return {
      user_id: userId,
      username: "",
      targetlanguage: "?",
      nativelanguage: "?",
      profile_picture_url: "/assets/images/defaultAvatar.svg",
      friendship_status: { in: {}, out: {} },
    };
  }
}

