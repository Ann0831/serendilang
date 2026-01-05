// /service/postCardData.js
import {
  getUserLikePost,
  getPostById,
  getUserLanguage,
  getProfilePictureUrl,
} from "../api/api.js";
import { escapeHTML } from "../utils/sanitize.js";

/**
 * ✅ Service 層：取得貼文卡片資料（安全版本）
 * @param {string|number} post_id
 * @returns {Promise<Object|null>}
 */
export async function getPostCardData(post_id,getLikeIt=true) {
  try {
    if (!post_id) {
      console.warn("[Service:getPostCardData] ⚠️ 缺少 post_id");
      return null;
    }

    console.log("[Service:getPostCardData] fetching post:", post_id);

    // 1️⃣ 抓貼文
    const postRes = await getPostById(post_id);
    if (!postRes || postRes.status !== "success" || !postRes.data) {
      console.warn("[Service:getPostCardData] ⚠️ 貼文資料無效:", postRes);
      if (postRes && typeof postRes === "object"&& !(postRes instanceof Error)) {
        return postRes;
      }
      return null;
    }
    const post = postRes.data;

    // 2️⃣ 並行抓語言、頭貼、是否按讚
    const [profileRes, langRes, likeRes] = await Promise.all([
      getProfilePictureUrl(post.author_id),
      getUserLanguage(post.author_id),
      getLikeIt ? getUserLikePost(post_id) : Promise.resolve({"status":"fail"}),
    ]);

    const profilePicture_url =
      profileRes?.status === "success" && profileRes.data
        ? profileRes.data
        : "/assets/images/defaultAvatar.svg";

    const userLang =
      langRes?.status === "success" && langRes.data ? langRes.data : {};

    const userlikeit =
      likeRes?.status === "success" && !!likeRes.data;

    console.log("[Service:getPostCardData] ✅ userLang:", userLang);
    console.log("[Service:getPostCardData] ✅ likeRes:", likeRes);
    // 3️⃣ 安全轉義後回傳
    return {
      post_id: escapeHTML(String(post_id)),
      author_id: post.author_id,
      author_name: escapeHTML(post.author_name || ""),
      title: escapeHTML(post.title || post.username || ""),
      content: escapeHTML(post.article || ""),
      created_at: escapeHTML(post.created_at || ""),
      image_url: post.image_url || "",
      profilePicture_url,
      userLang: {
        nativelanguage: userLang?.nativelanguage
          ? escapeHTML(userLang.nativelanguage)
          : "",
        targetlanguage: userLang?.targetlanguage
          ? escapeHTML(userLang.targetlanguage)
          : "",
      },
      like_count: escapeHTML(String(post.like_count ?? 0)),
      userlikeit,
    };
  } catch (err) {
    console.error("[Service:getPostCardData] ❌ exception:", err);
    return null;
  }
}

