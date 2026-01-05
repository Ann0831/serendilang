import { renderMessageScreenItem } from "../ui_controll/renderMessagesScreen.js";
import { getCurrentUserBlockList_Global } from "/user_identity/user_identity.js";
import { fetchSpecificMessageScreenData,fetchAllMessageScreenSkeletonsData } from "/service/getMessagesScreenData.js";

// 全域狀態
let _messagesPageState = {
  conversations: [],
  loadedCount: 0,
  batchSize: 15,
  loading: false,
  initialized: false, // ✅ 是否已經初始化過
};

// 進入頁面
export async function messagesPage_Enter() {
  const container = document.getElementById("messagesContainer");
  if (!container) {
    console.error("messagesPage_Enter: #messagesContainer not found.");
    return;
  }

  const spinner = document.getElementById("main-overlay-spinner");
  const unreadDot = document.getElementById("unread-message-dot");
  const needReinit = unreadDot && !unreadDot.classList.contains("hidden");

  try {
    if (spinner) spinner.classList.remove("hidden");

    // 🔄 如果有紅點代表有未讀 → 重設狀態
    if (needReinit) {
      console.log("🔄 Re-initializing Messages Page because unread dot is ON");
      _messagesPageState = {
        conversations: [],
        loadedCount: 0,
        batchSize: 15,
        loading: false,
        initialized: false,
      };
    }

    // ✅ 若已初始化且沒有紅點 → 用 cache
    if (_messagesPageState.initialized && !needReinit) {
      console.log("messagesPage_Enter: using cached data, skipping reinitialization.");
      window.addEventListener("scroll", _onScrollLoadMore);
      return;
    }

    // 🆕 初始化
    _messagesPageState = {
      conversations: [],
      loadedCount: 0,
      batchSize: 10,
      loading: false,
      initialized: true,
    };

    // Step 1: 拉取 conversations
    let conversations = await fetchAllMessageScreenSkeletonsData();
    console.log("messagesPage_Enter: fetchAllMessageScreenSkeletonsData:", conversations);

    if (!Array.isArray(conversations) || conversations.length === 0) {
      container.innerHTML = `<p class="text-sm text-gray-500 p-3">No conversations yet</p>`;
      return;
    }

    // Step 2: 標記 BlockList
    const BlockList = await getCurrentUserBlockList_Global();
    if (Array.isArray(BlockList)) {
      conversations = conversations.map(conv => {
        if (BlockList.includes(conv.other_user?.user_id)) {
          return { ...conv, isBlocked: true };
        }
        return conv;
      });

      // 排序：被封鎖排到最後
      conversations.sort((a, b) => {
        if (a.isBlocked && !b.isBlocked) return 1;
        if (!a.isBlocked && b.isBlocked) return -1;
        return 0;
      });
    }

    // Step 3: 存到全域狀態
    _messagesPageState.conversations = conversations;

    // Step 4: 清空並載入第一批
    container.innerHTML = "";
    loadMoreMessageScreens(container);

    // Step 5: 綁定滾動事件
    window.addEventListener("scroll", _onScrollLoadMore);

    // ✅ 關掉紅點（代表訊息已讀）
    if (unreadDot) {
      unreadDot.classList.add("hidden");
    }

  } catch (err) {
    console.error("messagesPage_Enter error:", err);
  } finally {
    if (spinner) spinner.classList.add("hidden");
  }
}
// 離開頁面
export function messagesPage_Leave() {
  const container = document.getElementById("messagesContainer");
  

  window.removeEventListener("scroll", _onScrollLoadMore);

  // ❌ 不清空狀態，保留快取
  // _messagesPageState = { ... } ← 不 reset
}

// --- 工具函式 ---

function _onScrollLoadMore() {
  const nearBottom =
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
  if (nearBottom) {
    const container = document.getElementById("messagesContainer");
    if (container) {
      loadMoreMessageScreens(container);
    }
  }
}

