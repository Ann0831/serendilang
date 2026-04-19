import "../css/index.css";
import { registerUserPageEventHandlers } from "../event/userpage_eventHandlers.js";
import { initializeEmitEvent } from "../event/eventEmitter.js";
import { initUserProfilePage } from "../pages/userpage_manager.js";
import { initLoginModalLayer } from "../pages/loginModalLayer.js";
import { isTestEnv } from "../environment/env.js";
import { refreshUserData, getCurrentUserIdentity_Global } from "../userSelfData/userSelfData.js";

function readUserIdFromPath() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && segments[0] === "user") {
    return String(segments[1] || "").trim();
  }
  return "";
}

function readUserIdFallback() {
  const fromCtx = String(window.__USER_PROFILE_CONTEXT__?.userId || "").trim();
  if (fromCtx) return fromCtx;

  const fromDataAttr = String(document.getElementById("userprofilepage-userinfo")?.dataset?.userId || "").trim();
  if (fromDataAttr) return fromDataAttr;

  const fromQuery = String(new URL(window.location.href).searchParams.get("user_id") || "").trim();
  if (fromQuery) return fromQuery;

  return "";
}

async function detectLoginState() {
  try {
    await refreshUserData();
    const identity = await getCurrentUserIdentity_Global();
    return !!identity?.user_id;
  } catch (err) {
    console.warn("[userpage_initializer] detectLoginState failed:", err);
    return false;
  }
}

function applyUserPageConfig(isLogin) {
  window.USER_PAGE_CONFIG = isLogin
    ? {}
    : {
        disableIdentityHandlers: true,
        disableFriendRequestHandlers: true,
        disableUserBlockHandlers: true,
        disableReportUserHandlers: true,
        disablePostActionsHandlers: true,
        disableChatRoomHandlers: true,
        disableWssNetWorkHandlers: true,
        disableNetworkHandlers: true,
      };
}

async function bootstrapUserProfilePage() {
  const userId = readUserIdFromPath() || (isTestEnv ? readUserIdFallback() : "");
  if (!userId) return;

  const isLogin = await detectLoginState();
  applyUserPageConfig(isLogin);

  window.__USER_PROFILE_CONTEXT__ = {
    isLogin,
    userId,
  };

  registerUserPageEventHandlers();
  initializeEmitEvent();
  initLoginModalLayer();
  initUserProfilePage();
}

void bootstrapUserProfilePage();

