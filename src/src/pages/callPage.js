import React from "react";
import { createRoot } from "react-dom/client";
import { getState, updateState } from "../utils/uiStateAdapter.js";
import { eventBus } from "../utils/eventBus.js";
import {
  fetchUserProfileUsername,
  fetchUserProfileLanguage,
  fetchUserProfilePicUrl,
} from "../service/getUserProfile.js";
import { formatLanguageName } from "../utils/language/languageDisplay.js";
import CallRuntimePage from "../ui/call/CallRuntimePage.jsx";

const STATE_ID = "CallRuntimePage";

let callRoot = null;
let closeTimer = null;
let closeInterval = null;
let actionsBound = false;

function readCallContext() {
  const ctx = window.__CALL_PAGE_CONTEXT__ || {};
  const isAppFromQuery = (() => {
    try {
      const url = new URL(window.location.href);
      return String(url.searchParams.get("isApp") || "").toLowerCase() === "true";
    } catch {
      return false;
    }
  })();
  return {
    isCaller: typeof ctx.isCaller === "boolean" ? ctx.isCaller : window.__IS_CALLER__ === true,
    isApp: typeof ctx.isApp === "boolean" ? ctx.isApp : isAppFromQuery,
    targetId: ctx.targetId || window.__TARGET_USER_ID__ || "",
  };
}

function readState() {
  return getState(STATE_ID) || {};
}

function patchState(patch) {
  updateState(STATE_ID, {
    ...readState(),
    ...patch,
  });
}

function patchCallEndOverlay(patch) {
  const prev = readState().callEndOverlay || {};
  patchState({
    callEndOverlay: {
      ...prev,
      ...patch,
    },
  });
}

function clearCallEndTimers() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  if (closeInterval) {
    clearInterval(closeInterval);
    closeInterval = null;
  }
}

function closePageWithFallback() {
  try {
    window.close();
  } catch {}

  // If close is blocked by browser, keep minimal end-call view.
  setTimeout(() => {
    if (document.visibilityState !== "hidden") {
      patchCallEndOverlay({ visible: true, fallbackOnly: true });
    }
  }, 250);
}

function toSafeText(value, fallback = "Unknown") {
  const text = String(value || "").trim();
  return text || fallback;
}

