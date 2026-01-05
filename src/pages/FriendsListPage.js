import { getFriendsList } from "../service/getFriendsListPageData.js";
import { renderFriendElement } from "../ui_controll/renderFriendElement.js";
import { getCurrentUserBlockList_Global } from "/user_identity/user_identity.js";

import   {markAcceptedFriendsAsRead} from "/service/markIsRead.js";

// ===== 全域狀態 =====
let _friendsListPageState = {
  friendsList: [],
  loadedCount: 0,
  batchSize: 15,
  initialized: false,
  loading: false,
};

// ===== DOM id 常數 =====
const PAGE_ID = "friendslistpage";
const LIST_CONTAINER_ID = "friendslist-container";

/**
 * 初始化好友清單頁面 (第一次載入)
 */
async function initFriendsListPage() {
  const pageEl = document.getElementById(PAGE_ID);
  if (!pageEl) {
    console.error("❌#friendslistpage not found.");
    return;
  }

  const spinner = document.getElementById("main-overlay-spinner");

  try {
    if (spinner) spinner.classList.remove("hidden");

    // 先放標題 + downloading
    pageEl.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-medium">Friends:</h3>
        <button 
          class="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition"
          data-action-list='[{"type":"click","action":"openBlockedFriendsListModal"}]'>
          Blocked Friends
        </button>
      </div>
      <p>Downloading...</p>
    `;

    // 取得好友清單
    let friendsList = await getFriendsList();
    const BlockList = await getCurrentUserBlockList_Global();
    console.log("initFriendsListPage BlockList:", BlockList);

    if (Array.isArray(friendsList) && Array.isArray(BlockList)) {
      friendsList = friendsList.map(f => {
        if (BlockList.includes(f.friend_id)) {
          return { ...f, isBlocked: true };
        }
        return f;
      });

      // 把被封鎖的排到最後
      friendsList.sort((a, b) => {
        if (a.isBlocked && !b.isBlocked) return 1;
        if (!a.isBlocked && b.isBlocked) return -1;
        return 0;
      });
    }

    if (!friendsList || friendsList.length === 0) {
      pageEl.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-medium">Friends:</h3>
          <button 
            class="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition"
            data-action-list='[{"type":"click","action":"openBlockedFriendsListModal"}]'>
            Blocked Friends
          </button>
        </div>
        <p class="text-gray-500">You currently have no friends.</p>
      `;
      _friendsListPageState.initialized = true;
      return;
    }

    // 重新建立容器
    pageEl.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium">Friends:</h3>
        <button 
          class="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition"
          data-action-list='[{"type":"click","action":"openBlockedFriendsListModal"}]'>
          Blocked Friends
        </button>
      </div>
      <div id="${LIST_CONTAINER_ID}" class="space-y-2"></div>
    `;

    _friendsListPageState = {
      friendsList,
      loadedCount: 0,
      batchSize: _friendsListPageState.batchSize,
      initialized: true,
      loading: false,
    };

    // 載入第一批
    loadMoreFriends();

    // 綁定滾動事件
    window.addEventListener("scroll", _onScrollLoadMore);

  } catch (err) {
    console.error("initFriendsListPage error:", err);
    pageEl.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-medium">Friends:</h3>
        <button 
          class="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition"
          data-action-list='[{"type":"click","action":"openBlockedFriendsListModal"}]'>
          Blocked Friends
        </button>
      </div>
      <p class="text-red-500">Failed to load. Please try again later.</p>
    `;
  } finally {
    if (spinner) spinner.classList.add("hidden");
  }
}

/**
 * 進入好友清單頁面
 */
export async function enterFriendsListPage() {
  const pageEl = document.getElementById(PAGE_ID);
  if (!pageEl) return;

  pageEl.classList.remove("hidden");

  const unreadDot = document.getElementById("unread-acceptfriend-dot");
  const needReinit = unreadDot && !unreadDot.classList.contains("hidden");

  if (needReinit) {
    console.log("🔄 Re-initializing Friends List because unread dot is ON");
    _friendsListPageState = {
      friendsList: [],
      loadedCount: 0,
      batchSize: 15,
      initialized: false,
      loading: false,
    };
  }

  if (!_friendsListPageState.initialized) {
    await initFriendsListPage();
  } else {
    console.log("enterFriendsListPage: use cache");
    window.addEventListener("scroll", _onScrollLoadMore);
  }

  // ✅ 標記所有已讀
  markAcceptedFriendsAsRead();

  // ✅ 關掉紅點
  if (unreadDot) {
    unreadDot.classList.add("hidden");
  }
}

/**
 * 離開好友清單頁面
 */
export function exitFriendsListPage() {
  const pageEl = document.getElementById(PAGE_ID);
  if (!pageEl) return;

  pageEl.classList.add("hidden");

  window.removeEventListener("scroll", _onScrollLoadMore);
}

/**
 * 強制重新載入好友清單
 */
export async function reloadFriendsListPage() {
  //console.log("reloadFriendsListPage: 重新載入好友清單");
  _friendsListPageState = {
    friendsList: [],
    loadedCount: 0,
    batchSize: 15,
    initialized: false,
    loading: false,
  };

  await initFriendsListPage();
}

// --- 工具函式 ---

function _onScrollLoadMore() {
  const nearBottom =
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
  if (nearBottom) {
    loadMoreFriends();
  }
}

function loadMoreFriends() {
  if (_friendsListPageState.loading) return;

  const { friendsList, loadedCount, batchSize } = _friendsListPageState;
  if (!Array.isArray(friendsList) || loadedCount >= friendsList.length) return;

  const listContainer = document.getElementById(LIST_CONTAINER_ID);
  if (!listContainer) return;

  _friendsListPageState.loading = true;

  const nextBatch = friendsList.slice(loadedCount, loadedCount + batchSize);
  for (const obj of nextBatch) {
    renderFriendElement(listContainer, obj);
  }

  _friendsListPageState.loadedCount += nextBatch.length;
  _friendsListPageState.loading = false;
}

