import "../css/index.css";
import {isWssReady} from "../wss/wssCenter.js";
import {eventBus} from "../utils/eventBus.js";
import {initNavigator} from "../route/navigator.js";
import {registerEventHandlers} from "../event/eventHandlers.js";
import {initializeEmitEvent} from "../event/eventEmitter.js";
import { showOnlineUsersSidebar } from "../pages/onlineUsersContainer.js";
import { initLoginModalLayer } from "../pages/loginModalLayer.js";
import { initErrorMessagesPage } from "../pages/errorMessagesPage.js";
import { initNotificationMessagesPage } from "../pages/notificationMessagesPage.js";
import { initFrontendNotificationPage } from "../pages/frontendNotificationPage.js";

function detectLocale() {
  if (typeof navigator === "undefined") return "en";
  return String(navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
}

function isMobileScreenSize() {
  if (typeof window === "undefined") return false;
  const smallViewport = window.matchMedia?.("(max-width: 768px)")?.matches === true;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches === true;
  return smallViewport || coarsePointer;
}

function maybeShowMobileDesktopHint() {
  if (typeof window === "undefined") return;
  if (!isMobileScreenSize()) return;

  const locale = detectLocale();
  const title = locale === "zh" ? "提醒" : "Notice";
  const message = locale === "zh"
    ? "建議使用電腦瀏覽器，體驗會更好。\nMobile App 目前暫時尚未推出。"
    : "Using a desktop browser is recommended for a better experience.\nThe mobile app is not available yet.";

  eventBus.emit("pushFrontendNotification", {
    key: "login-root-mobile-desktop-hint",
    title,
    message,
    level: "warn",
    sticky: true,
    okText: "OK",
  });
}

initNavigator();
registerEventHandlers();
initializeEmitEvent();
initLoginModalLayer();
initErrorMessagesPage();
initNotificationMessagesPage();
initFrontendNotificationPage();
showOnlineUsersSidebar().catch((err) => {
  console.warn("[login_rootpage_initializer] showOnlineUsersSidebar failed:", err);
});
maybeShowMobileDesktopHint();

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    console.log("📄 頁面回到可見狀態，嘗試重連");
    if (!isWssReady()) {
      eventBus.emit("wssDisconnected", {});
    }
  }
});
