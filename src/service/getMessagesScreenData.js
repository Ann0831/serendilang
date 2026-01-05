// /service/getMessagesScreenData.js
import {getSpecificMessageScreen, getAllMessagesScreen, getUserLanguage, getProfilePictureUrl } from "../api/api.js";

const userCache = new Map(); // 快取語言/頭貼，避免重複請求

export async function fetchSpecificMessageScreenData(target_id) {
  try {
    const res = await getSpecificMessageScreen(target_id);

    // ✅ 檢查 API 回傳狀態與資料格式
    if (!res || res.status !== "success" || !res.data || typeof res.data !== "object") {
      console.warn("[Service:getMessagesScreen] ⚠️ 無效回傳 (single):", res);
      return null;
    }

    console.log("[Service:getMessagesScreen] ✅ specific conversation:", res.data);
    return res.data;
  } catch (err) {
    console.error("[Service:getMessagesScreen] ❌ exception (single):", err);
    return null;
  }
}


/**
 * ✅ 取得對話骨架清單 (僅基本資訊)
 */
export async function fetchAllMessageScreenSkeletonsData() {
  try {
    const res = await getAllMessagesScreen();

    // ✅ 先檢查 API 狀態
    if (!res || res.status !== "success" || !Array.isArray(res.data)) {
      console.warn("[Service:getMessagesScreen] ⚠️ 無效回傳:", res);
      return [];
    }

    console.log("[Service:getMessagesScreen] ✅ conversations:", res.data);
    return res.data;
  } catch (err) {
    console.error("[Service:getMessagesScreen] ❌ exception:", err);
    return [];
  }
}

/**
 * ✅ 補充對話詳細資訊 (語言 + 頭貼) — 使用快取
 */
export async function enrichMessageScreenItemData(conv) {
  const userId = conv?.other_user?.user_id;
  if (!userId) return conv;

  // 📌 若快取已有 → 直接用
  if (userCache.has(userId)) {
    return { ...conv, ...userCache.get(userId) };
  }

  try {
    const [langRes, picRes] = await Promise.all([
      getUserLanguage(userId),
      getProfilePictureUrl(userId),
    ]);

    const lang =
      langRes && langRes.status === "success" && langRes.data
        ? langRes.data
        : {};

    const profilePicUrl =
      picRes && picRes.status === "success" && picRes.data
        ? picRes.data
        : "/assets/images/defaultAvatar.svg";

    const extra = { language: lang, profilePicUrl };

    console.log("[Service:enrichMessageScreenItemData] ✅ extra:", extra);

    // 存入快取
    userCache.set(userId, extra);

    return { ...conv, ...extra };
  } catch (err) {
    console.error("[Service:enrichMessageScreenItemData] ❌ error:", err);
    return conv;
  }
}

/**
 * ✅ 不使用快取版本：強制重新抓語言與頭貼
 */
export async function fetchMessageScreenItemFresh(conv) {
  const userId = conv?.other_user?.user_id;
  if (!userId) return conv;

  try {
    console.log("[Service:fetchMessageScreenItemFresh] 🔄 force fetching info for:", userId);

    const [langRes, picRes] = await Promise.all([
      getUserLanguage(userId),
      getProfilePictureUrl(userId),
    ]);

    const lang =
      langRes && langRes.status === "success" && langRes.data
        ? langRes.data
        : {};

    const profilePicUrl =
      picRes && picRes.status === "success" && picRes.data
        ? picRes.data
        : "/assets/images/defaultAvatar.svg";

    const extra = { language: lang, profilePicUrl };

    console.log("[Service:fetchMessageScreenItemFresh] ✅ fetched extra:", extra);

    // 📌 同步更新快取（保持最新）
    userCache.set(userId, extra);

    return { ...conv, ...extra };
  } catch (err) {
    console.error("[Service:fetchMessageScreenItemFresh] ❌ error:", err);
    return conv;
  }
}

/**
 * ✅ 可選輔助：清除快取（例如登出時使用）
 */
export function clearMessageScreenCache() {
  userCache.clear();
  console.log("[Service:getMessagesScreenData] 🧹 userCache cleared");
}

