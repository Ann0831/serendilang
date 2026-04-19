import React from "react";
import { createRoot } from "react-dom/client";
import { getState, updateState } from "../utils/uiStateAdapter.js";
import { eventBus } from "../utils/eventBus.js";
import { clearGoogleOauthCookieService, getGoogleOauthStatusService } from "../service/OAuth.js";
import { safeNaviagate } from "../utils/safeNavigate.js";
import OauthResultPage from "../ui/pages/OauthResultPage.jsx";

const STATE_ID = "OauthResultPage";

const DEFAULT_STATE = {
  scene: "general",
  reason: "UNKNOWN",
  title: "OAuth Error",
  message: "Unable to continue OAuth flow. Please try again.",
  isProcessing: false,
  oauth: {
    loading: false,
    email: "",
    name: "",
    picture: "",
    hasIdentity: false,
  },
};

const REASON_MAP = {
  OAUTH_EXPIRED: {
    title: "Session Expired",
    message: "Your OAuth session expired. Please retry sign-in.",
  },
  EMAIL_UNVERIFIED: {
    title: "Email Not Verified",
    message: "Your Google account email is not verified.",
  },
  EMAIL_NOT_FOUND: {
    title: "Account Not Found",
    message: "No account is linked to this Google email.",
  },
  EMAIL_ALREADY_REGISTERED: {
    title: "Already Registered",
    message: "This Google email is already registered.",
  },
  ACCOUNT_SUSPENDED: {
    title: "Account Suspended",
    message: "This account is suspended due to policy violations.",
  },
};

let root = null;

function readState() {
  return getState(STATE_ID) || DEFAULT_STATE;
}

function patchState(patch) {
  updateState(STATE_ID, {
    ...readState(),
    ...patch,
  });
}

function ensureMountNode() {
  let host = document.getElementById("oauth_result_pages");
  if (!host) {
    host = document.createElement("main");
    host.id = "oauth_result_pages";
    host.className = "w-full min-h-screen";
    document.body.appendChild(host);
  }
  return host;
}

function ensureMounted() {
  const host = ensureMountNode();
  if (!root) root = createRoot(host);
  root.render(React.createElement(OauthResultPage));
}

function getRetryPath(scene) {
  return scene === "register" ? "/register/oauth/google" : "/login/oauth/google";
}

function readSceneAndReason() {
  const params = new URLSearchParams(window.location.search);
  return {
    scene: params.get("scene") || "general",
    reason: params.get("reason") || "UNKNOWN",
  };
}

function buildSceneContent(scene, reason) {
  const preset = REASON_MAP[reason] || DEFAULT_STATE;
  return {
    title: scene === "register" ? `${preset.title} (Register)` : preset.title,
    message: preset.message,
  };
}

async function loadOauthIdentity() {
  patchState({
    oauth: { ...readState().oauth, loading: true },
  });

  try {
    const info = await getGoogleOauthStatusService();
    if (!info?.email) {
      patchState({
        oauth: {
          loading: false,
          email: "",
          name: "",
          picture: "",
          hasIdentity: false,
        },
      });
      return;
    }

    patchState({
      oauth: {
        loading: false,
        email: info.email || "",
        name: info.name || "",
        picture: info.picture || "",
        hasIdentity: true,
      },
    });
  } catch (err) {
    console.error("[oauthResultPage] load oauth identity failed:", err);
    patchState({
      oauth: { ...readState().oauth, loading: false },
    });
  }
}

async function clearCookieAndRedirect() {
  const state = readState();
  if (state.isProcessing) return;

  patchState({ isProcessing: true });

  try {
    const ok = await clearGoogleOauthCookieService();
    if (!ok) {
      eventBus.emit("pushErrorMessage", {
        title: "Switch failed",
        message: "Failed to clear Google OAuth session. Please try again.",
      });
      patchState({ isProcessing: false });
      return;
    }

    safeNaviagate(getRetryPath(state.scene));
  } catch (err) {
    console.error("[oauthResultPage] clear cookie and redirect failed:", err);
    eventBus.emit("pushErrorMessage", {
      title: "Switch failed",
      message: "Unable to continue. Please retry in a moment.",
    });
    patchState({ isProcessing: false });
  }
}

async function clearCookieAndRedirectTo(pathname) {
  const state = readState();
  if (state.isProcessing) return;

  patchState({ isProcessing: true });
  try {
    const ok = await clearGoogleOauthCookieService();
    if (!ok) {
      eventBus.emit("pushErrorMessage", {
        title: "Switch failed",
        message: "Failed to clear Google OAuth session. Please try again.",
      });
      patchState({ isProcessing: false });
      return;
    }
    safeNaviagate(pathname);
  } catch (err) {
    console.error("[oauthResultPage] redirect failed:", err);
    eventBus.emit("pushErrorMessage", {
      title: "Switch failed",
      message: "Unable to continue. Please retry in a moment.",
    });
    patchState({ isProcessing: false });
  }
}

export async function initOauthResultPage() {
  ensureMounted();

  const { scene, reason } = readSceneAndReason();
  const content = buildSceneContent(scene, reason);

  updateState(STATE_ID, {
    ...DEFAULT_STATE,
    scene,
    reason,
    title: content.title,
    message: content.message,
  });

  await loadOauthIdentity();
}

export async function oauthResultRetry() {
  await clearCookieAndRedirect();
}

export async function oauthResultUseAnotherAccount() {
  await clearCookieAndRedirect();
}

export async function oauthResultGoRegister() {
  await clearCookieAndRedirectTo("/register/oauth/google");
}
