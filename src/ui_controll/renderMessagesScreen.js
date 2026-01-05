import { enrichMessageScreenItemData } from "../service/getMessagesScreenData.js";
import { createMessageScreenSkeletonElement } from "../ui_create/createMessageScreenElement.js";
import {  createFullMessageScreenElement } from "../ui_create/createMessageScreenElement.js";
import {getCurrentUserBlockList_Global} from "/user_identity/user_identity.js";

/**
 * 控制器：初始化對話清單
 * @param {HTMLElement} container - 要插入骨架的容器
 */

export async function renderMessageScreenItem(conv, container, options = {}) {
  if (!container) {
    console.error("renderMessageScreenItem: container 不存在");
    return;
  }

  // 預設插入位置為「底部」
  const insertPosition = options.insertPosition === "top" ? "top" : "bottom";

  // Step 1: 建立骨架元素
  const skeletonEl = createMessageScreenSkeletonElement(conv);

  if (insertPosition === "top") {
    container.insertBefore(skeletonEl, container.firstChild);
  } else {
    container.appendChild(skeletonEl);
  }

  try {
    // Step 2: 呼叫 service 拿詳細資料
    let enriched = await enrichMessageScreenItemData(conv);
    console.log(
      "./ui_controll/renderMessagesScreen.js :renderMessageScreenItem: enriched: ",
      enriched
    );

    // 🔹 Step 2.5: 檢查 BlockList
    const BlockList = await getCurrentUserBlockList_Global();
    if (Array.isArray(BlockList) && enriched?.other_user?.user_id) {
      if (BlockList.includes(enriched.other_user.user_id)) {
        enriched = { ...enriched, isBlocked: true };
      }
    }

    // Step 3: 產生完整元素
    const fullEl = createFullMessageScreenElement(enriched);

    // ✅ 用完整元素替換骨架
    if (skeletonEl.parentNode === container) {
      container.replaceChild(fullEl, skeletonEl);
    } else {
      // 若骨架被移除（例如頁面切換時），直接插入
      if (insertPosition === "top") {
        container.insertBefore(fullEl, container.firstChild);
      } else {
        container.appendChild(fullEl);
      }
    }
  } catch (err) {
    console.error("renderMessageScreenItem enrich error:", err);
    // 保留骨架避免畫面閃爍
  }
}

