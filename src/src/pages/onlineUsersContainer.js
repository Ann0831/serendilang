import React from "react";
import { createRoot } from "react-dom/client";
import { fetchOnlineUserData } from "../service/fetchOnlineUserData.js";
import { calcOnlineUserScore } from "../utils/calcOnlineUserScore.js";
import {
  getCurrentUserLanguage_Global,
  getCurrentUserIdentity_Global,
  getCurrentUserBlockList_Global,
} from "../userSelfData/userSelfData.js";
import { fetchRealtimeOnlineList } from "../service/realTimeService.js";
import { recordFirstOnlineList } from "../service/analyticsService.js";
import { updateState } from "../utils/uiStateAdapter.js";
import { getOnlineUsersFromPool, setOnlineUsersToPool } from "../dataPool/onlineUsersPool.js";
import OnlineUsersSidebar from "../ui/pages/OnlineUsersSidebar.jsx";

let loading = false;
let initialized = false;
let hasRecordedFirstSidebarList = false;
let hasRecordedFirstPageList = false;
let sidebarRoot = null;
let onlineUsersPollTimer = null;
let visibilityWatcherBound = false;
const ONLINE_USERS_POLL_INTERVAL_MS = 30_000;

function ensureMountNode(id) {
  if (typeof document === "undefined") return null;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
  }
  return el;
}

function getNode(id) {
  if (typeof document === "undefined") return null;
  return document.getElementById(id);
}

function isElementVisible(el) {
  if (!el) return false;
  if (el.classList?.contains("hidden")) return false;
  if (el.style?.display === "none") return false;
  return true;
}

function shouldPollOnlineUsers() {
  if (typeof document !== "undefined" && document.hidden) return false;
  const sidebar = getNode("onlineUsersContainer");
  const fullscreen = getNode("OnlineUsersPage");
  return isElementVisible(sidebar) || isElementVisible(fullscreen);
}

function stopOnlineUsersPolling() {
  if (!onlineUsersPollTimer) return;
  clearInterval(onlineUsersPollTimer);
  onlineUsersPollTimer = null;
}

function startOnlineUsersPolling() {
  if (onlineUsersPollTimer) return;
  onlineUsersPollTimer = setInterval(() => {
    if (!shouldPollOnlineUsers()) {
      stopOnlineUsersPolling();
      return;
    }
    refreshOnlineUsers();
  }, ONLINE_USERS_POLL_INTERVAL_MS);
}

function syncOnlineUsersPollingState() {
  if (shouldPollOnlineUsers()) {
    startOnlineUsersPolling();
    return;
  }
  stopOnlineUsersPolling();
}

function ensureOnlineUsersVisibilityWatcher() {
  if (visibilityWatcherBound || typeof document === "undefined") return;
  visibilityWatcherBound = true;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopOnlineUsersPolling();
      return;
    }

    // Returning to this page: refresh immediately, then continue 30s polling if visible.
    if (shouldPollOnlineUsers()) {
      refreshOnlineUsers();
      startOnlineUsersPolling();
    }
  });
}

function ensureSidebarUiMounted() {
  const host = ensureMountNode("onlineUsersContainer");
  if (!host) return;
  host.className = "hidden lg:flex flex-col w-72 fixed right-0 top-16 bottom-0 overflow-hidden bg-gray-100 z-40";
  if (!sidebarRoot) sidebarRoot = createRoot(host);
  sidebarRoot.render(React.createElement(OnlineUsersSidebar));
}

function pushOnlineUsersState(next) {
  const ids = (Array.isArray(next) ? next : [])
    .map((u) => String(u?.userId || ""))
    .filter(Boolean);

  updateState("OnlineUsersIndex", {
    ids,
    total: ids.length,
    updatedAt: Date.now(),
  });

  updateState("OnlineUsersSidebar", {
    loading,
    initialized,
    list: next,
    total: next.length,
    updatedAt: Date.now(),
  });

  updateState("OnlineUsersFullscreen", {
    loading,
    initialized,
    list: next,
    total: next.length,
    updatedAt: Date.now(),
  });
}

function normalizeOnlineUserRow(row) {
  if (!row) return null;
  if (typeof row === "string") {
    return { user_id: row };
  }
  if (typeof row !== "object") return null;

  const userId = row.user_id || row.userId || row.id || row.target_id || null;
  if (!userId) return null;

  return {
    user_id: userId,
    username: row.username || row.user_name || null,
    language: row.language && typeof row.language === "object" ? row.language : null,
  };
}

function dedupeOnlineRowsByUserId(rows = []) {
  const seen = new Set();
  const result = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const id = String(row?.user_id || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(row);
  }
  return result;
}

