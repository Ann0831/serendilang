import { registerNULLHandler } from "./handlers/Null.js";
import { registerIdentityHandlers } from "./handlers/identity.js";
import { registerNetworkHandlers } from "./handlers/network.js";
import { registerErrorMessagesHandlers } from "./handlers/errorMessages.js";
import { registerNotificationMessagesHandlers } from "./handlers/notificationMessages.js";
import { eventBus } from "../utils/eventBus.js";
import {
  oauthResultRetry,
  oauthResultUseAnotherAccount,
  oauthResultGoRegister,
} from "../pages/oauthResultPage.js";

let __registered = false;

export function registerOauthResultPageEventHandlers() {
  if (__registered) {
    console.warn("[oauthResult] handlers already registered, skip.");
    return;
  }

  registerNULLHandler();
  registerNetworkHandlers();
  registerIdentityHandlers();
  registerErrorMessagesHandlers();
  registerNotificationMessagesHandlers();

  eventBus.on("oauthResultRetry", async () => {
    await oauthResultRetry();
  });

  eventBus.on("oauthResultUseAnotherAccount", async () => {
    await oauthResultUseAnotherAccount();
  });

  eventBus.on("oauthResultGoRegister", async () => {
    await oauthResultGoRegister();
  });

  __registered = true;
  console.log("✅ OAuth Result Page: event handlers registered.");
}

export default registerOauthResultPageEventHandlers;
