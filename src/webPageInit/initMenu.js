import { fetchUsername, fetchUserProfilePicUrl } from "/service/getUserSelfBasicData.js"; 
// 請依實際專案路徑調整

initMenu();

/**
 * 初始化選單中的使用者頭貼與名稱
 */
export async function initMenu() {
  const container = document.getElementById("startuserselfpage-button");
  if (!container) {
    console.error("initMenu error: 找不到 #startuserselfpage-button");
    return;
  }

  // 初始 Loading 畫面
  container.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center">
        <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
      <span class="font-semibold hidden md:inline-flex">Loading...</span>
    </div>
  `;

  try {
    // 並行取 username 和頭貼
    const [username, profileUrl] = await Promise.all([
      fetchUsername(),
      fetchUserProfilePicUrl()
    ]);

    // 更新 DOM
    container.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${profileUrl}" alt="${username} avatar"
          class="w-10 h-10 rounded-full object-cover border border-gray-300" />
        <span class="font-semibold hidden md:inline-flex">${username || "Unknown"}</span>
        <span
    id="unread-profile-dot"
    class="notification-dot hidden w-2 h-2 bg-red-500 rounded-full right-3 md:left-6 top-2"
  ></span>
      </div>
    `;
  } catch (err) {
    console.error("initMenu error:", err);
    // 顯示 fallback
    container.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="default.jpg" alt="default avatar"
          class="w-10 h-10 rounded-full object-cover border border-gray-300" />
        <span class="font-semibold hidden md:inline-flex">Unknown</span>
      </div>
    `;
  }
}

