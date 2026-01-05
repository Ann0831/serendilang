import { 
  createSkeletonUserSelfPagePostCard, 
  createUserSelfPagePostCard 
} from "../ui_create/createUserSelfPagePostCard.js";

/**
 * 在使用者個人頁面插入一張貼文卡（先骨架 → 再替換為完整卡片）
 * @param {string|number} post_id - 貼文 ID
 */
export async function renderUserSelfPostCardWithLoading(post_id) {
  const container = document.getElementById("userselfpage-posts-container");
  if (!container) {
    console.error("❌ #userselfpage-posts-container not found");
    return;
  }

  console.log("renderUserSelfPostCardWithLoading: post_id:", post_id);

  // 1. 插入骨架
  const skeleton = createSkeletonUserSelfPagePostCard(post_id);
  container.appendChild(skeleton);
  console.log("renderUserSelfPostCardWithLoadin apend skeleton");
  try {
    // 2. 生成完整卡片（createUserSelfPagePostCard 內部會呼叫 service）
    const postCard = await createUserSelfPagePostCard(post_id);

    // 3. 替換骨架
    container.replaceChild(postCard, skeleton);
    console.log("renderUserSelfPostCardWithLoadin replace success");
  } catch (err) {
    console.error("❌ renderUserSelfPostCardWithLoading error:", err);
    skeleton.innerHTML = `<div class="text-red-500 p-2">Loading failed</div>`;
  }
}

