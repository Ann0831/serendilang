// ./service/getUserSelfAllPosts.js
import { getUserAllPostIds, getCurrentUserIdentity } from "../api/api.js";

/**
 * Service 層：取得目前登入使用者的所有 post_id
 * @returns {Promise<string[]>}
 */
export async function getUserSelfAllPosts() {
  try {
    // 取得登入使用者
    const identityRes = await getCurrentUserIdentity();

    if (identityRes?.status !== "success") {
      console.warn("⚠️ getUserSelfAllPosts: 無法取得使用者身分", identityRes);
      return [];
    }

    const userId = identityRes.data?.user_id;
    if (!userId) {
      console.warn("⚠️ getUserSelfAllPosts: 缺少 user_id");
      return [];
    }

    // 取得使用者的所有貼文 ID
    const postRes = await getUserAllPostIds(userId);

    const postIds =
      postRes?.status === "success" && Array.isArray(postRes.data)
        ? postRes.data
        : [];

    console.log(
      "✅ getUserSelfAllPosts: userId:",
      userId,
      "→ postIds:",
      postIds
    );

    return postIds;
  } catch (err) {
    console.error("❌ getUserSelfAllPosts error:", err);
    return [];
  }
}

