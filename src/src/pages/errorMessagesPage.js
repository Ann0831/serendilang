import React from "react";
import { createRoot } from "react-dom/client";
import { getState, updateState } from "../utils/uiStateAdapter.js";
import ErrorMessagesPage from "../ui/pages/ErrorMessagesPage.jsx";

const ERROR_STATE_ID = "ErrorMessagesPage";
const DEFAULT_STATE = { items: [] };

let errorRoot = null;
let nextId = 1;
const removeTimers = new Map();

function readState() {
  return getState(ERROR_STATE_ID) || DEFAULT_STATE;
}

function patchState(patch) {
  updateState(ERROR_STATE_ID, {
    ...readState(),
    ...patch,
  });
}

function ensureMountNode() {
  if (typeof document === "undefined") return null;
  let host = document.getElementById("error_messages");
  if (!host) {
    host = document.createElement("div");
    host.id = "error_messages";
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
  const timer = setTimeout(() => {
    dismissErrorMessage(id);
  }, timeoutMs);
  removeTimers.set(id, timer);
}

export function initErrorMessagesPage() {
  const host = ensureMountNode();
  if (!host) return;
  if (!errorRoot) errorRoot = createRoot(host);
  errorRoot.render(React.createElement(ErrorMessagesPage));
  if (!getState(ERROR_STATE_ID)) {
    patchState(DEFAULT_STATE);
  }
}

export function pushErrorMessage({
  key = "",
  title = "Error",
  message = "Unexpected error",
  iconClass = "",
  level = "error",
  sticky = false,
  timeoutMs = 5000,
} = {}) {
  initErrorMessagesPage();
  const state = readState();
  const prevItems = Array.isArray(state?.items) ? state.items : [];
  const msg = typeof message === "string" ? message.trim() : String(message || "").trim();
  if (!msg) return;

  let itemId = `err-${nextId++}`;
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
    key: key || "",
    title: title || "Error",
    message: msg,
    iconClass: typeof iconClass === "string" ? iconClass.trim() : "",
    level,
    sticky: !!sticky,
    createdAt: Date.now(),
  };

  patchState({ items: [...nextItems, item] });
  if (!sticky) setRemoveTimer(itemId, timeoutMs);
}

export function dismissErrorMessage(id) {
  if (!id) return;
  clearRemoveTimer(id);
  const state = readState();
  const items = Array.isArray(state?.items) ? state.items : [];
  patchState({ items: items.filter((x) => x?.id !== id) });
}

export function dismissErrorMessagesByKey(key) {
  if (!key) return;
  const state = readState();
  const items = Array.isArray(state?.items) ? state.items : [];
  for (const item of items) {
    if (item?.key === key && item?.id) clearRemoveTimer(item.id);
  }
  patchState({ items: items.filter((x) => x?.key !== key) });
}
