import { getGoogleOauthStatusService, clearGoogleOauthCookieService } from "/service/OAuth.js";

/**
 * 初始化「使用 Google Oauth 註冊」頁面
 * - 顯示目前登入的 Google 身份
 * - 綁定「Use another account」按鈕
 */
initRegisterWithGoogleOauthPage()


export async function initRegisterWithGoogleOauthPage() {
  const container = document.getElementById("OauthIdentity");
  if (!container) return;

  const avatarEl = document.getElementById("OauthIdentity-avatar");
  const emailEl = document.getElementById("OauthIdentity-email");
  const textEl = document.getElementById("OauthIdentity-text");
  const switchBtns = document.querySelectorAll('[data-type="switchAccountBtn"]');

  try {
    const res = await getGoogleOauthStatusService();

    if (!res) {
      console.warn("⚠️ Google OAuth cookie 不存在或已過期，重新導向登入頁");
      return;
    }

    const { email, picture } = res;  // 你目前 scope=openid email，picture 會是 undefined
    console.log("✅ Google OAuth 狀態確認成功:", res);

    // 🔹 顯示 email（一定要有）
    if (emailEl && email) {
      emailEl.textContent = email;
      emailEl.title = email;
      emailEl.classList.remove("hidden");
    }

    // 🔹 顯示描述文字（若有）
    if (textEl) {
      textEl.classList.remove("hidden");
    }

    // 🔹 顯示頭像（可選）
    if (avatarEl&&picture) {
      if (picture) {
        avatarEl.src = picture;
      } else {
        // 未来可擴充（如果未來 scope 加 profile picture）
        avatarEl.src = "/images/default-avatar.png";
      }
      avatarEl.classList.remove("hidden");
    }

    // 🔹 綁定所有切換帳號的按鈕
    switchBtns.forEach(btn => {
      btn.classList.remove("hidden");
      btn.addEventListener("click", async () => {
        try {
          await clearGoogleOauthCookieService();
          console.log("🧹 已清除 GoogleOauthData cookie，重新導向中…");
          window.location.replace("/register/oauth/google");
        } catch (err) {
          console.error("❌ 清除 Oauth Cookie 失敗", err);
          alert("Failed to switch account. Please try again.");
        }
      });
    });

  } catch (err) {
    console.error("❌ initRegisterWithGoogleOauthPage 錯誤:", err);
    alert("Unable to verify Google OAuth status.");
  }
}
