import { registerNULLHandler } from "./handlers/Null.js";
import { registerIdentityHandlers } from "./handlers/identity.js";
import { registerNetworkHandlers } from "./handlers/network.js";
import { registerErrorMessagesHandlers } from "./handlers/errorMessages.js";
import { registerNotificationMessagesHandlers } from "./handlers/notificationMessages.js";
import { eventBus } from "../utils/eventBus.js";
import {
  registerPageSetField,
  registerPageSetProfilePic,
  registerPagePrevStep,
  registerPageSkipToStep3,
  registerPageNextStep,
  registerPageSubmit,
} from "../pages/registerPage.js";

let __registerPageHandlersRegistered = false;

export function registerRegisterPageEventHandlers() {
  if (__registerPageHandlersRegistered) {
    console.warn("[registerpage] registerRegisterPageEventHandlers: already registered, skip.");
    return;
  }

  registerNULLHandler();
  registerNetworkHandlers();
  registerIdentityHandlers();
  registerErrorMessagesHandlers();
  registerNotificationMessagesHandlers();

  eventBus.on("registerPageFieldChanged", (params) => {
    const { field, value } = params || {};
    registerPageSetField(field, value);
  });

  eventBus.on("registerPageProfilePicChanged", (params) => {
    registerPageSetProfilePic(params?.file || null);
  });

  eventBus.on("registerPagePrevStep", () => {
    registerPagePrevStep();
  });

  eventBus.on("registerPageSkipToStep3", () => {
    registerPageSkipToStep3();
  });

  eventBus.on("registerPageNextStep", async () => {
    await registerPageNextStep();
  });

  eventBus.on("registerPageSubmit", async () => {
    await registerPageSubmit();
  });

  __registerPageHandlersRegistered = true;
  console.log("✅ Register Page: event handlers registered.");
}

export default registerRegisterPageEventHandlers;