async function buildOnlineUsersList() {
  const [rawListSettled, meSettled, blockSettled, myLangSettled] = await Promise.allSettled([
    fetchRealtimeOnlineList(),
    getCurrentUserIdentity_Global(),
    getCurrentUserBlockList_Global(),
    getCurrentUserLanguage_Global(),
  ]);
  const rawList = rawListSettled.status === "fulfilled" ? rawListSettled.value : [];
  const me = meSettled.status === "fulfilled" ? meSettled.value : null;
  const blockList = blockSettled.status === "fulfilled" ? blockSettled.value : [];
  const myLanguage = myLangSettled.status === "fulfilled" ? myLangSettled.value : {};

  const selfId = me?.user_id || null;
  const blocked = new Set(Array.isArray(blockList) ? blockList : []);
  const normalizedRawList = dedupeOnlineRowsByUserId((Array.isArray(rawList) ? rawList : [])
    .map(normalizeOnlineUserRow)
    .filter(Boolean));
  const baseList = normalizedRawList.filter((u) => {
    const id = u?.user_id;
    if (!id) return false;
    if (selfId && id === selfId) return false;
    if (blocked.has(id)) return false;
    return true;
  });

  const detailList = await Promise.all(
    baseList.map(async (u) => {
      const userId = u.user_id;
      const detail = await fetchOnlineUserData(userId);
      console.log("online user datadetail: ",detail)
      const nativelanguage = detail?.nativelanguage || u?.language?.nativelanguage || null;
      const targetlanguage = detail?.targetlanguage || u?.language?.targetlanguage || null;
      return {
        userId,
        username: u?.username || detail?.username || userId,
        nativelanguage,
        targetlanguage,
        profilePicture: detail?.profilePicture || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      };
    })
  );

  const detailMap = Object.fromEntries(
    detailList.map((x) => [
      x.userId,
      {
        nativelanguage: x.nativelanguage,
        targetlanguage: x.targetlanguage,
      },
    ])
  );

  const myNative = myLanguage?.nativelanguage || null;
  const myTarget = myLanguage?.targetlanguage || null;

  return detailList
    .map((u) => ({
      ...u,
      score: calcOnlineUserScore({ user_id: u.userId }, detailMap, myNative, myTarget),
    }))
    .sort((a, b) => b.score - a.score);
}

async function refreshOnlineUsers(options = {}) {
  if (loading) return [];

  loading = true;
  pushOnlineUsersState([]);

  try {
    const list = await buildOnlineUsersList();
    setOnlineUsersToPool(list);
    pushOnlineUsersState(list);

    if (options.trackFirstSidebar && !hasRecordedFirstSidebarList) {
      hasRecordedFirstSidebarList = true;
      await recordFirstOnlineList(list, "sidebar");
    }

    if (options.trackFirstPage && !hasRecordedFirstPageList) {
      hasRecordedFirstPageList = true;
      await recordFirstOnlineList(list, "page");
    }

    return list;
  } catch (error) {
    console.error("[onlineUsers] refresh failed:", error);
    const fallback = getOnlineUsersFromPool();
    pushOnlineUsersState(fallback);
    return fallback;
  } finally {
    loading = false;
    initialized = true;
    pushOnlineUsersState(getOnlineUsersFromPool());
  }
}

export async function initSidebarOnlineUsers() {
  ensureOnlineUsersVisibilityWatcher();
  ensureSidebarUiMounted();
  const pooled = getOnlineUsersFromPool();
  if (pooled.length > 0) {
    initialized = true;
    pushOnlineUsersState(pooled);
  }
  syncOnlineUsersPollingState();
  return refreshOnlineUsers({ trackFirstSidebar: true });
}

export async function showOnlineUsersSidebar() {
  ensureOnlineUsersVisibilityWatcher();
  const sidebar = ensureMountNode("onlineUsersContainer");
  if (sidebar) sidebar.classList.remove("hidden");
  syncOnlineUsersPollingState();
  return initSidebarOnlineUsers();
}

export function hideOnlineUsersSidebar() {
  const sidebar = getNode("onlineUsersContainer");
  if (sidebar) sidebar.classList.add("hidden");
  syncOnlineUsersPollingState();
}

export async function scheduleWriteAndSyncOnlineUsers() {
  return refreshOnlineUsers();
}

export async function showOnlineUsersFullscreen() {
  ensureOnlineUsersVisibilityWatcher();
  const page = ensureMountNode("OnlineUsersPage");
  if (page) page.style.display = "block";
  syncOnlineUsersPollingState();
  return refreshOnlineUsers({ trackFirstPage: true });
}

export function hideOnlineUsersFullscreen() {
  const page = getNode("OnlineUsersPage");
  if (page) page.style.display = "none";
  syncOnlineUsersPollingState();
}

export async function sortOnlineUsersByLanguage() {
  return refreshOnlineUsers();
}