function loadMoreMessageScreens(container) {
  if (_messagesPageState.loading) return;

  const { conversations, loadedCount, batchSize } = _messagesPageState;
  if (!Array.isArray(conversations) || loadedCount >= conversations.length) return;

  _messagesPageState.loading = true;

  const nextBatch = conversations.slice(loadedCount, loadedCount + batchSize);

  for (const conv of nextBatch) {
    renderMessageScreenItem(conv, container);
  }

  _messagesPageState.loadedCount += nextBatch.length;
  _messagesPageState.loading = false;
}



export async function reloadMessagesPage() {
  const container = document.getElementById("messagesContainer");
  if (!container) {
    console.error("reloadMessagesPage: #messagesContainer not found.");
    return;
  }

  const spinner = document.getElementById("main-overlay-spinner");

  try {
    if (spinner) spinner.classList.remove("hidden");

    // 重新初始化狀態
    _messagesPageState = {
      conversations: [],
      loadedCount: 0,
      batchSize: _messagesPageState.batchSize,
      loading: false,
      initialized: true,
    };

    // 重新拉取資料
    let conversations = await fetchAllMessageScreenSkeletonsData();
    console.log("reloadMessagesPage: conversations:", conversations);

    if (!Array.isArray(conversations) || conversations.length === 0) {
      container.innerHTML = `<p class="text-sm text-gray-500 p-3">No conversations yet</p>`;
      return;
    }

    // 標記 BlockList
    const BlockList = await getCurrentUserBlockList_Global();
    if (Array.isArray(BlockList)) {
      conversations = conversations.map(conv => {
        if (BlockList.includes(conv.other_user?.user_id)) {
          return { ...conv, isBlocked: true };
        }
        return conv;
      });

      conversations.sort((a, b) => {
        if (a.isBlocked && !b.isBlocked) return 1;
        if (!a.isBlocked && b.isBlocked) return -1;
        return 0;
      });
    }

    // 存狀態
    _messagesPageState.conversations = conversations;

    // 重建容器
    container.innerHTML = "";
    loadMoreMessageScreens(container);

  } catch (err) {
    console.error("reloadMessagesPage error:", err);
  } finally {
    if (spinner) spinner.classList.add("hidden");
  }
}

export async function refreshSingleConversation(target_user_id) {
  const container = document.getElementById("messagesContainer");
  if (!container) {
    console.error("refreshSingleConversation: #messagesContainer not found.");
    return;
  }

  if (!_messagesPageState.initialized) {
    console.warn("refreshSingleConversation: messages page not initialized yet.");
    return;
  }

  try {
    console.log(`🔄 正在刷新對象 ${target_user_id} 的對話資料...`);
    const updatedConv = await fetchSpecificMessageScreenData(target_user_id);

    if (!updatedConv || typeof updatedConv !== "object") {
      console.warn("refreshSingleConversation: 無法取得對話資料或格式錯誤", updatedConv);
      return;
    }

    // --- Step 1: 找出舊資料在 state 中的位置 ---
    const existingIndex = _messagesPageState.conversations.findIndex(
      c => c.other_user?.user_id === target_user_id
    );

    // --- Step 2: 若存在，移除舊的 ---
    if (existingIndex !== -1) {
      _messagesPageState.conversations.splice(existingIndex, 1);

      const oldElem = container.querySelector(`[data-user-id="${target_user_id}"]`);
      if (oldElem && oldElem.parentNode === container) {
        oldElem.remove();
      }
    }

    // --- Step 3: 插入新資料到 state 最前 ---
    _messagesPageState.conversations.unshift(updatedConv);

    // --- Step 4: 呼叫 render，插入最前 ---
    await renderMessageScreenItem(updatedConv, container, { insertPosition: "top" });

    console.log(`✅ 已局部刷新並置頂對象 ${target_user_id} 的對話。`);
  } catch (err) {
    console.error("refreshSingleConversation error:", err);
  }
}

