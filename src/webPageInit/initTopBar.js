import { fetchUsername, fetchUserProfilePicUrl } from "/service/getUserSelfBasicData.js";
import {testloginService} from "/service/loginService.js";

initTopBar();

/**
 * 初始化頂部導覽列 (TopBar) 的使用者頭像與名稱
 *
 *
**/


 export async function initTopBar() {
  const avatarEl = document.getElementById("full-header-avatar");
  const usernameEl = document.getElementById("full-header-username");

  if (!avatarEl || !usernameEl) {
    console.error("initTopBar error: 找不到 #full-header-avatar 或 #full-header-username");
    renderLoginRegister();
    return;
  }

  // 先顯示 loading 狀態
  avatarEl.src = "";
  avatarEl.classList.add("flex", "items-center", "justify-center", "bg-gray-200");
  avatarEl.innerHTML = `
    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
  `;
  usernameEl.textContent = "Loading...";


  const testloginRes = await testloginService();


  // 🟢 已登入
  if (testloginRes?.loginstate === "login") {
    console.log("[CheckLogin] ✅ 使用者已登入");
    
  }else{
    renderLoginRegister();
    return;
  }

  try {
    // 並行抓 username + 頭貼
    const [username, profileUrl] = await Promise.all([
      fetchUsername(),
      fetchUserProfilePicUrl()
    ]);
    console.log("initTopBar.js: initTopBar: username: ",username);
    console.log("initTopBar.js: initTopBar: profileUrl: ",profileUrl);
    // ❗ 判斷有無值
    if (!username || !profileUrl) {
      renderLoginRegister();
      return;
    }

    // 更新 DOM
    avatarEl.classList.remove("flex", "items-center", "justify-center", "bg-gray-200");
    avatarEl.classList.add("bg-white");

    avatarEl.innerHTML = "";
    avatarEl.src = profileUrl;

    usernameEl.textContent = username;
  } catch (err) {
    console.error("initTopBar error:", err);
    renderLoginRegister();
  }
}

/**
 * 畫面變成 Login/Register
 **/

function renderLoginRegister() {
  const el = document.getElementById("topBar-self-profile-zone");
  if (!el) {
    console.warn("[renderLoginRegister] ⚠️ Element #topBar-self-profile-zone not found.");
    return;
  }

  el.innerHTML = `
    <a href="/login"
       class="border border-white text-white rounded px-4 py-1 text-sm hover:bg-white hover:text-indigo-600 transition">
       Register&nbsp;/&nbsp;Login
    </a>
  `;
}

