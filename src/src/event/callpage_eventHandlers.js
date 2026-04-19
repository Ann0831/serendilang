import { registerNULLHandler } from "./handlers/Null.js";
import { registerNetworkHandlers } from "./handlers/network.js";
import { registerErrorMessagesHandlers } from "./handlers/errorMessages.js";
import { registerNotificationMessagesHandlers } from "./handlers/notificationMessages.js";
import { registerCallPageChatHandlers } from "./handlers/callPageChat.js";
import { registerRealtimeSoundHandlers } from "./handlers/realtimeSound.js";

let __callPageHandlersRegistered = false;

// Call page intentionally excludes registerCallHandlers(), so it does not
// register incoming-call events while user is already on the call runtime page.
export function registerCallPageEventHandlers() {
  if (__callPageHandlersRegistered) {
    return;
  }

  registerNULLHandler();
  registerNetworkHandlers();
  registerErrorMessagesHandlers();
  registerNotificationMessagesHandlers();
  registerCallPageChatHandlers();
  registerRealtimeSoundHandlers();

  __callPageHandlersRegistered = true;
}

export default registerCallPageEventHandlers;
