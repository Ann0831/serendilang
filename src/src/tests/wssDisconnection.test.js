import { eventBus } from "../utils/eventBus.js";
import { getState } from "../utils/uiStateAdapter.js";

const TEST_FLAG = "__WSS_DISCONNECTION_TEST_RAN__";
const ERROR_STATE_ID = "ErrorMessagesPage";
const DISCONNECTED_KEY = "wss-disconnected";
const RECONNECTED_KEY = "wss-reconnected";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getItems() {
  const state = getState(ERROR_STATE_ID);
  return Array.isArray(state?.items) ? state.items : [];
}

function findByKey(key) {
  return getItems().find((item) => item?.key === key);
}

export async function runWssDisconnectionTest() {
  if (typeof window === "undefined") return;
  if (window[TEST_FLAG]) return;
  window[TEST_FLAG] = true;

  try {
    eventBus.emit("wssDisconnected", { from: "test/wss-disconnection" });
    await wait(0);

    const disconnected = findByKey(DISCONNECTED_KEY);
    if (!disconnected) throw new Error("missing wss-disconnected message");
    if (disconnected.level !== "warn") throw new Error("wss-disconnected level should be warn");

    await wait(2000);

    eventBus.emit("wssConnected", { from: "test/wss-disconnection" });
    await wait(0);

    if (findByKey(DISCONNECTED_KEY)) throw new Error("wss-disconnected should be dismissed after reconnect");
    const reconnected = findByKey(RECONNECTED_KEY);
    if (!reconnected) throw new Error("missing wss-reconnected success message");
    if (reconnected.level !== "success") throw new Error("wss-reconnected level should be success");

    await wait(3200);
    if (findByKey(RECONNECTED_KEY)) throw new Error("wss-reconnected should auto-dismiss");

    console.log("[test] wss disconnection flow passed");
  } catch (err) {
    console.error("[test] wss disconnection flow failed:", err);
  }
}
