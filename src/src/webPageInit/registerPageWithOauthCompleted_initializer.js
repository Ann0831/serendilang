import "../css/index.css";
import { initializeEmitEvent } from "../event/eventEmitter.js";
import { initTopBar } from "../pages/topBar.js";
import { initErrorMessagesPage } from "../pages/errorMessagesPage.js";
import { initNotificationMessagesPage } from "../pages/notificationMessagesPage.js";
import { registerRegisterPageWithOauthCompletedEventHandlers } from "../event/registerPageWithOauthCompletedEventHandlers.js";
import { initRegisterPageWithOauthCompleted } from "../pages/registerPageWithOauthCompleted.js";
import { isTestEnv } from "../environment/env.js";
import { setTestLoginState } from "../api/post_api.client.js";

async function initializeRegisterOauthCompletedPage() {
  if (isTestEnv) {
    try {
      await setTestLoginState(false);
    } catch (err) {
      console.warn("[registerPageWithOauthCompleted_initializer] setTestLoginState(false) failed:", err);
    }
  }

  registerRegisterPageWithOauthCompletedEventHandlers();
  initializeEmitEvent();
  initTopBar();
  initErrorMessagesPage();
  initNotificationMessagesPage();
  await initRegisterPageWithOauthCompleted();
}

void initializeRegisterOauthCompletedPage();
