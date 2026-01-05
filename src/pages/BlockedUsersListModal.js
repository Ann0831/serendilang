import { getCurrentUserBlockList_Global } from "/user_identity/user_identity.js";
import { createBlockedFriendElement } from "/ui_create/createFriendElement.js";
import { getUserProfile } from "/service/getUserProfile.js";

export function openBlockedUsersListModal(options = { filter: "all" }) {
  let overlay = document.getElementById("blockedUsersList-modal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "blockedUsersList-modal-overlay";
    overlay.className =
      "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";

    overlay.innerHTML = `
      <div id="blockedUsersList-modal" 
           class="bg-white w-96 rounded-lg shadow-lg flex flex-col max-h-[80vh] overflow-hidden"
           data-action-list='[{"type":"click","action":"stopPropagation"}]'>
        
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-2 border-b">
          <h2 id="blockedUsersList-title" class="font-semibold text-lg text-gray-800"></h2>
          <button 
            class="p-1 rounded hover:bg-gray-200 transition text-gray-600"
            data-action-list='[{"type":"click","action":"closeBlockedUsersListModal"}]'>
            ✕
          </button>
        </div>

        <!-- Content -->
        <div id="blockedUsersList-content" class="flex-1 overflow-y-auto">
          <p class="text-sm text-gray-500 p-3">Loading...</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // overlay 背景點擊關閉
    overlay.dataset.actionList = JSON.stringify([
      { type: "click", action: "closeBlockedUsersListModal" }
    ]);
  }

  // 動態設定標題
  const title = document.getElementById("blockedUsersList-title");
  title.textContent =
    options.filter === "friendsOnly" ? "Blocked Friends" : "Blocked Users";

  overlay.classList.remove("hidden");
  loadBlockedUsersList(options);
}

export function closeBlockedUsersListModal() {
  const overlay = document.getElementById("blockedUsersList-modal-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
  }
}

/**
 * 🔄 重新載入封鎖清單 (Modal 已經打開時)
 */
export function reloadBlockedUsersListModal() {
  const overlay = document.getElementById("blockedUsersList-modal-overlay");
  if (!overlay || overlay.classList.contains("hidden")) {
    console.warn("reloadBlockedUsersListModal: modal not open, skip");
    return;
  }

  // 保持現有 filter
  const title = document.getElementById("blockedUsersList-title");
  let filter = "all";
  if (title?.textContent?.includes("Friends")) {
    filter = "friendsOnly";
  }

  loadBlockedUsersList({ filter });
}

async function loadBlockedUsersList(options) {
  const content = document.getElementById("blockedUsersList-content");
  if (!content) return;

  // 清空並顯示 spinner
  content.innerHTML = "";
  const spinnerBox = document.createElement("div");
  spinnerBox.className =
    "flex flex-col items-center justify-center p-4 text-gray-500";
  spinnerBox.innerHTML = `
    <span class="w-6 h-6 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></span>
    <p class="mt-2 text-xs">Loading...</p>
  `;
  content.appendChild(spinnerBox);

  try {
    const blockList = await getCurrentUserBlockList_Global();

    if (!blockList || blockList.length === 0) {
      spinnerBox.remove();
      content.innerHTML = `<p class="text-sm text-gray-500 p-3">You haven't blocked anyone.</p>`;
      return;
    }

    for (const userId of blockList) {
      const moreData = await getUserProfile(userId);
      console.log("Blocked user:", moreData);

      // 如果是 friendsOnly 模式，過濾掉不是朋友的
      if (
        options.filter === "friendsOnly" &&
        moreData?.friendship_status?.in?.state !== "friend"
      ) {
        continue;
      }

      const el = createBlockedFriendElement({
        friend_id: userId,
        friend_name: moreData?.username,
        profilePicUrl: moreData?.profile_picture_url,
        language: {
          nativelanguage: moreData?.nativelanguage,
          targetlanguage: moreData?.targetlanguage,
        },
        isBlocked: true,
      });

      // 插在 spinner 前面
      content.insertBefore(el, spinnerBox);
    }

    spinnerBox.remove();

    if (!content.hasChildNodes()) {
      content.innerHTML = `<p class="text-sm text-gray-500 p-3">No blocked ${
        options.filter === "friendsOnly" ? "friends" : "users"
      } found.</p>`;
    }
  } catch (err) {
    console.error("Error loading blocked users:", err);
    spinnerBox.remove();
    content.innerHTML = `<p class="text-sm text-red-600 p-3">Failed to load blocked users.</p>`;
  }
}

