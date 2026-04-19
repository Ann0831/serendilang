// /event/handlers/network.js
import { eventBus } from "../../utils/eventBus.js";
import { scheduleReconnect,resetWssConnection } from "../../wss/wssCenter.js";
import { dismissErrorMessagesByKey, pushErrorMessage } from "../../pages/errorMessagesPage.js";
import { isTestEnv } from "../../environment/env.js";

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
  let message = "Unexpected network issue.";
  switch (state) {
    case "USER_OFFLINE":
      message = "You are offline. Please check your internet connection.";
      break;
    case "SERVER_UNREACHABLE":
      message = "Cannot reach the server.";
      break;
    default:
      if (typeof customMessage === "string" && customMessage.trim()) {
        message = customMessage.trim();
      }
  }

  pushErrorMessage({
    key: "network-banner",
    title: "Network Error",
    message,
    iconClass: "ti ti-alert-triangle",
    level: "error",
    sticky: true,
  });
}

export function closeNetworkBanner() {
  dismissErrorMessagesByKey("network-banner");
}

/** WSS 斷線提示 */
export function showWssDisconnected() {
  dismissErrorMessagesByKey("wss-reconnected");
  pushErrorMessage({
    key: "wss-disconnected",
    title: "Connection Lost",
    message: "Realtime connection was disconnected. Trying to reconnect...",
    level: "warn",
    sticky: true,
  });

  // 只有在頁面可見時才嘗試自動重連
  if (!document.hidden) {
    scheduleReconnect();
  } else {
    console.log("📄 頁面隱藏中，暫停自動重連");
  }
}

/** WSS 已連線提示（含 2 秒成功 Toast） */
export function showWssConnected() {
  dismissErrorMessagesByKey("wss-disconnected");
  pushErrorMessage({
    key: "wss-reconnected",
    title: "Connection Restored",
    message: "Realtime connection has been restored.",
    level: "success",
    sticky: false,
    timeoutMs: 3000,
  });

  const toast = $("wss-success-toast");
  if (toast) {
    show(toast);
    setTimeout(() => hide(toast), 2000);
  }
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
  pushErrorMessage({
    key: "rate-limit-banner",
    title: "Too Many Requests",
    message: (typeof message === "string" && message.trim()) ? message.trim() : "Rate limit exceeded. Please try again later.",
    level: "warn",
    sticky: false,
    timeoutMs: 6000,
  });
}

export function closeRateLimitBanner() {
  const banner = $("rate-limit-banner");
  if (!banner) {
    console.error("找不到 #rate-limit-banner");
    return;
  }
  hide(banner);
  dismissErrorMessagesByKey("rate-limit-banner");
}

/** ====== 集中註冊：把所有 network/wss 事件掛上 eventBus ====== */
export function registerNetworkHandlers() {
  eventBus.on("networkDisconnected", (params) => {
    console.log("[event] networkDisconnected:", params);
    openNetworkBanner(params?.state, params?.message);
  });

  eventBus.on("networkConnected", (params) => {
    console.log("[event] networkConnected:", params);
    closeNetworkBanner();
  });

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

  eventBus.on("RateLimitExceeded", (params) => {
    // params: { message?: string }
    console.log("[event] RateLimitExceeded:", params);
    showRateLimitBanner(params?.message);
  });

  eventBus.on("closeRateLimitBanner", (params) => {
    console.log("[event] closeRateLimitBanner:", params);
    closeRateLimitBanner();
  });

  if (isTestEnv) {
    import("../../tests/wssDisconnection.test.js")
      .then((mod) => mod.runWssDisconnectionTest())
      .catch((err) => console.error("[network test] failed to run wss disconnection test:", err));
  }

  console.log("✅ registerNetworkHandlers: network & wss events registered.");
}
