// ./pages/userpage_manager.js

import { getUserProfile } from "/service/getUserProfile.js";
import { renderPostCardWithLoading } from "/ui_controll/renderPostCard.js";
import {getUserPosts} from "/service/getUserPosts.js";
let currentUserPageId = null;
let userProfilePostIds = [];
let loadedPostsAmount = 0;
let loadingUserProfilePostsLock = false;

export async function initUserProfilePage() {
  try {
    // 1. 從 DOM 拿 userId
    const userInfoEl = document.getElementById("userprofilepage-userinfo");
    currentUserPageId = userInfoEl.dataset.userId;
    if (!currentUserPageId) throw new Error("❌ No data-user-id found.");

    // 2. 拿用戶基本資料
    const profile = await getUserProfile(currentUserPageId);
    console.log("/pages/userpage_manager.js ,profile: ", profile);
    renderUserProfileInfo(profile);

    // === 新增：根據好友狀態更新按鈕 ===
    updateFriendButton(profile);

    // 3. 拿用戶所有貼文 ID
    userProfilePostIds = await getUserPosts(currentUserPageId);
    console.log("initUserProfilePage: userProfilePostIds:", userProfilePostIds);

    // 4. 預設載入一批
    await loadMoreUserProfilePosts();

    window.addEventListener("scroll", handleScroll);

  } catch (err) {
    console.error("initUserProfilePage error:", err);
  }


}


/**
 * 根據好友狀態更新「好友按鈕」
 * @param {object} profile
 */
function updateFriendButton(profile) {
  const btn = document.getElementById("userprofilepage-addfriend-btn");
  if (!btn) return;

  const targetId = profile.user_id;
  let state = "none";

  // ✅ 直接從 in/out 中取 state（因為不再是以 userId 為 key）
  if (profile.friendship_status) {
    const inStatus = profile.friendship_status.in?.state;
    const outStatus = profile.friendship_status.out?.state;
    console.log("userPageinit: inStatus,outStatus",inStatus,outStatus);
    // 規則：如果其中之一是 "friend"，優先視為 friend；
    // 否則如果有 requested 或 incoming，依照情境顯示；
    // 若兩邊都沒狀態，則顯示 none。
    if (inStatus === "friend" || outStatus === "friend") {
      state = "friend";
    } else if (outStatus === "requested") {
      state = "requested";
    } else if (inStatus === "requested") {
      state = "incoming";
    } else if (inStatus === "rejected" || outStatus === "rejected") {
      state = "rejected";
    } else {
      state = "none";
    }
  }

  // 重設按鈕樣式
  btn.disabled = false;
  btn.className = "px-4 py-2 rounded-md transition font-medium";

  switch (state) {
    case "none":
      btn.textContent = "Add Friend";
      btn.classList.add("bg-indigo-600", "text-white", "hover:bg-indigo-700");
      btn.dataset.actionList = JSON.stringify([
        {
          action: "sendFriendRequest",
          type: "click",
          eventParameter: { target_id: targetId },
        },
      ]);
      break;

    case "requested":
      btn.textContent = "Request Sent";
      btn.classList.add("bg-gray-400", "text-white", "cursor-not-allowed");
      btn.disabled = true;
      btn.removeAttribute("data-action-list");
      break;

    case "friend":
      btn.textContent = "Friends";
      btn.classList.add("bg-green-600", "text-white", "cursor-default");
      btn.disabled = true;
      btn.removeAttribute("data-action-list");
      break;

    case "rejected":
      btn.textContent = "Request Sent";
      btn.classList.add("bg-gray-400", "text-white", "cursor-not-allowed");
      btn.disabled = true;
      btn.removeAttribute("data-action-list");
      break;

    case "incoming":
      btn.textContent = "Accept Friend Request";
      btn.classList.add("bg-green-600", "text-white", "hover:bg-green-700");
      btn.dataset.actionList = JSON.stringify([
        {
          action: "acceptFriendRequest",
          type: "click",
          eventParameter: { target_id: targetId },
        },
      ]);
      break;

    default:
      btn.textContent = "Add Friend";
      btn.classList.add("bg-indigo-600", "text-white", "hover:bg-indigo-700");
      btn.dataset.actionList = JSON.stringify([
        {
          action: "sendFriendRequest",
          type: "click",
          eventParameter: { target_id: targetId },
        },
      ]);
      break;
  }
}


export async function loadMoreUserProfilePosts(batchSize = 5) {
  if (loadingUserProfilePostsLock) return;

  const remaining = userProfilePostIds.length - loadedPostsAmount;
  if (remaining <= 0) return;

  loadingUserProfilePostsLock = true;

  const count = Math.min(batchSize, remaining);
  const postsToLoad = userProfilePostIds.slice(
    loadedPostsAmount,
    loadedPostsAmount + count
  );

  const container = document.getElementById("userprofilepage-posts-container");

  for (const postId of postsToLoad) {
    await renderPostCardWithLoading(postId, container);
  }

  loadedPostsAmount += count;
  loadingUserProfilePostsLock = false;

  console.log(
    `loadMoreUserProfilePosts: 已載入 ${loadedPostsAmount}/${userProfilePostIds.length} 篇`
  );
}

function renderUserProfileInfo(profile) {
  document.getElementById("userprofilepage-userinfo").dataset.userId =
    profile.user_id;

  document.getElementById("userprofilepage-profile-pic").src =
    profile.profile_picture_url;
  document.getElementById("userprofilepage-username-text").textContent =
    profile.username;
  document.getElementById("userprofilepage-targetlanguage-text").textContent =
    "Target Language: "+profile.targetlanguage;
  document.getElementById("userprofilepage-nativelanguage-text").textContent =
    "Native Language: "+profile.nativelanguage;

  // 更新按鈕 data-action-list
  document
    .getElementById("userprofilepage-addfriend-btn")
    .setAttribute(
      "data-action-list",
      JSON.stringify([
        {
          action: "sendFriendRequest",
          type: "click",
          eventParameter: { user_id: profile.user_id },
        },
      ])
    );

  document
    .getElementById("userprofilepage-message-btn")
    .setAttribute(
      "data-action-list",
      JSON.stringify([
        {
          action: "openChatRoom",
          type: "click",
          eventParameter: { user_id: profile.user_id },
        },
      ])
    );
}




function handleScroll() {
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  const fullHeight = document.documentElement.scrollHeight;

  if (scrollY + vh >= fullHeight - 50) {
    loadMoreUserProfilePosts();
  }
}
