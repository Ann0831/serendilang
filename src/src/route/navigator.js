import {login_PostPage_Enter,login_PostPage_Leave} from "../pages/loginPostPage.js";
import { messagesPage_Enter, messagesPage_Leave } from "../pages/messagesScreenPage.js";
import {initPotentialFriendsPage} from "../pages/potentialFriendsPage.js";
import {leaveFriendRequestsPage,enterFriendRequestsPage} from '../pages/friendRequestsPage.js';
import { initUserSelfPage,userSelfPage_Enter,userSelfPage_Leave } from "../pages/userSelfPage.js";
import { enterFriendsListPage, exitFriendsListPage } from "../pages/FriendsListPage.js";
import { showOnlineUsersFullscreen, hideOnlineUsersFullscreen } from "../pages/onlineUsersContainer.js";
import { mountLoginScreen } from "../pages/loginPagesMount.js";

// 你所有可切換的 section ID
const SCREENS = [
  "messagespage",
  "postContainer",
  "PotentialFriendsPage",
  "FriendRequestsPage",
  "edituserinfo-Container",
  "UserSelfPage",
  "FriendsListPage",
  "OnlineUsersPage",
];

// Section ID → 對應的按鈕 ID
const BUTTON_MAP = {
  messagespage: "startmessagespage-button",
  postContainer: "gotomainpage-button",
  PotentialFriendsPage: "showpotentialfriend-button",
  FriendRequestsPage: "gotofriendrequest-button",
  "edituserinfo-Container": "showeditintroduction-button",
  UserSelfPage: "startuserselfpage-button",
  FriendsListPage: "startfriendslistpage-button",
  OnlineUsersPage: "gotoOnlineUsers-button", 
};

const HOOKS = {
  postContainer: {
    enter: () => {
      console.log("[postContainer] enter");
      // 例如 postsPage_Enter();
      login_PostPage_Enter();
    },
    leave: () => {
      console.log("[postContainer] leave");
      // 例如 postsPage_Leave();
      login_PostPage_Leave();
    }
  },
  postdiv: {
    enter: () => {
      console.log("[postdiv] enter");
    },
    leave: () => {
      console.log("[postdiv] leave");
    }
  },
  "messagespage": {
    enter: () => {
      console.log("[messagespage] enter");
      messagesPage_Enter();
    },
    leave: () => {
      console.log("[messagespage] leave");
      messagesPage_Leave();
    }
  },
  "PotentialFriendsPage":{
    enter: () => {
      console.log("[PotentialFriendsPage] enter");
      initPotentialFriendsPage();
    },
    leave: () => {
      console.log("[PotentialFriendsPage] leave");
      
    }


  },
   "FriendRequestsPage":{
    enter: () => {
      console.log("[FriendRerquestsPage] enter");
      enterFriendRequestsPage();
      
    },
    leave: () => {
      leaveFriendRequestsPage();
      console.log("[FriendRerquestsPage] leave");

    }


  },
   "UserSelfPage":{
    enter: () => {
      console.log("[UserSelfPage] enter");
      userSelfPage_Enter();

    },
    leave: () => {
      console.log("[UserSelfPage] leave");
      userSelfPage_Leave();
    }


  },
   "FriendsListPage":{
    enter: () => {
      console.log("[FriendsListPage] enter");
      enterFriendsListPage();

    },
    leave: () => {
      console.log("[FriendsListPage] leave");
      exitFriendsListPage();
    },


  },
  "OnlineUsersPage": {
    enter: () => {
      console.log("[OnlineUsersPage] enter");
      showOnlineUsersFullscreen();
    },
    leave: () => {
      console.log("[OnlineUsersPage] leave");
      hideOnlineUsersFullscreen();
    }
  }
};


let currentScreen = null;
const screenScrollPositions = Object.create(null);
let menuBarMountListenerBound = false;

