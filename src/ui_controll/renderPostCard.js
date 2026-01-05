import { createSkeletonPostCard , createPostCard } from '../ui_create/createPostCard.js';

export async function renderPostCardWithLoading(post_id, container,params={}) {
  // 1. 插入骨架
  console.log("renderPostCardWithLoading: post_id:",post_id);
  const skeleton = createSkeletonPostCard(post_id);

  container.appendChild(skeleton);

  try {
    // 2. 讓 createPostCard 負責所有流程（內部自己抓 service 資料）
    const postCard = await createPostCard(post_id,params);

    // 3. 替換骨架
    container.replaceChild(postCard, skeleton);

  } catch (err) {
    skeleton.innerHTML = `<div class="text-red-500 p-2">Failed to load</div>`;
  }
}
