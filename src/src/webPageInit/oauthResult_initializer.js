import "../css/index.css";
import { initializeEmitEvent } from "../event/eventEmitter.js";
import { registerOauthResultPageEventHandlers } from "../event/oauthResultPageEventHandlers.js";
import { initErrorMessagesPage } from "../pages/errorMessagesPage.js";
import { initNotificationMessagesPage } from "../pages/notificationMessagesPage.js";
import { initOauthResultPage } from "../pages/oauthResultPage.js";

async function initializeOauthResultPage() {
  registerOauthResultPageEventHandlers();
  initializeEmitEvent();
  initErrorMessagesPage();
  initNotificationMessagesPage();
  await initOauthResultPage();
}

void initializeOauthResultPage();
