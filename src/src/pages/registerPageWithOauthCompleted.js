import React from "react";
import { createRoot } from "react-dom/client";
import { getState, updateState } from "../utils/uiStateAdapter.js";
import { validlanguage } from "../utils/language/validLanguage.js";
import { verifyUsernameBeforeRegister, registerWithOauthService } from "../service/registerService.js";
import { eventBus } from "../utils/eventBus.js";
import RegisterPageWithOauthCompleted from "../ui/pages/RegisterPageWithOauthCompleted.jsx";
import { clearGoogleOauthCookieService, getGoogleOauthStatusService } from "../service/OAuth.js";
import { safeNaviagate } from "../utils/safeNavigate.js";

const STATE_ID = "RegisterPageWithOauthCompleted";

const DEFAULT_STATE = {
  step: 1,
  isChecking: false,
  isSubmitting: false,
  languages: [],
  oauth: {
    loading: false,
    email: "",
    name: "",
    picture: "",
  },
  form: {
    username: "",
    nativeLanguage: "",
    targetLanguage: "",
    invitationCode: "",
    agree: false,
    profilePicFile: null,
    profilePicUrl: "",
  },
  errors: {
    username: "",
    agree: "",
    general: "",
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

function patchForm(patch) {
  const prev = readState();
  updateState(STATE_ID, {
    ...prev,
    form: {
      ...prev.form,
      ...patch,
    },
  });
}

function patchErrors(patch) {
  const prev = readState();
  updateState(STATE_ID, {
    ...prev,
    errors: {
      ...prev.errors,
      ...patch,
    },
  });
}

function ensureMountNode() {
  let host = document.getElementById("register_oauth_completed_pages");
  if (!host) {
    host = document.createElement("main");
    host.id = "register_oauth_completed_pages";
    host.style.marginTop = "4rem";
    host.style.height = "calc(100vh - 4rem)";
    host.style.minHeight = "calc(100vh - 4rem)";
    document.body.appendChild(host);
  }
  return host;
}

function ensureMounted() {
  const host = ensureMountNode();
  if (!root) root = createRoot(host);
  root.render(React.createElement(RegisterPageWithOauthCompleted));
}

function clearErrors() {
  patchErrors({
    username: "",
    agree: "",
    general: "",
  });
}

function validateStepOne(form) {
  const username = String(form.username || "").trim();
  if (!username) {
    return { valid: false, error: "Username cannot be empty." };
  }
  return { valid: true, error: "" };
}

function normalizeVerifyResult(result) {
  if (typeof result === "string") return result;
  if (result && typeof result === "object") {
    if (typeof result.result === "string") return result.result;
    if (result.available === true) return "available";
    if (result.available === false) return "used";
  }
  return "error";
}

function hasOauthEmail(state) {
  const email = String(state?.oauth?.email || "").trim();
  return email.length > 0;
}

async function loadOauthIdentity() {
  patchState({ oauth: { ...readState().oauth, loading: true } });
  try {
    const info = await getGoogleOauthStatusService();
    patchState({
      oauth: {
        loading: false,
        email: info?.email || "",
        name: info?.name || "",
        picture: info?.picture || "",
      },
    });
  } catch (err) {
    console.error("[registerPageWithOauthCompleted] load oauth identity failed:", err);
    patchState({
      oauth: { ...readState().oauth, loading: false },
    });
  }
}

export async function initRegisterPageWithOauthCompleted() {
  ensureMounted();
  const { languages } = validlanguage();
  const list = Array.isArray(languages) ? languages : [];

  const nativeDefault = list.find((x) => x?.lowercase === "chinese (mandarin)")?.lowercase || list[0]?.lowercase || "";
  const targetDefault = list.find((x) => x?.lowercase === "english")?.lowercase || list[0]?.lowercase || "";

  updateState(STATE_ID, {
    ...DEFAULT_STATE,
    languages: list,
    form: {
      ...DEFAULT_STATE.form,
      nativeLanguage: nativeDefault,
      targetLanguage: targetDefault,
    },
  });

  await loadOauthIdentity();
}

export function registerOauthCompletedSetField(field, value) {
  if (!field) return;
  patchForm({ [field]: value });
  patchErrors({ general: "" });
  if (field === "username") patchErrors({ username: "" });
  if (field === "agree") patchErrors({ agree: "" });
}

export function registerOauthCompletedSetProfilePic(file) {
  if (!file) {
    patchForm({ profilePicFile: null, profilePicUrl: "" });
    return;
  }
  const preview = URL.createObjectURL(file);
  patchForm({ profilePicFile: file, profilePicUrl: preview });
}

export function registerOauthCompletedPrevStep() {
  const prev = readState();
  patchState({ step: Math.max(1, Number(prev.step || 1) - 1) });
}

export function registerOauthCompletedSkipAvatarStep() {
  patchState({ step: 4 });
}

export async function registerOauthCompletedNextStep() {
  const prev = readState();
  if (prev.isChecking || prev.isSubmitting) return;

  if (prev.step !== 1) {
    patchState({ step: Math.min(4, Number(prev.step || 1) + 1) });
    return;
  }

  clearErrors();
  if (!hasOauthEmail(prev)) {
    patchErrors({ general: "Please sign in with a Google account before continuing." });
    return;
  }

  const local = validateStepOne(prev.form);
  if (!local.valid) {
    patchErrors({ username: local.error });
    return;
  }

  patchState({ isChecking: true });
  try {
    const verifyRes = await verifyUsernameBeforeRegister(String(prev.form.username || "").trim());
    const status = normalizeVerifyResult(verifyRes);

    if (status === "available") {
      patchState({ step: 2 });
      return;
    }
    if (status === "used") {
      patchErrors({ username: "This username is already taken." });
      return;
    }
    if (status === "illegal") {
      patchErrors({ username: "Username can only contain letters, numbers, and underscores, and must be under 20 characters." });
      return;
    }
    patchErrors({ general: "Network error, please try again later." });
  } catch (error) {
    console.error("[registerPageWithOauthCompleted] verify username failed:", error);
    patchErrors({ general: "Network error, please try again later." });
  } finally {
    patchState({ isChecking: false });
  }
}

export async function registerOauthCompletedSubmit() {
  const prev = readState();
  if (prev.isSubmitting || prev.isChecking) return;

  clearErrors();
  if (Number(prev.step || 1) !== 4) {
    patchState({ step: 4 });
    return;
  }
  if (!hasOauthEmail(prev)) {
    patchErrors({ general: "Please sign in with a Google account before continuing." });
    patchState({ step: 1 });
    return;
  }

  const local = validateStepOne(prev.form);
  if (!local.valid) {
    patchErrors({ username: local.error });
    patchState({ step: 1 });
    return;
  }
  if (!prev.form.agree) {
    patchErrors({ agree: "Please agree to the Terms and Privacy Policy before continuing." });
    return;
  }

  patchState({ isSubmitting: true });
  try {
    const payload = {
      username: String(prev.form.username || "").trim(),
      nativelanguage: prev.form.nativeLanguage || "",
      targetlanguage: prev.form.targetLanguage || "",
      profilePicFile: prev.form.profilePicFile || null,
      inviteCode: String(prev.form.invitationCode || "").trim(),
      agree_terms: true,
      agree_privacy: true,
    };

    const res = await registerWithOauthService(payload);
    if (res?.result === "success") {
      eventBus.emit("pushNotification", {
        message: "Registration successful! Redirecting...",
        level: "success",
        timeoutMs: 1500,
      });
      setTimeout(() => {
        safeNaviagate("/");
      }, 900);
      return;
    }
    patchErrors({ general: "Registration failed." });
  } catch (error) {
    console.error("[registerPageWithOauthCompleted] submit failed:", error);
    patchErrors({ general: "Network error during registration." });
  } finally {
    patchState({ isSubmitting: false });
  }
}

export async function registerOauthCompletedSwitchAccount() {
  const ok = await clearGoogleOauthCookieService();
  if (!ok) {
    patchErrors({ general: "Failed to switch account. Please try again." });
    return;
  }
  safeNaviagate("/register/oauth/google", { replace: true });
}
