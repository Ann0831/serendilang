import { getUnreadSystemUserNotifications } from "../api/api.client.js";
import { markSystemUserNotificationAsRead } from "../api/post_api.client.js";
import { handleServiceNetworkError } from "./networkErrorHandler.js";

export async function getUnreadSystemUserNotificationsService() {
  try {
    const res = await getUnreadSystemUserNotifications();

    // 確保回傳是物件，且包含狀態
    if (res && typeof res === "object" && res.status === "success") {
      console.log("[Service:getUnreadSystemUserNotificationsService] ✅ 成功取得未讀通知:", res.data);
      return { result: "success", data: res.data || [] };
    } else {
      console.warn("[Service:getUnreadSystemUserNotificationsService] ⚠️ 回傳格式不符:", res);
      return { result: "fail", reason: res?.message || "Invalid response" };
    }
  } catch (error) {
    handleServiceNetworkError(error, "SystemUserNotificationsService.js");
    console.error("[Service:getUnreadSystemUserNotificationsService] 💥 發生錯誤:", error);
    return { result: "fail", reason: error.message || "Network or server error" };
  }
}


export async function markSystemUserNotificationAsReadService(notification_id) {
  try {
    const res = await markSystemUserNotificationAsRead(notification_id);

    if (res && typeof res === "object" && res.status === "success") {
      console.log(`[Service:markSystemUserNotificationAsReadService] ✅ 已標記通知 ${notification_id} 為已讀`);
      return { result: "success" };
    } else {
      console.warn(`[Service:markSystemUserNotificationAsReadService] ⚠️ 標記失敗:`, res);
      return { result: "fail", reason: res?.message || "Invalid response" };
    }
  } catch (error) {
    handleServiceNetworkError(error, "SystemUserNotificationsService.js");
    console.error("[Service:markSystemUserNotificationAsReadService] 💥 發生錯誤:", error);
    return { result: "fail", reason: error.message || "Network error" };
  }
}
