import { getUnreadSystemUserNotificationsService,markSystemUserNotificationAsReadService } from "../service/SystemUserNotificationsService.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const result = await getUnreadSystemUserNotificationsService();

    if (result.result !== "success" || !Array.isArray(result.data) || result.data.length === 0) {
      console.log("[InitSystemNotifications] ✅ No unread notifications.");
      return;
    }

    // 只顯示最新一則（你可以改成多則輪播）
    const notification = result.data[0];
    showSystemNotificationPopup(notification);
  } catch (err) {
    console.error("[InitSystemNotifications] 💥 Error loading notifications:", err);
  }
});

/**
 * 顯示系統通知彈出框
 */
function showSystemNotificationPopup(notification) {
  // 建立遮罩與彈出框元素
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] backdrop-blur-sm";

  const popup = document.createElement("div");
  popup.className =
    "bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 relative text-gray-800";

  // 標題
  const title = document.createElement("h2");
  title.className = "text-xl font-semibold text-indigo-700 mb-2";
  title.textContent = notification.title || "System Notification";

  // 內容
  const message = document.createElement("p");
  message.className = "text-gray-600 mb-4 whitespace-pre-line";
  message.textContent = notification.message || "";

  // OK 按鈕
  const okBtn = document.createElement("button");
  okBtn.className =
    "bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg mr-2 transition";
  okBtn.textContent = "OK";

  // 叉叉關閉按鈕
  const closeBtn = document.createElement("button");
  closeBtn.className =
    "absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl";
  closeBtn.innerHTML = "&times;";

  // Footer（包含 OK）
  const footer = document.createElement("div");
  footer.className = "flex justify-end";
  footer.appendChild(okBtn);

  // 組合
  popup.appendChild(closeBtn);
  popup.appendChild(title);
  popup.appendChild(message);
  popup.appendChild(footer);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // 關閉邏輯
  async function handleClose() {
    overlay.remove();
    // 標記為已讀
    await markSystemUserNotificationAsReadService(notification.id);
  }

  okBtn.addEventListener("click", handleClose);
  closeBtn.addEventListener("click", handleClose);
}

