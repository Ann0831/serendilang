import {createIncomingCallOverlay} from "/ui_create/createChatRoom.js";


/**
 * 顯示來電請求
 * @param {HTMLElement} chatRoomEl - 外層聊天室元素 (含 incoming-call-overlay)
 * @param {Object} options - 可選參數，例如來電者名稱
 */
export function showCallRequest(chatRoomEl, options = {}) {
  if (!chatRoomEl) return;

  // 若已存在舊 overlay，先不弄
  const oldOverlay = chatRoomEl.querySelector(".incoming-call-overlay");
  if (oldOverlay){
	  return;
  }

  // 建立新的 overlay（內部已包含倒數弧度邏輯）
  const overlay = createIncomingCallOverlay(chatRoomEl.dataset.username, chatRoomEl.dataset.userId, options.duration || 25);

  // 放進聊天室容器
  chatRoomEl.appendChild(overlay);

  // 顯示 overlay（createIncomingCallOverlay 已經是顯示狀態）
  overlay.classList.remove("hidden");


  // ✅ 若要自動關閉（例如倒數結束後）
  // 已在 createIncomingCallOverlay 內處理 overlay.remove()
}
/**
 * 取消來電請求（隱藏 overlay）
 * @param {HTMLElement} chatRoomEl - 外層聊天室元素
 */
export function cancelCallRequest(chatRoomEl) {
  const overlay = chatRoomEl.querySelector(".incoming-call-overlay");
  const wrapper = chatRoomEl.querySelector(".messages-container");

  // 1. 移除 overlay
  if (overlay) overlay.remove();

  // 2. 即時印出 cache 狀態
  console.log("[cancelCallRequest] _scrollCache =", wrapper?._scrollCache);

  if (wrapper && wrapper._scrollCache) {
    console.log("[cancelCallRequest] cached scrollTop =", wrapper._scrollCache.top);
  } else {
    console.log("[cancelCallRequest] ⚠️ 沒有 scrollCache → 之後會自動捲到底部");
  }

  // 3. 延遲 0.2 秒後處理 scroll 還原 / 滾到底部
  setTimeout(() => {
    if (!wrapper) return;

    if (
      wrapper._scrollCache &&
      typeof wrapper._scrollCache.top === "number"
    ) {
      // ✔ 有 cache → 恢復原捲動位置
      wrapper.scrollTop = wrapper._scrollCache.top;
      console.log("[cancelCallRequest] ✨ 已恢復原本 scrollTop =", wrapper._scrollCache.top);
    } else {
      // ✔ No cache → 捲到最底
      wrapper.scrollTop = wrapper.scrollHeight;
      console.log("[cancelCallRequest] ⬇️ 沒 cache → 已自動捲到底部");
    }
  }, 200);
}

