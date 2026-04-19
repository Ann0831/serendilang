import React from "react";
import { createRoot } from "react-dom/client";
import { getState, updateState } from "../utils/uiStateAdapter.js";
import FrontendNotificationPage from "../ui/pages/FrontendNotificationPage.jsx";

const FRONTEND_NOTIFY_STATE_ID = "FrontendNotificationPage";
const DEFAULT_STATE = { items: [] };

let frontendNotifyRoot = null;
let nextId = 1;
const removeTimers = new Map();

function readState() {
  return getState(FRONTEND_NOTIFY_STATE_ID) || DEFAULT_STATE;
}

function patchState(patch) {
  updateState(FRONTEND_NOTIFY_STATE_ID, {
    ...readState(),
    ...patch,
  });
}

function ensureMountNode() {
  if (typeof document === "undefined") return null;
  let host = document.getElementById("frontend_notification");
  if (!host) {
    host = document.createElement("div");
    host.id = "frontend_notification";
    document.body.appendChild(host);
  }
  return host;
}

function clearRemoveTimer(id) {
  const timer = removeTimers.get(id);
  if (!timer) return;
  clearTimeout(timer);
  removeTimers.delete(id);
}

function setRemoveTimer(id, timeoutMs) {
  clearRemoveTimer(id);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return;
  const timer = setTimeout(() => dismissFrontendNotification(id), timeoutMs);
  removeTimers.set(id, timer);
}

export function initFrontendNotificationPage() {
  const host = ensureMountNode();
  if (!host) return;
  if (!frontendNotifyRoot) frontendNotifyRoot = createRoot(host);
  frontendNotifyRoot.render(React.createElement(FrontendNotificationPage));
  if (!getState(FRONTEND_NOTIFY_STATE_ID)) patchState(DEFAULT_STATE);
}

export function pushFrontendNotification({
  key = "",
  title = "",
  message = "",
  level = "warn",
  sticky = true,
  timeoutMs = 0,
  okText = "OK",
} = {}) {
  initFrontendNotificationPage();
  const state = readState();
  const prevItems = Array.isArray(state?.items) ? state.items : [];
  const msg = typeof message === "string" ? message.trim() : String(message || "").trim();
  if (!msg) return;

  let itemId = `frontend-notify-${nextId++}`;
  let nextItems = prevItems;
  if (key) {
    const existing = prevItems.find((x) => x?.key === key);
    if (existing?.id) {
      itemId = existing.id;
      nextItems = prevItems.filter((x) => x?.id !== existing.id);
    }
  }

  const item = {
    id: itemId,
    key,
    title: String(title || "").trim(),
    message: msg,
    level: String(level || "warn"),
    sticky: !!sticky,
    okText: String(okText || "OK").trim() || "OK",
    createdAt: Date.now(),
  };

  patchState({ items: [...nextItems, item] });
  if (!sticky) setRemoveTimer(itemId, timeoutMs);
}

export function dismissFrontendNotification(id) {
  if (!id) return;
  clearRemoveTimer(id);
  const state = readState();
  const items = Array.isArray(state?.items) ? state.items : [];
  patchState({ items: items.filter((x) => x?.id !== id) });
}

export function dismissFrontendNotificationsByKey(key) {
  if (!key) return;
  const state = readState();
  const items = Array.isArray(state?.items) ? state.items : [];
  for (const item of items) {
    if (item?.key === key && item?.id) clearRemoveTimer(item.id);
  }
  patchState({ items: items.filter((x) => x?.key !== key) });
}

