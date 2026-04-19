import React from "react";
import { createRoot } from "react-dom/client";
import { getState, updateState } from "../utils/uiStateAdapter.js";
import { validlanguage } from "../utils/language/validLanguage.js";
import { verifyUsernameBeforeRegister, registerService } from "../service/registerService.js";
import { hashPassword } from "../utils/hashPassword.js";
import { eventBus } from "../utils/eventBus.js";
import { safeNaviagate } from "../utils/safeNavigate.js";
import RegisterPage from "../ui/pages/RegisterPage.jsx";

const REGISTER_STATE_ID = "RegisterPage";

const DEFAULT_STATE = {
  step: 1,
  isChecking: false,
  isSubmitting: false,
  languages: [],
  form: {
    username: "",
    password: "",
    confirmPassword: "",
    nativeLanguage: "",
    targetLanguage: "",
    invitationCode: "",
    agree: false,
    profilePicFile: null,
    profilePicUrl: "",
  },
  errors: {
    username: "",
    password: "",
    confirmPassword: "",
    agree: "",
    general: "",
  },
};

let registerRoot = null;

function readState() {
  return getState(REGISTER_STATE_ID) || DEFAULT_STATE;
}

function patchState(patch) {
  updateState(REGISTER_STATE_ID, {
    ...readState(),
    ...patch,
  });
}

function patchForm(patch) {
  const prev = readState();
  updateState(REGISTER_STATE_ID, {
    ...prev,
    form: {
      ...prev.form,
      ...patch,
    },
  });
}

function patchErrors(patch) {
  const prev = readState();
  updateState(REGISTER_STATE_ID, {
    ...prev,
    errors: {
      ...prev.errors,
      ...patch,
    },
  });
}

function ensureMountNode() {
  let host = document.getElementById("register_pages");
  if (!host) {
    host = document.createElement("main");
    host.id = "register_pages";
    host.className = "w-full min-h-screen";
    document.body.appendChild(host);
  }
  return host;
}

function ensureMounted() {
  const host = ensureMountNode();
  if (!registerRoot) registerRoot = createRoot(host);
  registerRoot.render(React.createElement(RegisterPage));
}

function clearErrors() {
  patchErrors({
    username: "",
    password: "",
    confirmPassword: "",
    agree: "",
    general: "",
  });
}

function validateStepOne(form) {
  const errors = {
    username: "",
    password: "",
    confirmPassword: "",
  };

  const username = String(form.username || "").trim();
  if (!username) {
    errors.username = "Username cannot be empty.";
  }
  if (String(form.password || "").length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (String(form.confirmPassword || "") !== String(form.password || "")) {
    errors.confirmPassword = "Passwords do not match.";
  }

  const valid = !errors.username && !errors.password && !errors.confirmPassword;
  return { valid, errors };
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

export function initRegisterPage() {
  ensureMounted();
  const { languages } = validlanguage();
  const list = Array.isArray(languages) ? languages : [];

  const nativeDefault = list.find((x) => x?.lowercase === "chinese (mandarin)")?.lowercase || list[0]?.lowercase || "";
  const targetDefault = list.find((x) => x?.lowercase === "english")?.lowercase || list[0]?.lowercase || "";

  updateState(REGISTER_STATE_ID, {
    ...DEFAULT_STATE,
    languages: list,
    form: {
      ...DEFAULT_STATE.form,
      nativeLanguage: nativeDefault,
      targetLanguage: targetDefault,
    },
  });
}

export function registerPageSetField(field, value) {
  if (!field) return;
  patchForm({ [field]: value });
  patchErrors({ general: "" });
  if (field === "username" || field === "password" || field === "confirmPassword") {
    patchErrors({ [field]: "" });
  }
  if (field === "agree") patchErrors({ agree: "" });
}

export function registerPageSetProfilePic(file) {
  if (!file) {
    patchForm({ profilePicFile: null, profilePicUrl: "" });
    return;
  }
  const preview = URL.createObjectURL(file);
  patchForm({ profilePicFile: file, profilePicUrl: preview });
}

export function registerPagePrevStep() {
  const prev = readState();
  patchState({ step: Math.max(1, Number(prev.step || 1) - 1) });
}

export function registerPageSkipToStep3() {
  patchState({ step: 3 });
}

export async function registerPageNextStep() {
  const prev = readState();
  if (prev.isChecking || prev.isSubmitting) return;

  if (prev.step !== 1) {
    patchState({ step: Math.min(3, Number(prev.step || 1) + 1) });
    return;
  }

  clearErrors();
  const local = validateStepOne(prev.form);
  if (!local.valid) {
    patchErrors(local.errors);
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
    console.error("[registerPage] verify username failed:", error);
    patchErrors({ general: "Network error, please try again later." });
  } finally {
    patchState({ isChecking: false });
  }
}

export async function registerPageSubmit() {
  const prev = readState();
  if (prev.isSubmitting || prev.isChecking) return;

  clearErrors();
  const local = validateStepOne(prev.form);
  if (!local.valid) {
    patchErrors(local.errors);
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
      hashed_password: hashPassword(String(prev.form.password || "")),
      nativelanguage: prev.form.nativeLanguage || "",
      targetlanguage: prev.form.targetLanguage || "",
      profilePicFile: prev.form.profilePicFile || null,
      inviteCode: String(prev.form.invitationCode || "").trim(),
      agree_terms: true,
      agree_privacy: true,
    };

    const res = await registerService(payload);
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
    console.error("[registerPage] submit failed:", error);
    patchErrors({ general: "Network error during registration." });
  } finally {
    patchState({ isSubmitting: false });
  }
}
