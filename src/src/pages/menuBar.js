import React from "react";
import { createRoot } from "react-dom/client";
import { getState, updateState } from "../utils/uiStateAdapter.js";
import MenuBar from "../ui/pages/MenuBar.jsx";
import { getCurrentUserIdentity_Global } from "../userSelfData/userSelfData.js";
import { fetchUserProfilePicUrl, fetchUsername } from "../service/getUserSelfBasicData.js";

const MENU_STATE_ID = "MenuBar";

const DEFAULT_STATE = {
  loading: false,
  username: "",
  profileUrl: `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
};

let menuRoot = null;

function readState() {
  return getState(MENU_STATE_ID) || DEFAULT_STATE;
}

function patchState(patch) {
  updateState(MENU_STATE_ID, {
    ...readState(),
    ...patch,
  });
}

function ensureMenuMountNode() {
  if (typeof document === "undefined") return null;
  let el = document.getElementById("menu-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "menu-root";
    document.body.appendChild(el);
  }
  return el;
}

function ensureMenuMounted() {
  const host = ensureMenuMountNode();
  if (!host) return;
  if (!menuRoot) menuRoot = createRoot(host);
  menuRoot.render(React.createElement(MenuBar));

  // React menu mount 之後通知外部同步 active 樣式
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("menuBar:mounted"));
    });
  });
}

export async function initMenuBar() {
  ensureMenuMounted();
  patchState({ loading: true });

  await refreshMenuBarIdentity();
}

export async function refreshMenuBarIdentity() {
  try {
    const [identitySettled, usernameSettled, profileSettled] = await Promise.allSettled([
      getCurrentUserIdentity_Global(),
      fetchUsername(),
      fetchUserProfilePicUrl(),
    ]);
    const identity = identitySettled.status === "fulfilled" ? identitySettled.value : null;
    const latestUsername = usernameSettled.status === "fulfilled" ? usernameSettled.value : "";
    const latestProfileUrl = profileSettled.status === "fulfilled" ? profileSettled.value : "";
    const username = latestUsername || identity?.username || identity?.user_name || "Unknown";
    const profileUrl = latestProfileUrl || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`;

    patchState({
      loading: false,
      username,
      profileUrl,
    });
  } catch (error) {
    console.error("[menuBar] initMenuBar failed:", error);
    patchState({
      loading: false,
      username: "Unknown",
      profileUrl: `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
    });
  }
}
