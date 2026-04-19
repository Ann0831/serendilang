import { eventBus } from "../utils/eventBus.js";

export function handleServiceNetworkError(error, context = "unknown") {
  const networkState = detectNetworkState(error);
  if (!networkState) return;
  eventBus.emit("networkDisconnected", {
    state: networkState,
    from: context,
    message: readErrorMessage(error),
  });
}

function detectNetworkState(error) {
  const forcedState = normalizeNetworkState(error?.networkState || error?.state);
  if (forcedState) {
    return forcedState;
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "USER_OFFLINE";
  }

  if (!error) return null;

  if (error instanceof TypeError) {
    return "SERVER_UNREACHABLE";
  }

  const name = String(error?.name || "").toLowerCase();
  if (name === "aborterror") {
    return "SERVER_UNREACHABLE";
  }

  const code = Number(error?.code);
  if (Number.isFinite(code) && [0, 408, 502, 503, 504, 522, 523, 524].includes(code)) {
    return "SERVER_UNREACHABLE";
  }

  const message = readErrorMessage(error).toLowerCase();
  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed")
  ) {
    return "SERVER_UNREACHABLE";
  }

  return null;
}

function normalizeNetworkState(value) {
  const state = String(value || "").trim().toUpperCase();
  if (state === "USER_OFFLINE" || state === "SERVER_UNREACHABLE") return state;
  return "";
}

function readErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error?.message === "string") return error.message;
  return "";
}
