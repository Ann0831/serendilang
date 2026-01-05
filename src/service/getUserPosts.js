// ./service/getUserPosts.js
import { getUserAllPostIds } from "../api/api.js";

/**
 * ✅ Service 層：取得指定使用者的所有 post_id
 * @param {number|string} userId
 * @returns {Promise<string[]>}
 */
export async function getUserPosts(userId) {
  try {
    if (!userId) {
      console.warn("[Service:getUserPosts] ⚠️ 缺少 userId");
      return [];
    }

    console.log("[Service:getUserPosts] fetching posts for user:", userId);

    const res = await getUserAllPostIds(userId);

    // ✅ 先檢查狀態是否成功
    if (!res || res.status !== "success" || !Array.isArray(res.data)) {
      console.warn("[Service:getUserPosts] ⚠️ API failed or invalid:", res);
      return [];
    }

    const postIds = res.data;

    console.log("[Service:getUserPosts] ✅ postIds:", postIds);

    return postIds;
  } catch (err) {
    console.error("[Service:getUserPosts] ❌ exception:", err);
    return [];
  }
}

