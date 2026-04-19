import React from "react";
import { createRoot } from "react-dom/client";
import { getState, updateState } from "../utils/uiStateAdapter.js";
import NotificationMessagesPage from "../ui/pages/NotificationMessagesPage.jsx";

const NOTIFY_STATE_ID = "NotificationMessagesPage";
const DEFAULT_STATE = { items: [] };

let notifyRoot = null;
let nextId = 1;
const removeTimers = new Map();

function readState() {
  return getState(NOTIFY_STATE_ID) || DEFAULT_STATE;
}

function patchState(patch) {
  updateState(NOTIFY_STATE_ID, {
    ...readState(),
    ...patch,
  });
}

function ensureMountNode() {
  if (typeof document === "undefined") return null;
  let host = document.getElementById("notification_messages");
  if (!host) {
    host = document.createElement("div");
    host.id = "notification_messages";
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
  const timer = setTimeout(() => dismissNotification(id), timeoutMs);
  removeTimers.set(id, timer);
}

export function initNotificationMessagesPage() {
  const host = ensureMountNode();
  if (!host) return;
  if (!notifyRoot) notifyRoot = createRoot(host);
  notifyRoot.render(React.createElement(NotificationMessagesPage));
  if (!getState(NOTIFY_STATE_ID)) patchState(DEFAULT_STATE);
}

export function pushNotification({
  key = "",
  title = "",
  message = "",
  level = "info",
  sticky = false,
  timeoutMs = 2200,
} = {}) {
  initNotificationMessagesPage();
  const state = readState();
  const prevItems = Array.isArray(state?.items) ? state.items : [];
  const msg = typeof message === "string" ? message.trim() : String(message || "").trim();
  if (!msg) return;

  let itemId = `notify-${nextId++}`;
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
    title,
    message: msg,
    level,
    sticky: !!sticky,
    createdAt: Date.now(),
  };

  patchState({ items: [...nextItems, item] });
  if (!sticky) setRemoveTimer(itemId, timeoutMs);
}

export function dismissNotification(id) {
  if (!id) return;
  clearRemoveTimer(id);
  const state = readState();
  const items = Array.isArray(state?.items) ? state.items : [];
  patchState({ items: items.filter((x) => x?.id !== id) });
}

export function dismissNotificationsByKey(key) {
  if (!key) return;
  const state = readState();
  const items = Array.isArray(state?.items) ? state.items : [];
  for (const item of items) {
    if (item?.key === key && item?.id) clearRemoveTimer(item.id);
  }
  patchState({ items: items.filter((x) => x?.key !== key) });
}

