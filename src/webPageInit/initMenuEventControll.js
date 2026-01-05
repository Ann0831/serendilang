import { navigate } from "/route/navigator.js";

/**
 * 綁定側邊欄選單事件
 */
export function initMenuEventControll() {

  // Potential Friend
  const potentialBtn = document.getElementById("showpotentialfriend-button");
  if (potentialBtn) {
    potentialBtn.addEventListener("click", () => navigate("PotentialFriendsPage"));
    console.log("[initMenuEventControll] ✅ Bound: showpotentialfriend-button");
  } else {
    console.warn("[initMenuEventControll] ❌ Missing: showpotentialfriend-button");
  }

  // Friend Request
  const friendReqBtn = document.getElementById("gotofriendrequest-button");
  if (friendReqBtn) {
    friendReqBtn.addEventListener("click", () => navigate("FriendRequestsPage"));
    console.log("[initMenuEventControll] ✅ Bound: gotofriendrequest-button");
  } else {
    console.warn("[initMenuEventControll] ❌ Missing: gotofriendrequest-button");
  }

  // Main Page
  const mainBtn = document.getElementById("gotomainpage-button");
  if (mainBtn) {
    mainBtn.addEventListener("click", () => navigate("postContainer"));
    console.log("[initMenuEventControll] ✅ Bound: gotomainpage-button");
  } else {
    console.warn("[initMenuEventControll] ❌ Missing: gotomainpage-button");
  }

  // Your Posts
  const selfBtn = document.getElementById("startuserselfpage-button");
  if (selfBtn) {
    selfBtn.addEventListener("click", () => navigate("UserSelfPage"));
    console.log("[initMenuEventControll] ✅ Bound: startuserselfpage-button");
  } else {
    console.warn("[initMenuEventControll] ❌ Missing: startuserselfpage-button");
  }

  // Friends List
  const friendsListBtn = document.getElementById("startfriendslistpage-button");
  if (friendsListBtn) {
    friendsListBtn.addEventListener("click", () => navigate("FriendsListPage"));
    console.log("[initMenuEventControll] ✅ Bound: startfriendslistpage-button");
  } else {
    console.warn("[initMenuEventControll] ❌ Missing: startfriendslistpage-button");
  }

  // Messages
  const messagesBtn = document.getElementById("startmessagespage-button");
  if (messagesBtn) {
    messagesBtn.addEventListener("click", () => navigate("messagespage"));
    console.log("[initMenuEventControll] ✅ Bound: startmessagespage-button");
  } else {
    console.warn("[initMenuEventControll] ❌ Missing: startmessagespage-button");
  }

  // Online Users
  const onlineBtn = document.getElementById("gotoOnlineUsers-button");
  if (onlineBtn) {
    onlineBtn.addEventListener("click", () => navigate("OnlineUsersPage"));
    console.log("[initMenuEventControll] ✅ Bound: gotoOnlineUsers-button");
  } else {
    console.warn("[initMenuEventControll] ❌ Missing: gotoOnlineUsers-button");
  }
}

initMenuEventControll();


