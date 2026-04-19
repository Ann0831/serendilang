import "../css/index.css";
import {
  loadUnreadSystemNotification,
} from "../pages/systemNotificationsPage.js";

async function bootstrapSystemNotifications() {
  await loadUnreadSystemNotification();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void bootstrapSystemNotifications();
  }, { once: true });
} else {
  void bootstrapSystemNotifications();
}