function detectCallLocale() {
  if (typeof navigator === "undefined") return "en";
  const lang = String(navigator.language || "").toLowerCase();
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

function normalizeLangInfo(langInfo) {
  return {
    nativelanguage: toSafeText(langInfo?.nativelanguage, "?"),
    targetlanguage: toSafeText(langInfo?.targetlanguage, "?"),
  };
}

function defaultState(context = {}) {
  const isCaller = !!context.isCaller;
  return {
    isCaller,
    isApp: !!context.isApp,
    targetId: String(context.targetId || ""),
    showStartOverlay: isCaller,
    showDialingOverlay: false,
    dialingText: "Dialing...",
    dialingButtonText: "Cancel",
    showEndCallButton: false,
    showTimeoutOverlay: false,
    showDisconnectedOverlay: false,
    showIceReconnectingOverlay: false,
    showWssDisconnectedNotice: false,
    targetIdentity: {
      username: "Loading...",
      avatarUrl: `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      langInfo: {
        nativelanguage: "?",
        targetlanguage: "?",
      },
    },
    callEndOverlay: {
      visible: false,
      countdown: 10,
      fallbackOnly: false,
      username: "Unknown",
      avatarUrl: `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      langText: "",
      targetId: String(context.targetId || ""),
    },
    stopSignOverlay: {
      visible: false,
      message: "",
      username: "",
      avatarUrl: "",
      langText: "",
      targetId: "",
    },
    initError: {
      visible: false,
      message: "",
    },
  };
}

function ensureMountNode() {
  let host = document.getElementById("call_root");
  if (!host) {
    host = document.createElement("div");
    host.id = "call_root";
    document.body.appendChild(host);
  }
  return host;
}

function bindActions() {
  if (actionsBound) return;
  actionsBound = true;

  eventBus.on("callPage:closeCallEndOverlay", () => {
    clearCallEndTimers();
    patchCallEndOverlay({ visible: false });
    try {
      window.close();
    } catch {}
  });

  eventBus.on("callPage:viewProfileFromCallEnd", (params = {}) => {
    const targetId = String(params?.targetId || readState()?.callEndOverlay?.targetId || "").trim();
    if (!targetId) return;
    patchCallEndOverlay({ visible: false });
    window.location.replace(`/user/${encodeURIComponent(targetId)}`);
  });

  eventBus.on("callPage:closeStopSign", () => {
    patchState({ stopSignOverlay: { ...readState().stopSignOverlay, visible: false } });
    try {
      window.close();
    } catch {}
  });

  eventBus.on("callPage:viewStopSignProfile", (params = {}) => {
    const targetId = String(params?.targetId || readState()?.stopSignOverlay?.targetId || "").trim();
    if (!targetId) return;
    patchState({ stopSignOverlay: { ...readState().stopSignOverlay, visible: false } });
    window.location.replace(`/user/${encodeURIComponent(targetId)}`);
  });
}

function mountCallRuntimePage(context = {}) {
  const host = ensureMountNode();
  if (!callRoot) callRoot = createRoot(host);
  updateState(STATE_ID, defaultState(context));
  bindActions();
  callRoot.render(React.createElement(CallRuntimePage));
}

export function initCallPage() {
  const { isCaller, isApp, targetId } = readCallContext();
  mountCallRuntimePage({ isCaller, isApp, targetId });
}

export function createDefaultCallPeerUiState(targetId = "") {
  return {
    targetId: String(targetId || ""),
    username: "Unknown",
    avatarUrl: `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
    langInfo: {
      nativelanguage: "?",
      targetlanguage: "?",
    },
  };
}

export async function loadCallPeerUiState(targetId) {
  const base = createDefaultCallPeerUiState(targetId);
  try {
    const [username, avatarUrl, langInfo] = await Promise.all([
      fetchUserProfileUsername(base.targetId),
      fetchUserProfilePicUrl(base.targetId),
      fetchUserProfileLanguage(base.targetId),
    ]);

    return {
      ...base,
      username: toSafeText(username, base.username),
      avatarUrl: toSafeText(avatarUrl, base.avatarUrl),
      langInfo: normalizeLangInfo(langInfo),
    };
  } catch (err) {
    console.error("❌ [callUiState] loadCallPeerUiState failed:", err);
    return base;
  }
}

export function applyTargetIdentity(peerUiState = {}) {
  patchState({
    targetIdentity: {
      username: String(peerUiState?.username || "Unknown"),
      avatarUrl: String(peerUiState?.avatarUrl || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`),
      langInfo: {
        nativelanguage: String(peerUiState?.langInfo?.nativelanguage || "?"),
        targetlanguage: String(peerUiState?.langInfo?.targetlanguage || "?"),
      },
    },
  });
}

export function showDialing() {
  patchState({
    showDialingOverlay: true,
    showEndCallButton: true,
    dialingText: "Dialing...",
    dialingButtonText: "Cancel",
  });
}

export function hideStartOverlay() {
  patchState({ showStartOverlay: false });
}

export function hideDialing() {
  patchState({ showDialingOverlay: false });
}

export function showEndCallButton() {
  patchState({ showEndCallButton: true });
}

export function showTimeoutAndHideDialing() {
  patchState({
    showDialingOverlay: false,
    showTimeoutOverlay: true,
  });
}

export function setDialingBusyCopy() {
  patchState({
    dialingText: "The person you are calling is on another call",
    dialingButtonText: "quit",
  });
}

export function showIceReconnectingOverlay() {
  patchState({ showIceReconnectingOverlay: true });
}

