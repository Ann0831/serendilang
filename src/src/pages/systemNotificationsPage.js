import React from "react";
import { createRoot } from "react-dom/client";
import { getState, updateState } from "../utils/uiStateAdapter.js";
import { eventBus } from "../utils/eventBus.js";
import {
  getUnreadSystemUserNotificationsService,
  markSystemUserNotificationAsReadService,
} from "../service/SystemUserNotificationsService.js";
import SystemNotificationsPage from "../ui/pages/SystemNotificationsPage.jsx";

const STATE_ID = "SystemNotificationsPage";
const DEFAULT_STATE = {
  visible: false,
  loading: false,
  notification: null,
  text: {
    title: "System Notification",
    ok: "OK",
    fallbackMessage: "Welcome",
  },
};

let systemNotifyRoot = null;
let dismissBusy = false;
let eventsBound = false;

function readState() {
  return getState(STATE_ID) || DEFAULT_STATE;
}

function patchState(patch) {
  updateState(STATE_ID, {
    ...readState(),
    ...patch,
  });
}

function detectLocale() {
  if (typeof navigator === "undefined") return "en";
  return String(navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
}

function getSystemNotificationText() {
  const locale = detectLocale();
  if (locale === "zh") {
    return {
      title: "系統通知",
      ok: "確定",
      fallbackMessage: "歡迎",
    };
  }
  return {
    title: "System Notification",
    ok: "OK",
    fallbackMessage: "Welcome",
  };
}

function ensureMountNode() {
  if (typeof document === "undefined") return null;
  let host = document.getElementById("system_notifications");
  if (!host) {
    host = document.createElement("div");
    host.id = "system_notifications";
    document.body.appendChild(host);
  }
  return host;
}

function bindEventsOnce() {
  if (eventsBound) return;
  eventsBound = true;
  eventBus.on("dismissSystemNotification", async () => {
    await dismissSystemNotification();
  });
}

export function initSystemNotificationsPage() {
  const host = ensureMountNode();
  if (!host) return;
  if (!systemNotifyRoot) systemNotifyRoot = createRoot(host);
  patchState({
    ...DEFAULT_STATE,
    text: getSystemNotificationText(),
  });
  systemNotifyRoot.render(React.createElement(SystemNotificationsPage));
  bindEventsOnce();
}

export async function loadUnreadSystemNotification() {
  initSystemNotificationsPage();
  patchState({ loading: true });
  try {
    const result = await getUnreadSystemUserNotificationsService();
    if (result?.result !== "success" || !Array.isArray(result?.data) || result.data.length === 0) {
      patchState({ visible: false, notification: null, loading: false });
      return;
    }

    const first = result.data[0] || {};
    const text = getSystemNotificationText();
    const notification = {
      id: first?.id ?? null,
      title: String(first?.title || text.title),
      message: String(first?.message || text.fallbackMessage),
    };
    patchState({
      visible: true,
      loading: false,
      notification,
      text,
    });
  } catch (err) {
    console.error("[systemNotificationsPage] loadUnreadSystemNotification failed:", err);
    patchState({ visible: false, notification: null, loading: false });
  }
}

export async function dismissSystemNotification() {
  const s = readState();
  const id = s?.notification?.id;
  if (dismissBusy) return;
  dismissBusy = true;
  patchState({ visible: false });
  try {
    if (id !== null && id !== undefined && id !== "") {
      await markSystemUserNotificationAsReadService(id);
    }
    patchState({ notification: null });
  } finally {
    dismissBusy = false;
  }
}
