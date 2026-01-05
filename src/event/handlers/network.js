// /event/handlers/network.js
import { eventBus } from "/utils/eventBus.js";
import { scheduleReconnect,resetWssConnection } from "/wss/wssCenter.js";

/** ====== DOM helpers ====== */
function $(id) {
  return document.getElementById(id);
}
function hide(el) {
  if (el) el.classList.add("hidden");
}
function show(el) {
  if (el) el.classList.remove("hidden");
}

/** ====== Banners API (可在別處直接呼叫) ====== */

/**
 * 打開「一般網路狀態」提示 Banner
 * @param {"USER_OFFLINE"|"SERVER_UNREACHABLE"|string} state
 * @param {string} [customMessage]
 */
export function openNetworkBanner(state, customMessage) {
  const banner = $("network-banner");
  const msgEl  = $("network-banner-message");
  if (!banner || !msgEl) return;

  let message = "⚠️ Unexpected network issue.";
  switch (state) {
    case "USER_OFFLINE":
      message = "⚠️ You are offline. Please check your internet connection.";
      break;
    case "SERVER_UNREACHABLE":
      message = "⚠️ Cannot reach the server.";
      break;
    default:
      if (typeof customMessage === "string" && customMessage.trim()) {
        message = customMessage.trim();
      }
  }
  msgEl.textContent = message;
  show(banner);
}

export function closeNetworkBanner() {
  hide($("network-banner"));
}

/** WSS 斷線提示 */
export function showWssDisconnected() {
  const banner = $("wss-banner");
  if (banner) show(banner);

  // 只有在頁面可見時才嘗試自動重連
  if (!document.hidden) {
    scheduleReconnect();
  } else {
    console.log("📄 頁面隱藏中，暫停自動重連");
  }
}

/** WSS 已連線提示（含 2 秒成功 Toast） */
export function showWssConnected() {
  hide($("wss-banner"));

  const toast = $("wss-success-toast");
  if (toast) {
    show(toast);
    setTimeout(() => hide(toast), 2000);
  }
}

export function closeWssBanner() {
  hide($("wss-banner"));
}

/** Rate limit 提示 */
export function showRateLimitBanner(message) {
  const banner = $("rate-limit-banner");
  const text   = $("rate-limit-banner-message");

  if (!banner) {
    console.error("找不到 #rate-limit-banner");
    return;
  }
  if (text && typeof message === "string" && message.trim()) {
    text.textContent = message.trim();
  }
  show(banner);
}

export function closeRateLimitBanner() {
  const banner = $("rate-limit-banner");
  if (!banner) {
    console.error("找不到 #rate-limit-banner");
    return;
  }
  hide(banner);
}

/** ====== 集中註冊：把所有 network/wss 事件掛上 eventBus ====== */
export function registerNetworkHandlers() {
  eventBus.on("openNetworkBanner", (params) => {
    // params: { state?: string, message?: string }
    console.log("[event] openNetworkBanner:", params);
    const state = params?.state;
    const msg   = params?.message;
    openNetworkBanner(state, msg);
  });

  eventBus.on("closeNetworkBanner", (params) => {
    console.log("[event] closeNetworkBanner:", params);
    closeNetworkBanner();
  });

  eventBus.on("wssDisconnected", (params) => {
    console.log("[event] wssDisconnected:", params);
    showWssDisconnected(params);
  });
  eventBus.on("wssReset", (params) => {
    console.log("wssReset", params);
    resetWssConnection(params);
  });

  eventBus.on("wssConnected", (params) => {
    console.log("[event] wssConnected:", params);
    showWssConnected();
  });

  eventBus.on("closeWssBanner", (params) => {
    console.log("[event] closeWssBanner:", params);
    closeWssBanner();
  });

  eventBus.on("RateLimitExceeded", (params) => {
    // params: { message?: string }
    console.log("[event] RateLimitExceeded:", params);
    showRateLimitBanner(params?.message);
  });

  eventBus.on("closeRateLimitBanner", (params) => {
    console.log("[event] closeRateLimitBanner:", params);
    closeRateLimitBanner();
  });

  console.log("✅ registerNetworkHandlers: network & wss events registered.");
}

