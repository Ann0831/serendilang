import { handleServiceNetworkError } from "./networkErrorHandler.js";
import {
  loadUserPublicData,
  saveUserPublicData,
} from "../utils/cache/userPublicDataCache.js";

// /service/getFriendsListPageData.js
import {
  getFriendsList as apiGetFriendsList,
  getUserLanguage,
  getProfilePictureUrl,
} from "../api/api.client.js";

// 📌 用於快取好友語言 & 頭貼
const friendCache = new Map();

/**
 * ✅ 取得好友清單 (僅 ID + 名字)
 * @returns {Promise<Array<{ friend_id: string|number, friend_name: string }>>}
 */
export async function getFriendsList() {
  console.log("[Service:getFriendsList] fetching friend list...");
  try {
    const res = await apiGetFriendsList();

    // ✅ 先檢查 API 狀態
    if (!res || res.status !== "success" || !Array.isArray(res.data)) {
      console.warn("[Service:getFriendsList] ⚠️ API failed or invalid:", res);
      return [];
    }

    const list = res.data;

    const filtered = list
      .map((item) => ({
        friend_id: item?.user_id ?? "",
        friend_name: item?.username ?? "",
	is_read: item?.is_read ?? true
      }))
      .filter((f) => f.friend_id && f.friend_name);

    console.log("[Service:getFriendsList] ✅ filtered list:", filtered);
    return filtered;
  } catch (err) {
    handleServiceNetworkError(err, "getFriendsListPageData.js");
    console.error("[Service:getFriendsList] ❌ exception:", err);
    return [];
  }
}

/**
 * ✅ 補充好友詳細資訊 (語言 + 頭貼)，使用快取
 */
export async function enrichFriendItemData(friend) {
  const userId = friend?.friend_id;
  if (!userId) return friend;
 
  // 🧠 Step 1: 記憶體快取
  if (friendCache.has(userId)) {
    console.log(`[Memory Cache Hit] friend ${userId}`);
    return { ...friend, ...friendCache.get(userId) };
  }

  // 🧩 Step 2: localStorage 層快取
  const cached = loadUserPublicData(userId);
  if (cached) {
    console.log(`[LocalStorage Cache Hit] userPublicData for ${userId}:`, cached);
    const extra = {
      language: {
        targetlanguage: cached.targetlanguage || "?",
        nativelanguage: cached.nativelanguage || "?",
      },
      profilePicUrl: cached.avatarUrl || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
     
    };

    friendCache.set(userId, extra); // 同步更新記憶體層
    return { ...friend, ...extra };
  }

  // 🚀 Step 3: API fallback
  try {
    console.log("[Service:enrichFriendItemData] fetching extra info for:", userId);

    const [langSettled, picSettled] = await Promise.allSettled([
      getUserLanguage(userId),
      getProfilePictureUrl(userId),
    ]);
    if (langSettled.status === "rejected") handleServiceNetworkError(langSettled.reason, "getFriendsListPageData.js");
    if (picSettled.status === "rejected") handleServiceNetworkError(picSettled.reason, "getFriendsListPageData.js");
    const langRes = langSettled.status === "fulfilled" ? langSettled.value : null;
    const picRes = picSettled.status === "fulfilled" ? picSettled.value : null;

    const lang =
      langRes && langRes.status === "success" && langRes.data
        ? langRes.data
        : { targetlanguage: "?", nativelanguage: "?" };

    const profilePicUrl =
      picRes && picRes.status === "success" && picRes.data
        ? picRes.data
        : `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`;

    const extra = {
      language: lang,
      profilePicUrl,
    };

    // ✏️ Step 4: 寫入快取
    saveUserPublicData(userId, {
      username: friend.friend_name,
      avatarUrl: profilePicUrl,
      targetlanguage: lang.targetlanguage,
      nativelanguage: lang.nativelanguage,
    });

    friendCache.set(userId, extra);

    console.log("[Service:enrichFriendItemData] ✅ cached extra:", extra);
    return { ...friend, ...extra };
  } catch (err) {
    handleServiceNetworkError(err, "getFriendsListPageData.js");
    console.error("[Service:enrichFriendItemData] ❌ error:", err);
    return friend;
  }
}
/**
 * ✅ 強制重新取得好友詳細資料（不使用快取）
 * @param {Object} friend - { friend_id, friend_name }
 * @returns {Promise<Object>} - { friend_id, friend_name, language, profilePicUrl }
 */
export async function fetchFriendItemFresh(friend) {
  const userId = friend?.friend_id;
  if (!userId) return friend;

  try {
    console.log("[Service:fetchFriendItemFresh] force fetching info for:", userId);

    const [langSettled, picSettled] = await Promise.allSettled([
      getUserLanguage(userId),
      getProfilePictureUrl(userId),
    ]);
    if (langSettled.status === "rejected") handleServiceNetworkError(langSettled.reason, "getFriendsListPageData.js");
    if (picSettled.status === "rejected") handleServiceNetworkError(picSettled.reason, "getFriendsListPageData.js");
    const langRes = langSettled.status === "fulfilled" ? langSettled.value : null;
    const lang =
      langRes && langRes.status === "success" && langRes.data
        ? langRes.data
        : {};

    const picRes = picSettled.status === "fulfilled" ? picSettled.value : null;
    const profilePicUrl =
      picRes && picRes.status === "success" && picRes.data
        ? picRes.data
        : `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`;

    const extra = { language: lang, profilePicUrl };

    console.log("[Service:fetchFriendItemFresh] ✅ fetched extra:", extra);

    // 📌 更新快取（同步最新資料）
    friendCache.set(userId, extra);

    return { ...friend, ...extra };
  } catch (err) {
    handleServiceNetworkError(err, "getFriendsListPageData.js");
    console.error("[Service:fetchFriendItemFresh] ❌ error:", err);
    return friend;
  }
}
