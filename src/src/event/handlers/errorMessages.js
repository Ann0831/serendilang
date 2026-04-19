import { eventBus } from "../../utils/eventBus.js";
import { dismissErrorMessage } from "../../pages/errorMessagesPage.js";

export function registerErrorMessagesHandlers() {
  eventBus.on("dismissErrorMessage", (params) => {
    dismissErrorMessage(params?.id);
  });
}

