import { createFriendSkeletonElement, createFullFriendElement } from "../ui_create/createFriendElement.js";
import { enrichFriendItemData } from "../service/getFriendsListPageData.js";
import { eventBus } from "../utils/eventBus.js";

/**
 * 渲染好友卡片：會先插入骨架，然後 enrich 後替換成完整卡片
 * @param {HTMLElement} container - 插入的父容器
 * @param {Object} obj - { friend_id, friend_name }
 */
export async function renderFriendElement(container, obj) {
  const skeleton = createFriendSkeletonElement(obj);

 

  container.appendChild(skeleton);

  try {
    const enriched = await enrichFriendItemData(obj);
    const card = createFullFriendElement(enriched);

   

    container.replaceChild(card, skeleton);
  } catch (err) {
    console.error("renderFriendElement error:", err);
   
  }
}

