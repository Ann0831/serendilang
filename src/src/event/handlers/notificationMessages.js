import { eventBus } from "../../utils/eventBus.js";
import { dismissNotification, dismissNotificationsByKey, pushNotification } from "../../pages/notificationMessagesPage.js";

export function registerNotificationMessagesHandlers() {
  eventBus.on("pushNotification", (params) => {
    pushNotification(params || {});
  });
  eventBus.on("dismissNotification", (params) => {
    dismissNotification(params?.id);
  });
  eventBus.on("dismissNotificationsByKey", (params) => {
    dismissNotificationsByKey(params?.key || "");
  });
}

