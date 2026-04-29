import "../css/index.css";
import "../assets/css/tabler-icons.min.css";
import { initCallPage } from "../pages/callPage.js";
import { showCallInitError, hideCallInitError } from "../pages/callPage.js";
import { registerPeerEvents } from "../call/peerEventRegister.js";
import { initializeCallSession } from "../service/callInitService.js";
import { registerCallPageEventHandlers } from "../event/callpage_eventHandlers.js";
import { initializeWss } from "../wss/wssCenter.js";

function readInitArgsFromUrl() {
  const url = new URL(window.location.href);
  const targetId = String(url.searchParams.get("target_id") || "").trim();
  const useCamera = url.searchParams.get("useCamera") === "1";
  const isApp = String(url.searchParams.get("isApp") || "").toLowerCase() === "true";
  const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
  const isCaller = normalizedPath === "/call";

  return { targetId, useCamera, isCaller, isApp };
}

function applyCallWindowContext(payload) {
  window.__IS_CALLER__ = payload.isCaller;
  window.__CURRENT_USER_ID__ = payload.currentUserId;
  window.__TARGET_USER_ID__ = payload.targetId;
  window.__ENABLE_CAMERA__ = payload.useCamera ? "1" : "0";
  window.__CALL_EXTERNAL_ID__ = payload.callId;
  window.__RTC_CONFIG__ = payload.rtcConfig;
  window.Only__Stun__RTC_CONFIG__ = payload.onlyStunRtcConfig;
  window.Only__Turn__RTC_CONFIG__ = payload.onlyTurnRtcConfig;
  window.Only__External__RTC_CONFIG__ = payload.onlyExternalRtcConfig;

  window.__CALL_PAGE_CONTEXT__ = {
    isCaller: payload.isCaller,
    isApp: !!payload.isApp,
    currentUserId: payload.currentUserId,
    targetId: payload.targetId,
    enableCamera: payload.useCamera,
    callExternalId: payload.callId,
    rtcConfig: payload.rtcConfig,
    onlyStunRtcConfig: payload.onlyStunRtcConfig,
    onlyTurnRtcConfig: payload.onlyTurnRtcConfig,
    onlyExternalRtcConfig: payload.onlyExternalRtcConfig,
  };
}

async function bootstrapCallPage() {
  const { targetId, useCamera, isCaller, isApp } = readInitArgsFromUrl();

  window.__CALL_PAGE_CONTEXT__ = {
    ...(window.__CALL_PAGE_CONTEXT__ || {}),
    isCaller,
    isApp,
    targetId,
    enableCamera: useCamera,
  };
  console.log("[call-init] before registerCallPageEventHandlers");
  registerCallPageEventHandlers();
  console.log("[call-init] after registerCallPageEventHandlers");

  console.log("[call-init] before initCallPage", {
    targetId,
    isCaller,
    isApp,
    useCamera,
  });
  initCallPage();
  console.log("[call-init] after initCallPage");

  if (!targetId) {
    showCallInitError("Missing target_id");
    return;
  }

  const initResult = await initializeCallSession({ targetId, useCamera, isCaller });
  if (initResult.result !== "success") {
    showCallInitError("Failed to initialize call");
    return;
  }

  hideCallInitError();
  applyCallWindowContext({
    ...initResult.payload,
    isApp,
  });

  if (!isApp) {
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsBaseUrl = `${wsProto}//${window.location.host}/`;
    initializeWss(wsBaseUrl, { type: "normal" });
  }
  registerPeerEvents();

  if (window.__IS_CALLER__ === true) {
    await import("../call/makeCall_Bootstrap.js");
  } else {
    await import("../call/acceptCall_Bootstrap.js");
  }
}

void bootstrapCallPage();
