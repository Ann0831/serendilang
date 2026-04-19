import { registerNULLHandler } from "./handlers/Null.js";
import { registerIdentityHandlers } from "./handlers/identity.js";
import { registerNetworkHandlers } from "./handlers/network.js";
import { registerErrorMessagesHandlers } from "./handlers/errorMessages.js";
import { registerNotificationMessagesHandlers } from "./handlers/notificationMessages.js";
import { eventBus } from "../utils/eventBus.js";
import {
  registerOauthCompletedSetField,
  registerOauthCompletedSetProfilePic,
  registerOauthCompletedPrevStep,
  registerOauthCompletedSkipAvatarStep,
  registerOauthCompletedNextStep,
  registerOauthCompletedSubmit,
  registerOauthCompletedSwitchAccount,
} from "../pages/registerPageWithOauthCompleted.js";

let __registered = false;

export function registerRegisterPageWithOauthCompletedEventHandlers() {
  if (__registered) {
    console.warn("[registerOauthCompleted] handlers already registered, skip.");
    return;
  }

  registerNULLHandler();
  registerNetworkHandlers();
  registerIdentityHandlers();
  registerErrorMessagesHandlers();
  registerNotificationMessagesHandlers();

  eventBus.on("registerOauthCompletedFieldChanged", (params) => {
    const { field, value } = params || {};
    registerOauthCompletedSetField(field, value);
  });

  eventBus.on("registerOauthCompletedProfilePicChanged", (params) => {
    registerOauthCompletedSetProfilePic(params?.file || null);
  });

  eventBus.on("registerOauthCompletedPrevStep", () => {
    registerOauthCompletedPrevStep();
  });

  eventBus.on("registerOauthCompletedSkipAvatarStep", () => {
    registerOauthCompletedSkipAvatarStep();
  });

  eventBus.on("registerOauthCompletedNextStep", async () => {
    await registerOauthCompletedNextStep();
  });

  eventBus.on("registerOauthCompletedSubmit", async () => {
    await registerOauthCompletedSubmit();
  });

  eventBus.on("registerOauthCompletedSwitchAccount", async () => {
    await registerOauthCompletedSwitchAccount();
  });

  __registered = true;
  console.log("✅ Register OAuth Completed Page: event handlers registered.");
}

export default registerRegisterPageWithOauthCompletedEventHandlers;
