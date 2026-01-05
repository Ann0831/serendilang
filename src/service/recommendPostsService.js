// ./service/getPostSuggestService.js
import { getPostSuggest, getGlobalPostsSuggest } from "../api/api.js";

/**
 * ✅ 通用正規化邏輯
 */
function normalizePostSuggestItem(item) {
  if (typeof item === "string") {
    return item;
  }
  if (item && typeof item === "object" && "post_id" in item) {
    return {
      post_id: item.post_id,
      author_id: item.author_id ?? null,
    };
  }
  return null; // 無效項目
}

/**
 * ✅ 個人化推薦貼文
 */
export async function getPostSuggestNormalized() {
  try {
    const res = await getPostSuggest();

    if (!res || res.status !== "success" || !Array.isArray(res.data)) {
      console.warn("[Service:getPostSuggestNormalized] ⚠️ API 回傳無效:", res);
      return [];
    }

    const normalized = res.data
      .map(normalizePostSuggestItem)
      .filter(Boolean); // 移除 null

    console.log("[Service:getPostSuggestNormalized] ✅ 正規化結果:", normalized);
    return normalized;
  } catch (err) {
    console.error("[Service:getPostSuggestNormalized] ❌ error:", err);
    return [];
  }
}

/**
 * ✅ 全站推薦貼文
 */
export async function getGlobalPostSuggestNormalized() {
  try {
    const res = await getGlobalPostsSuggest();

    if (!res || res.status !== "success" || !Array.isArray(res.data)) {
      console.warn("[Service:getGlobalPostSuggestNormalized] ⚠️ API 回傳無效:", res);
      return [];
    }

    const normalized = res.data
      .map(normalizePostSuggestItem)
      .filter(Boolean);

    console.log("[Service:getGlobalPostSuggestNormalized] ✅ 正規化結果:", normalized);
    return normalized;
  } catch (err) {
    console.error("[Service:getGlobalPostSuggestNormalized] ❌ error:", err);
    return [];
  }
}

