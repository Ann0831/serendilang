import { eventBus } from "/utils/eventBus.js";
import { markSystemUserNotificationAsReadService } from "/service/SystemUserNotificationsService.js";

/** 標記系統通知為已讀 */
export async function markSystemUserNotificationAsRead(notification_id) {
  console.log("[systemUserNotifications] markSystemUserNotificationAsRead:", { notification_id });

  if (!notification_id) {
    console.warn("[systemUserNotifications] ⚠️ 無效的 notification_id");
    return;
  }

  try {
    const result = await markSystemUserNotificationAsReadService(notification_id);

    if (result.result === "success") {
      console.log(`[systemUserNotifications] ✅ 已將通知 ${notification_id} 標記為已讀`);
      eventBus.emit("systemUserNotificationMarkedAsRead", { notification_id });
    } else {
      console.warn(`[systemUserNotifications] ⚠️ 標記失敗: ${result.reason || "unknown"}`);
    }
  } catch (err) {
    console.error("[systemUserNotifications] 💥 標記通知為已讀時發生錯誤:", err);
  }
}

/** 集中註冊：System User Notification 相關事件 */
export function registerSystemUserNotificationHandlers() {
  // 監聽標記已讀事件
  eventBus.on("markSystemUserNotificationAsRead", async (params) => {
    const { notification_id } = params || {};
    console.log("[event] markSystemUserNotificationAsRead:", params);
    await markSystemUserNotificationAsRead(notification_id);
  });

  console.log("✅ registerSystemUserNotificationHandlers: system-user-notification events registered.");
}

