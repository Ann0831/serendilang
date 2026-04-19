const rawEnv = String(import.meta.env.VITE_APP_ENV || "production").toLowerCase();
const rawTestLoggedIn = String(import.meta.env.VITE_TEST_IS_LOGGED_IN ?? "true").toLowerCase();
const rawFakeApiThrowConfig = String(import.meta.env.VITE_FAKE_API_THROW_CONFIG ?? "").trim();

function parseBool(value, fallback = false) {
  if (value === "true" || value === "1" || value === "yes" || value === "y") return true;
  if (value === "false" || value === "0" || value === "no" || value === "n") return false;
  return fallback;
}

export const APP_ENV = rawEnv;
export const isTestEnv = rawEnv === "test";
export const isTestLoggedIn = parseBool(rawTestLoggedIn, true);
export const fakeApiThrowConfig = parseFakeApiThrowConfig(rawFakeApiThrowConfig);

export function getAppEnv() {
  return APP_ENV;
}

function parseFakeApiThrowConfig(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch (err) {
    console.warn("[env] invalid VITE_FAKE_API_THROW_CONFIG JSON:", err);
    return {};
  }
}
