import { renderPotentialFriendCard } from "../ui_controll/renderPotentialFriendCard.js";
import { getAllPotentialFriends } from "../service/getPotentialFriendsData.js";
import {addFriend} from "../service/addFriend.js";
// 全域狀態（可以集中管理，之後要做翻頁/左右箭頭會用到）
export let potentialFriends = [];
export let potentialFriendsInitialized = false;
export let potentialFriendsIndex = 0;
let loadingPotentialFriendCardLock = false;
/**
 * 初始化 PotentialFriendsPage
 * - 從 service 層取得推薦好友列表
 * - 設定全域狀態
 * - 渲染第一張卡片
 */

export function loadMorePotentialFriends() {
  const container = document.getElementById("potentialfriendsContainer");
  if (!container) {
    console.error("❌ #potentialfriendsContainer not found.");
    return;
  }

  if (!potentialFriendsInitialized) {
    console.warn("⚠️ Friend list not initialized yet. Please call initPotentialFriendsPage first.");
    return;
  }

  if (loadingPotentialFriendCardLock) {
    console.log("⚠️ Currently loading, please wait");
    return;
  }

  if (potentialFriendsIndex >= potentialFriends.length) {
    console.log("✅ No more friends to load");
    return;
  }

  try {
    loadingPotentialFriendCardLock = true;

    const remaining = potentialFriends.length - potentialFriendsIndex;
    const count = Math.min(5, remaining);

    for (let i = 0; i < count; i++) {
      renderPotentialFriendCard(container, potentialFriends[potentialFriendsIndex]);
      potentialFriendsIndex++;
    }
  } catch (err) {
    console.error("❌ Failed to load more:", err);
  } finally {
    loadingPotentialFriendCardLock = false;
  }
}


export async function initPotentialFriendsPage() {
  const container = document.getElementById("potentialfriendsContainer");
  if (!container) {
    console.error("❌ #potentialfriendsContainer not found");
    return;
  }

  // 清空舊內容
  container.innerHTML = "";

  const prevBtn = document.getElementById("potentialFriendPagePrevBtn");
  const nextBtn = document.getElementById("potentialFriendPageNextBtn");

  // 每次移動的距離 (像素)
  const scrollStep = 300; // 可以調整成一張卡片的寬度 + margin

  prevBtn.addEventListener("click", () => {
    container.scrollBy({ left: -scrollStep, behavior: "smooth" });
  });

  nextBtn.addEventListener("click", () => {
    container.scrollBy({ left: scrollStep, behavior: "smooth" });
  });

  // 🔹 找到 main overlay spinner
  const spinner = document.getElementById("main-overlay-spinner");

  try {
    // 顯示 spinner
    if (spinner) {
      spinner.classList.remove("hidden");
    }

    // 從 service 拿推薦好友列表
    potentialFriends = await getAllPotentialFriends();
    console.log(
      "./pages/potentialFriendsPage.js initPotentialFriendsPage: potentialFriends: ",
      potentialFriends
    );

    if (!potentialFriends || potentialFriends.length === 0) {
      container.innerHTML =
        "<p class='text-gray-500 p-4'>No recommended friends at the moment</p>";
      return;
    }

    // 狀態更新
    potentialFriendsInitialized = true;
    potentialFriendsIndex = 0;

    loadMorePotentialFriends();

    // 📌 綁定 scroll 事件，滑到底自動加載
    container.addEventListener("scroll", () => {
      if (
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth - 5
      ) {
        loadMorePotentialFriends();
      }
    });

  } catch (err) {
    console.error("❌ Failed to initialize potential friends page:", err);
    container.innerHTML =
      "<p class='text-red-500 p-4'>Loading failed, please try again later.</p>";
  } finally {
    // 隱藏 spinner
    if (spinner) {
      spinner.classList.add("hidden");
    }
  }
}