function applyActiveMenuButton(targetScreenId) {
  Object.entries(BUTTON_MAP).forEach(([screenId, buttonId]) => {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    const iconEl = btn.querySelector("i.ti");
    const outlineIconClass = iconEl?.dataset?.outlineIcon;
    const filledIconClass = iconEl?.dataset?.filledIcon;

    if (screenId === targetScreenId) {
      btn.classList.add("bg-gray-300", "text-gray-900");
      if (iconEl && outlineIconClass && filledIconClass) {
        iconEl.classList.remove(outlineIconClass);
        iconEl.classList.add(filledIconClass);
      }
    } else {
      btn.classList.remove("bg-gray-300", "text-gray-900");
      if (iconEl && outlineIconClass && filledIconClass) {
        iconEl.classList.remove(filledIconClass);
        iconEl.classList.add(outlineIconClass);
      }
    }
  });
}

function saveCurrentScreenScroll() {
  if (!currentScreen) return;
  screenScrollPositions[currentScreen] = window.scrollY || window.pageYOffset || 0;
}

function restoreScreenScroll(screenId) {
  const top = Number.isFinite(screenScrollPositions[screenId]) ? screenScrollPositions[screenId] : 0;
  // mount 與頁面 enter 後再還原，避免被初始渲染覆蓋
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top, left: 0, behavior: "auto" });
    });
  });
}

/**
 * 顯示指定頁面，隱藏其他頁面，並高亮對應的按鈕
 * @param {string} id - 要顯示的 section id
 * @param {boolean} pushHistory - 是否要同步到瀏覽器 history
 */
export function navigate(id, pushHistory = true) {
  if (!SCREENS.includes(id)) {
    console.warn(`[navigator] unknown screen id: ${id}`);
    return;
  }

  // 如果已經在這個頁面，就不重複切換
  if (currentScreen === id) return;

  saveCurrentScreenScroll();

  // ◉ 先呼叫舊頁面的 leave hook
  if (currentScreen && HOOKS[currentScreen]?.leave) {
    try {
      HOOKS[currentScreen].leave();
    } catch (err) {
      console.error(`[navigator] leave hook for ${currentScreen} failed:`, err);
    }
  }

  mountLoginScreen(id);

  // 切換 section 顯示/隱藏
  SCREENS.forEach(screenId => {
    const el = document.getElementById(screenId);
    if (!el) return;

    if (screenId === id) {
      el.classList.remove("hidden");
      el.style.display = "block";
    } else {
      el.classList.add("hidden");
      el.style.display = "none";
    }
  });

  // 切換按鈕顏色
  applyActiveMenuButton(id);

  // 更新當前頁面 ID
  currentScreen = id;

  // 更新網址 hash
  if (pushHistory) {
    window.history.pushState({ screen: id }, "", `#${id}`);
  }

  // ◉ 呼叫新頁面的 enter hook
  if (HOOKS[id]?.enter) {
    try {
      HOOKS[id].enter();
    } catch (err) {
      console.error(`[navigator] enter hook for ${id} failed:`, err);
    }
  }

  restoreScreenScroll(id);
}
/**
 * 初始化 navigator
 * - 預設頁面
 * - 綁定 popstate（瀏覽器返回/前進）
 */
export function initNavigator(defaultScreen = "postContainer") {
  if (!menuBarMountListenerBound && typeof window !== "undefined") {
    window.addEventListener("menuBar:mounted", () => {
      syncNavigatorButtonState();
    });
    menuBarMountListenerBound = true;
  }

  // 如果網址帶 hash，就用 hash 指定的頁面
  const initialScreen = location.hash.slice(1) || defaultScreen;
  navigate(initialScreen, false);

  // 處理瀏覽器返回/前進
  window.addEventListener("popstate", e => {
    const screen = e.state?.screen || defaultScreen;
    navigate(screen, false);
  });
}

/**
 * 取得目前頁面 ID
 */
export function getCurrentScreen() {
  return currentScreen;
}

export function syncNavigatorButtonState() {
  const id = currentScreen || location.hash.slice(1);
  if (!id || !SCREENS.includes(id)) return;
  applyActiveMenuButton(id);
}
