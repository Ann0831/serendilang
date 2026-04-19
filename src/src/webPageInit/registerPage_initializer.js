import "../css/index.css";
import { initializeEmitEvent } from "../event/eventEmitter.js";
import { initTopBar } from "../pages/topBar.js";
import { initErrorMessagesPage } from "../pages/errorMessagesPage.js";
import { initNotificationMessagesPage } from "../pages/notificationMessagesPage.js";
import { initRegisterPage } from "../pages/registerPage.js";
import { registerRegisterPageEventHandlers } from "../event/registerPageEventHandlers.js";
import { isTestEnv } from "../environment/env.js";
import { setTestLoginState } from "../api/post_api.client.js";

async function initializeRegister() {
  if (isTestEnv) {
    try {
      await setTestLoginState(false);
    } catch (err) {
      console.warn("[registerPage_initializer] setTestLoginState(false) failed:", err);
    }
  }

  registerRegisterPageEventHandlers();
  initializeEmitEvent();
  initTopBar();
  initErrorMessagesPage();
  initNotificationMessagesPage();
  initRegisterPage();
}

void initializeRegister();
