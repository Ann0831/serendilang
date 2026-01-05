import {
  createFriendRequestCard,
  createFriendRequestCardSkeleton
} from "../ui_create/createFriendRequestCard.js";
import { enrichFriendRequestCardData } from "../service/getFriendRequestsData.js";
import { acceptFriendRequest } from "../service/acceptRequest.js";
/**
 * 渲染單一卡片：render 時就自帶骨架取代邏輯
 * @param {HTMLElement} container - 要放入的容器
 * @param {Object} req - 好友請求資料（至少 username）
 */
export async function renderFriendRequestCard(container, req) {
  let skeleton;
  try {
    // Step 1: 插入骨架
    skeleton = createFriendRequestCardSkeleton(req);
    container.appendChild(skeleton);
  } catch (err) {
    console.error("renderFriendRequestCard: 建立骨架失敗", err);
    return; // 連骨架都失敗，就沒必要繼續
  }

  let enriched = req;
  try {
    // Step 2: enrich req，加上語言與頭貼
    enriched = await enrichFriendRequestCardData(req);
  } catch (err) {
    console.error("renderFriendRequestCard: enrich 失敗", err);
    // 保留原始 req，profilePicUrl / language 可能缺失
  }

  let card;
  try {
    // Step 3: 建立完整卡片
    card = createFriendRequestCard(enriched);
  } catch (err) {
    console.error("renderFriendRequestCard: 建立完整卡片失敗", err);
    return; // 不能建立完整卡片，就不 replace
  }

  try {
    // Step 4: 用完整卡片替換骨架
    container.replaceChild(card, skeleton);
  } catch (err) {
    console.error("renderFriendRequestCard: 替換骨架失敗", err);
    // 如果替換失敗，至少骨架還在
  }
}


export async function handleAcceptButtonClick(button, targetId) {
  if (!button) return;

  // 避免重複點擊
  button.disabled = true;
  button.textContent = "Processing...";

  const ok = await acceptFriendRequest(targetId);

  if (ok) {
    // 成功 → 更新 UI
    button.textContent = "Accepted";
    button.classList.remove("bg-green-600", "hover:bg-green-700");
    button.classList.add("bg-gray-400", "cursor-not-allowed");
  } else {
    // 失敗 → 還原狀態
    button.textContent = "Accept";
    button.disabled = false;
  }
}
