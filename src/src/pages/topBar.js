import React from "react";
import { createRoot } from "react-dom/client";
import { getState, updateState } from "../utils/uiStateAdapter.js";
import TopBar from "../ui/pages/TopBar.jsx";
import { logout, logoutAll } from "../service/Logout.js";
import { testloginService } from "../service/loginService.js";
import { fetchUsername, fetchUserProfilePicUrl } from "../service/getUserSelfBasicData.js";
import { refreshUserData, getCurrentUserIdentity_Global } from "../userSelfData/userSelfData.js";

const TOPBAR_STATE_ID = "TopBar";

const DEFAULT_STATE = {
  menuOpen: false,
  loading: false,
  isLoggedIn: false,
  username: "",
  profileUrl: "",
};

let topBarRoot = null;
let docClickBound = false;

function readState() {
  return getState(TOPBAR_STATE_ID) || DEFAULT_STATE;
}

function patchState(patch) {
  updateState(TOPBAR_STATE_ID, {
    ...readState(),
    ...patch,
  });
}

function ensureTopBarMountNode() {
  if (typeof document === "undefined") return null;
  let el = document.getElementById("topBar-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "topBar-root";
    document.body.prepend(el);
  }
  return el;
}

function ensureTopBarMounted() {
  const host = ensureTopBarMountNode();
  if (!host) return;
  if (!topBarRoot) topBarRoot = createRoot(host);
  topBarRoot.render(React.createElement(TopBar));
}

function bindDocumentClickClose() {
  if (docClickBound || typeof document === "undefined") return;
  docClickBound = true;

  document.addEventListener("click", (event) => {
    const toggleBtn = document.getElementById("topBar-doc-menuToggle");
    const menu = document.getElementById("topBar-doc-menuLinks");
    if (!toggleBtn || !menu) return;

    const isInside = toggleBtn.contains(event.target) || menu.contains(event.target);
    if (!isInside) closeLogout();
  });
}

export async function initTopBar() {
  ensureTopBarMounted();
  bindDocumentClickClose();

  patchState({ loading: true, menuOpen: false });

  await refreshTopBarIdentity();
}

export async function refreshTopBarIdentity() {
  patchState({ loading: true });

  try {
    await refreshUserData();
    let identity = await getCurrentUserIdentity_Global();
    let isLoggedIn = !!identity?.user_id;

    if (!isLoggedIn) {
      const loginRes = await testloginService();
      isLoggedIn = loginRes?.loginstate === "login";
      if (isLoggedIn) {
        identity = loginRes?.identity || null;
      }
    }

    if (!isLoggedIn) {
      patchState({ loading: false, isLoggedIn: false, username: "", profileUrl: "" });
      return;
    }

    const [usernameSettled, profileSettled] = await Promise.allSettled([
      fetchUsername(),
      fetchUserProfilePicUrl(),
    ]);
    const username = usernameSettled.status === "fulfilled" ? usernameSettled.value : "";
    const profileUrl = profileSettled.status === "fulfilled" ? profileSettled.value : "";

    patchState({
      loading: false,
      isLoggedIn: true,
      username: username || identity?.username || "",
      profileUrl: profileUrl || "",
    });
  } catch (error) {
    console.error("[topBar] refreshTopBarIdentity failed:", error);
    patchState({ loading: false, isLoggedIn: false, username: "", profileUrl: "" });
  }
}

export function toggleLogout() {
  const prev = readState();
  patchState({ menuOpen: !prev.menuOpen });
}

export function closeLogout() {
  patchState({ menuOpen: false });
}

export async function executeLogout() {
  await logout();
  patchState({ isLoggedIn: false, username: "", profileUrl: "", menuOpen: false });
}

export async function executeLogoutAll() {
  await logoutAll();
  patchState({ isLoggedIn: false, username: "", profileUrl: "", menuOpen: false });
}
