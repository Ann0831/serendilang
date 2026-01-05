import { loginService } from "/service/loginService.js";
import { hashPassword } from "/utils/hashPassword.js"; 

document.getElementById("myForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const username = formData.get("username");
  const password = formData.get("password");

  try {
    const hash = hashPassword(password); 
    const response = await loginService(username, hash);
    console.log("login:", response);

    if (response.loginstate === "success") {
      window.location.href = "/";
    } else {
      // 🔍 若為 403 封鎖狀態，顯示通知
      const code = response?.data?.code || response?.code;
      if (code === 403) {
        const message =
          response?.data?.message ||
          "Your account has been suspended due to policy violations.";
        showBanNotification(message);
      } else {
        alert("Login failed. Please check your username or password.");
      }
    }
  } catch (err) {
    console.error("login error:", err);
    alert("Network error, please try again later.");
  }
});

/**
 * 顯示封鎖通知
 * @param {string} message - 要顯示的錯誤訊息
 */
function showBanNotification(message) {
  // 🔹 避免重複建立
  const existing = document.getElementById("ban-notification-overlay");
  if (existing) existing.remove();

  // 🔸 外層遮罩
  const overlay = document.createElement("div");
  overlay.id = "ban-notification-overlay";
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

  // 🔸 彈窗內容
  const modal = document.createElement("div");
  modal.className =
    "bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md text-center flex flex-col items-center space-y-4";

  const icon = document.createElement("div");
  icon.innerHTML = `<i class="ti ti-alert-triangle text-red-500 text-5xl"></i>`;

  const msgEl = document.createElement("p");
  msgEl.className = "text-gray-800 text-lg font-medium";
  msgEl.textContent = message;

  // 🔹 按鈕區
  const btnGroup = document.createElement("div");
  btnGroup.className = "flex justify-center gap-4 pt-3";

  const okBtn = document.createElement("button");
  okBtn.className =
    "px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium";
  okBtn.textContent = "OK";
  okBtn.onclick = () => overlay.remove();

  const contactBtn = document.createElement("button");
  contactBtn.className =
    "px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium";
  contactBtn.textContent = "Contact";
  contactBtn.onclick = () => {
    window.location.href = "/contact";
  };

  btnGroup.append(okBtn, contactBtn);
  modal.append(icon, msgEl, btnGroup);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

