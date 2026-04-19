import { fakeApiThrowConfig, isTestEnv } from "../environment/env.js";

const throwCounter = new Map();

function toFiniteNonNegativeInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function normalizeRule(rule) {
  if (typeof rule === "string") {
    return { type: "Error", message: rule };
  }
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return null;
  }
  return rule;
}

function resolveRule(apiName) {
  const direct = normalizeRule(fakeApiThrowConfig[apiName]);
  if (direct) return direct;
  return normalizeRule(fakeApiThrowConfig["*"]);
}

function shouldThrow(apiName, rule) {
  if (rule.enabled === false) return false;
  const times = toFiniteNonNegativeInt(rule.times, Number.POSITIVE_INFINITY);
  const count = throwCounter.get(apiName) || 0;
  if (count >= times) return false;
  throwCounter.set(apiName, count + 1);
  return true;
}

function buildError(apiName, rule) {
  const type = String(rule.type || "Error").toLowerCase();
  const message = String(rule.message || `[fake-api-throw] ${apiName}`);
  const data = rule.data && typeof rule.data === "object" ? rule.data : {};
  const networkState = normalizeNetworkState(rule.networkState || rule.state);

  if (type === "typeerror") {
    const error = new TypeError(message);
    if (networkState) error.networkState = networkState;
    return error;
  }

  if (type === "aborterror") {
    const error = new Error(message);
    error.name = "AbortError";
    if (networkState) error.networkState = networkState;
    return error;
  }

  if (type === "httperror") {
    return {
      status: "error",
      code: toFiniteNonNegativeInt(rule.code, 500),
      message,
      data,
      networkState,
    };
  }

  if (type === "objecterror") {
    return {
      status: rule.status || "error",
      code: Number.isFinite(Number(rule.code)) ? Number(rule.code) : undefined,
      message,
      data,
      networkState,
    };
  }

  const error = new Error(message);
  if (networkState) error.networkState = networkState;
  return error;
}

function normalizeNetworkState(value) {
  const state = String(value || "").trim().toUpperCase();
  if (state === "USER_OFFLINE" || state === "SERVER_UNREACHABLE") return state;
  return "";
}

export function maybeThrowMockApiError(apiName) {
  if (!isTestEnv) return;
  const rule = resolveRule(apiName);
  if (!rule) return;
  if (!shouldThrow(apiName, rule)) return;
  throw buildError(apiName, rule);
}