export function hideIceReconnectingOverlay() {
  patchState({ showIceReconnectingOverlay: false });
}

export function showWssDisconnectedNotice() {
  patchState({ showWssDisconnectedNotice: true });
}

export function hideWssDisconnectedNotice() {
  patchState({ showWssDisconnectedNotice: false });
}

export function showCallInitError(message = "Failed to initialize call") {
  const safeMessage = String(message || "").trim() || "Failed to initialize call";
  patchState({
    initError: {
      visible: true,
      message: safeMessage,
    },
  });
}

export function hideCallInitError() {
  patchState({
    initError: {
      visible: false,
      message: "",
    },
  });
}

export function showCallEndOverlay(target_avatar_url, target_langInfo, target_username, target_id) {
  clearCallEndTimers();
  const locale = detectCallLocale();
  const langText = target_langInfo
    ? `${formatLanguageName(target_langInfo.nativelanguage, "?", locale)} → ${formatLanguageName(target_langInfo.targetlanguage, "?", locale)}`
    : "";

  patchCallEndOverlay({
    visible: true,
    countdown: 10,
    fallbackOnly: false,
    username: target_username || "Unknown",
    avatarUrl: target_avatar_url || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
    langText,
    targetId: String(target_id || ""),
  });

  closeInterval = setInterval(() => {
    const next = Math.max(0, Number(readState()?.callEndOverlay?.countdown || 0) - 1);
    patchCallEndOverlay({ countdown: next });
  }, 1000);

  closeTimer = setTimeout(() => {
    clearCallEndTimers();
    closePageWithFallback();
  }, 10000);
}

export async function showStopSign(reason = "error", targetId = null) {
  const locale = detectCallLocale();
  const messagesByLocale = {
    en: {
      offline: "The user is currently offline and cannot receive the call.",
      busy: "The user is already on another call. Please try again later.",
      error: "The call was interrupted. Please try again.",
      peerLeft: "The other participant has left the call.",
      iceFailed: "ICE connection lost. The call has been disconnected.",
      ratelimit: "You are making calls too frequently. Please wait a moment before trying again.",
      replaced: "Your session was replaced by another device or tab.",
      meCancelCall: "You canceled the call.",
      timeout: "The call request timed out. Please try again later.",
    },
    zh: {
      offline: "對方目前離線，無法接聽通話。",
      busy: "對方正在通話中，請稍後再試。",
      error: "通話中斷，請再試一次。",
      peerLeft: "對方已離開通話。",
      iceFailed: "ICE 連線中斷，通話已斷線。",
      ratelimit: "你發起通話過於頻繁，請稍後再試。",
      replaced: "你的通話已被其他裝置或分頁取代。",
      meCancelCall: "你已取消通話。",
      timeout: "通話邀請逾時，請稍後再試。",
    },
  };
  const messages = messagesByLocale[locale] || messagesByLocale.en;

  const safeTargetId = String(targetId || "").trim();
  let username = "";
  let avatarUrl = "";
  let langText = "";

  if (safeTargetId) {
    try {
      const [nameRes, langRes, avatarRes] = await Promise.all([
        fetchUserProfileUsername(safeTargetId),
        fetchUserProfileLanguage(safeTargetId),
        fetchUserProfilePicUrl(safeTargetId),
      ]);
      username = String(nameRes || "Unknown");
      avatarUrl = String(avatarRes || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`);
      langText = `${formatLanguageName(langRes?.nativelanguage, "?", locale)} → ${formatLanguageName(langRes?.targetlanguage, "?", locale)}`;
    } catch (err) {
      console.warn("showStopSign profile load failed:", err);
    }
  }

  patchState({
    stopSignOverlay: {
      visible: true,
      message: messages[reason] || messages.error,
      username,
      avatarUrl,
      langText,
      targetId: safeTargetId,
    },
  });
}
