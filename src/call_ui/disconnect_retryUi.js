/**
 * 顯示「ICE 重新連線中」提示（自動插入 HTML 元件）
 */
export function showIceReconnectingOverlay() {
  // 若已存在，不重複建立
  if (document.getElementById("ice-reconnecting-overlay")) return;

  // 建立容器元素
  const overlay = document.createElement("div");
  overlay.id = "ice-reconnecting-overlay";
  overlay.className =
    "fixed inset-0 flex items-center justify-center bg-black/40 z-50 select-none pointer-events-none";

  // 內部文字元素
  const text = document.createElement("div");
  text.textContent = "Connecting…";
  text.className =
    "text-white text-xl font-semibold animate-ice-shake";

  overlay.appendChild(text);
  document.body.appendChild(overlay);

  // 若動畫 class 尚未定義，動態注入 CSS
  if (!document.getElementById("ice-shake-style")) {
    const style = document.createElement("style");
    style.id = "ice-shake-style";
    style.textContent = `
      @keyframes ice-shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-3px); }
        40% { transform: translateX(3px); }
        60% { transform: translateX(-3px); }
        80% { transform: translateX(3px); }
      }
      @keyframes ice-fade {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      .animate-ice-shake {
        animation: ice-shake 1s infinite, ice-fade 2s infinite;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * 隱藏「ICE 重新連線中」提示
 */
export function hideIceReconnectingOverlay() {
  const overlay = document.getElementById("ice-reconnecting-overlay");
  if (overlay) overlay.remove();
}
/**
 * Display a small bottom notice when the signaling (WSS) connection is lost.
 * The call continues unaffected.
 */
export function showWssDisconnectedNotice() {
  // Prevent duplicates
  if (document.getElementById("wss-disconnected-notice")) return;

  const notice = document.createElement("div");
  notice.id = "wss-disconnected-notice";
  notice.className = `
    fixed bottom-5 left-1/2 -translate-x-1/2
    bg-black/70 text-white text-sm
    px-4 py-2 rounded-lg
    shadow-lg z-50
    animate-wss-fade select-none
  `;
  notice.textContent = "⚠️ Signaling server disconnected. Call still active.";

  document.body.appendChild(notice);

  // Inject animation CSS if not already defined
  if (!document.getElementById("wss-fade-style")) {
    const style = document.createElement("style");
    style.id = "wss-fade-style";
    style.textContent = `
      @keyframes wss-fade {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      .animate-wss-fade {
        animation: wss-fade 2s infinite;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Hide the WSS disconnected notice.
 */
export function hideWssDisconnectedNotice() {
  const notice = document.getElementById("wss-disconnected-notice");
  if (notice) {
    notice.classList.add("opacity-0", "transition-opacity", "duration-500");
    setTimeout(() => notice.remove(), 500);
  }
}

