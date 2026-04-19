import { eventBus } from "../../utils/eventBus.js";
import {
  dismissFrontendNotification,
  dismissFrontendNotificationsByKey,
  pushFrontendNotification,
} from "../../pages/frontendNotificationPage.js";

export function registerFrontendNotificationHandlers() {
  eventBus.on("pushFrontendNotification", (params) => {
    pushFrontendNotification(params || {});
  });
  eventBus.on("dismissFrontendNotification", (params) => {
    dismissFrontendNotification(params?.id);
  });
  eventBus.on("dismissFrontendNotificationsByKey", (params) => {
    dismissFrontendNotificationsByKey(params?.key || "");
  });
}

