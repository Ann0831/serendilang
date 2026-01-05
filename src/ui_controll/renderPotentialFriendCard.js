import { createPotentialFriendCard,createPotentialFriendCardSkeleton } from "../ui_create/createPotentialFriendCard.js";
import { enrichPotentialFriendCardData } from "../service/getPotentialFriendsData.js";
import { addFriend } from "../service/addFriend.js";

/**
 * 渲染單一卡片：render 時就自帶骨架取代邏輯
 * @param {HTMLElement} container - 要放入的容器
 * @param {Object} user - 使用者完整資料（至少 username）
 */
export async function renderPotentialFriendCard(container, conv) {
  let skeleton;
  try {
    // Step 1: 插入骨架
    skeleton = createPotentialFriendCardSkeleton(conv);
    container.appendChild(skeleton);
  } catch (err) {
    console.error("renderPotentialFriendCard: 建立骨架失敗", err);
    return; // 連骨架都失敗，就沒必要繼續
  }

  let enriched = conv;
  try {
    // Step 2: enrich conv，加上語言與頭貼
    enriched = await enrichPotentialFriendCardData(conv);
  } catch (err) {
    console.error("renderPotentialFriendCard: enrich 失敗", err);
    // 保留原始 conv，profilePicUrl / language 可能缺失
  }

  let card;
  try {
    // Step 3: 建立完整卡片
    card = createPotentialFriendCard(enriched);
  } catch (err) {
    console.error("renderPotentialFriendCard: 建立完整卡片失敗", err);
    return; // 不能建立完整卡片，就不 replace
  }

  try {
    // Step 4: 用完整卡片替換骨架
    container.replaceChild(card, skeleton);
  } catch (err) {
    console.error("renderPotentialFriendCard: 替換骨架失敗", err);
    // 如果替換失敗，至少骨架還在
  }
}




export async function handleAddFriendClick(button, targetId) {
  if (!button) return;

  // 避免重複點擊
  button.disabled = true;
  button.textContent = "Sending...";

  const ok = await addFriend(targetId);

  if (ok) {
    button.textContent = "Sent";
    button.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
    button.classList.add("bg-gray-400", "cursor-not-allowed");
  } else {
    button.textContent = "Add Friend";
    button.disabled = false;
  }
}
