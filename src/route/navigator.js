
import {login_PostPage_Enter,login_PostPage_Leave} from "/pages/loginPostPage.js";
import { messagesPage_Enter, messagesPage_Leave } from "/pages/messagesScreenPage.js";
import {initPotentialFriendsPage} from "/pages/potentialFriendsPage.js";
import {leaveFriendRequestsPage,enterFriendRequestsPage} from '/pages/friendRequestsPage.js';
import { initUserSelfPage,userSelfPage_Enter,userSelfPage_Leave } from "/pages/userSelfPage.js";
import { enterFriendsListPage, exitFriendsListPage } from "/pages/FriendsListPage.js";
import { OnlineUsersPage_Enter, OnlineUsersPage_Leave } from "/pages/OnlineUsersPage.js";

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
      OnlineUsersPage_Enter();
    },
    leave: () => {
      console.log("[OnlineUsersPage] leave");
      OnlineUsersPage_Leave();
    }
  }
};


let currentScreen = null;

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

  // ◉ 先呼叫舊頁面的 leave hook
  if (currentScreen && HOOKS[currentScreen]?.leave) {
    try {
      HOOKS[currentScreen].leave();
    } catch (err) {
      console.error(`[navigator] leave hook for ${currentScreen} failed:`, err);
    }
  }

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
  Object.entries(BUTTON_MAP).forEach(([screenId, buttonId]) => {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    if (screenId === id) {
      btn.classList.add("bg-pink-100", "text-pink-600");
    } else {
      btn.classList.remove("bg-pink-100", "text-pink-600");
    }
  });

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
}
/**
 * 初始化 navigator
 * - 預設頁面
 * - 綁定 popstate（瀏覽器返回/前進）
 */
export function initNavigator(defaultScreen = "postContainer") {
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


