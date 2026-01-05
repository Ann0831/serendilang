import { renderFriendRequestCard } from "../ui_controll/renderFriendRequestCard.js";
import { getAllFriendRequests } from "../service/getFriendRequestsData.js";
import {acceptFriendRequest} from "../service/acceptRequest.js";
import   {markFriendRequestsAsRead} from "/service/markIsRead.js";

// 全域狀態（之後要做翻頁/左右箭頭會用到）
export let friendRequests = [];
export let friendRequestsInitialized = false;
export let friendRequestsIndex = 0;
let loadingFriendRequestCardLock = false;

/**
 * 加載更多好友請求 (含 lock 機制)
 */
export function loadMoreFriendRequests() {
  const container = document.getElementById("friendRequestsContainer");
  if (!container) {
    console.error("❌ 找不到 #friendRequestsContainer");
    return;
  }

  if (!friendRequestsInitialized) {
    console.warn("⚠️ Friend request list not initialized yet.");
    return;
  }

  if (loadingFriendRequestCardLock) {
    console.log("Currently loading, please wait.");
    return;
  }

  if (friendRequestsIndex >= friendRequests.length) {
    console.log("✅ No more friend requests to load.");
    return;
  }

  try {
    loadingFriendRequestCardLock = true;

    const remaining = friendRequests.length - friendRequestsIndex;
    const count = Math.min(5, remaining);

    for (let i = 0; i < count; i++) {
      renderFriendRequestCard(container, friendRequests[friendRequestsIndex]);
      friendRequestsIndex++;
    }
  } catch (err) {
    console.error("❌ Failed to load more friend requests:", err);
  } finally {
    loadingFriendRequestCardLock = false;
  }
}

/**
 * 初始化 FriendRequestsPage
 * - 從 service 層取得好友請求列表
 * - 設定全域狀態
 * - 渲染第一批卡片
 */

export async function initFriendRequestsPage() {
  const container = document.getElementById("friendRequestsContainer");
  if (!container) {
    console.error("❌ #friendRequestsContainer not found.");
    return;
  }

  // 清空舊內容
  container.innerHTML = "";

  const prevBtn = document.getElementById("friendRequestsPagePrevBtn");
  const nextBtn = document.getElementById("friendRequestsPageNextBtn");

  // 每次移動的距離 (像素)
  const scrollStep = 300;

  prevBtn.addEventListener("click", () => {
    container.scrollBy({ left: -scrollStep, behavior: "smooth" });
  });

  nextBtn.addEventListener("click", () => {
    container.scrollBy({ left: scrollStep, behavior: "smooth" });
  });

  const spinner = document.getElementById("main-overlay-spinner");

  try {
    // 顯示 spinner
    if (spinner) {
      spinner.classList.remove("hidden");
    }

    // 從 service 拿好友請求列表
    friendRequests = await getAllFriendRequests();
    console.log(
      "./pages/friendRequestsPage.js initFriendRequestsPage: friendRequests: ",
      friendRequests
    );

    if (!friendRequests || friendRequests.length === 0) {
      container.innerHTML =
        "<p class='text-gray-500 p-4'>No friend requests at the moment.</p>";
      return;
    }

    // 狀態更新
    friendRequestsInitialized = true;
    friendRequestsIndex = 0;

    // 初次載入
    loadMoreFriendRequests();

    // 📌 綁定 scroll 事件，滑到底自動加載
    container.addEventListener("scroll", () => {
      if (
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth - 5
      ) {
        loadMoreFriendRequests();
      }
    });

  } catch (err) {
    console.error("❌ Failed to initialize friend requests page:", err);
    container.innerHTML =
      "<p class='text-red-500 p-4'>Loading failed, please try again later.</p>";

  } finally {
    // 隱藏 spinner
    if (spinner) {
      spinner.classList.add("hidden");
    }
  }
}

export async function enterFriendRequestsPage() {
  const page = document.getElementById("FriendRequestsPage");
  if (!page) {
    console.error("❌ #FriendRequestsPage not found");
    return;
  }

  // 🔴 取得紅點元素
  const unreadDot = document.getElementById("unread-friendrequest-dot");
  const needReinit = unreadDot && !unreadDot.classList.contains("hidden");

  if (needReinit) {
    console.log("🔄 Re-initializing Friend Requests because unread dot is ON");
    friendRequests = [];
    friendRequestsInitialized = false;
    friendRequestsIndex = 0;
    loadingFriendRequestCardLock = false;
  }

  try {
    // 顯示頁面容器
    page.classList.remove("hidden");

    // 初始化頁面（渲染好友請求卡片）
    if (!friendRequestsInitialized || needReinit) {
      await initFriendRequestsPage();
      friendRequestsInitialized = true;
    } else {
      console.log("enterFriendRequestsPage: use cache");
    }

    // ✅ 標記所有好友邀請為已讀
    const marked = await markFriendRequestsAsRead();
    if (marked) {
      console.log("✅ Friend requests marked as read.");
    } else {
      console.warn("⚠️ Failed to mark friend requests as read.");
    }

    // ✅ 關掉紅點
    if (unreadDot) {
      unreadDot.classList.add("hidden");
    }

  } catch (err) {
    console.error("❌ enterFriendRequestsPage error:", err);
  }
}

export function leaveFriendRequestsPage() {
  const page = document.getElementById("FriendRequestsPage");
  const container = document.getElementById("friendRequestsContainer");

  if (!page || !container) {
    console.warn("⚠️ leaveFriendRequestsPage: page or container not found.");
    return;
  }

  // 移除 scroll 事件
  container.replaceWith(container.cloneNode(true)); // clone 重建可移除所有綁定事件

  // 清空內容與狀態
  container.innerHTML = "";
  friendRequests = [];
  friendRequestsInitialized = false;
  friendRequestsIndex = 0;

  // 隱藏頁面
  page.classList.add("hidden");

  console.log("👋 Left FriendRequestsPage, cleaned up.");
}


