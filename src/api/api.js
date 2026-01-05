// /api/api.js


import {eventBus} from "../utils/eventBus.js";


// /api/api.js

// ✅ 未讀訊息數
export async function getUnreadMessageCount() {
  try {
    const response = await fetch('/api/unread/messages/count', {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("/api/api.js: getUnreadMessageCount: data: ", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    return { status: "error" };
  }
}

// ✅ 未讀好友邀請數
export async function getUnreadFriendRequestCount() {
  try {
    const response = await fetch('/api/unread/friend-requests/count', {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("/api/api.js: getUnreadFriendRequestCount: data: ", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    return { status: "error" };
  }
}

// ✅ 好友清單
export async function getFriendsList() {
  try {
    const response = await fetch('/api/friends', {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("/api/api.js: getFriendsList: data: ", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    return { status: "error" };
  }
}

// ✅ 推薦貼文（建議貼文列表）
export async function getPostSuggest() {
  try {
    const response = await fetch('/api/posts/suggestions', {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("/api/api.js:getPostSuggest data: ", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    return { status: "error" };
  }
}

// ✅ 指定對象訊息記錄
export async function fetchMessages(target_id, amount) {
  try {
    if (!target_id) throw new Error("target_id is required");
    const response = await fetch(`/api/messages?target_id=${encodeURIComponent(target_id)}&amount=${amount}`, {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("/api/api.js: fetchMessages:data: ", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("fetchMessages error:", error);
    return { status: "error" };
  }
}

// ✅ 取得頭像網址
export async function getProfilePictureUrl(targetId) {
  try {
    const response = await fetch(`/api/users/profile-picture?target_id=${encodeURIComponent(targetId)}`);
    await checkResOk(response);
    const data = await response.json();
    console.log("/api/api.js: getProfilePictureUrl: data: ", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error("Error fetching profile picture URL:", err);
    return { status: "error" };
  }
}

// ✅ 依 post_id 取貼文（改 path param）
export async function getPostById(post_id) {
  console.log("api/api.js getPostById: post_id: ", post_id);
  if (!post_id) return { status: "error" };
  let res;
  try {
    res = await fetch(`/api/posts/${encodeURIComponent(post_id)}`, {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("api/api.js getPostById: data: ", data);
    return data;
  } catch (err) {
    console.error("getPostById error:", err);
    handleNetworkError(err);
    return err;
  }
}


// ✅ 已送出的好友邀請對象資料
export async function getRequestedFriendData() {
  try {
    const res = await fetch('/api/friends/requests', {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("/api/api.js: getRequestedFriendData: data: ", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error('getRequestedFriendData error:', err);
    return { status: "error" };
  }
}

// ✅ 特定訊息畫面資料
export async function getSpecificMessageScreen(target_id) {
  try {
    if (!target_id || typeof target_id !== 'string')
      return { status: "error" };
    const url = `/api/conversations/${encodeURIComponent(target_id)}`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("/api/api.js: getSpecificMessageScreen: data: ", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error('getSpecificMessageScreen error:', err);
    return { status: "error" };
  }
}

// ✅ 未讀「好友接受」通知數
export async function getUnreadAcceptFriendCount() {
  try {
    const res = await fetch('/api/unread/friends-accept/count', {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("/api/api.js: getUnreadAcceptFriendCount: data: ", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error('getUnreadAcceptFriendCount error:', err);
    return { status: "error" };
  }
}

// ✅ 所有訊息畫面
export async function getAllMessagesScreen() {
  try {
    const res = await fetch('/api/conversations', {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("/api/api.js: getAllMessagesScreen: data: ", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error('getAllMessagesScreen error:', err);
    return { status: "error" };
  }
}

// ✅ 目前登入者身分
export async function getCurrentUserIdentity() {
  try {
    const res = await fetch('/api/users/current', {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("/api/api.js: getCurrentUserIdentity: data: ", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error('getCurrentUserIdentity error:', err);
    return { status: "error" };
  }
}

// ✅ 全站推薦貼文的 post_id 陣列
export async function getGlobalPostsSuggest() {
  try {
    const res = await fetch('/api/posts/suggestions/global', {
      method: 'GET',
      credentials: 'include'
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("/api/api.js: getGlobalPostsSuggest: data: ", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error('getGlobalPostsSuggest error:', err);
    return { status: "error" };
  }
}

// ✅ 推薦潛在好友名單
export async function getPotentialFriends() {
  try {
    const res = await fetch('/api/friends/potential', {
      method: 'GET',
      credentials: 'include'
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("/api/api.js: getPotentialFriends: data: ", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error('getPotentialFriends error:', err);
    return { status: "error" };
  }
}

// ✅ 指定用戶的語言資訊
export async function getUserLanguage(target_id) {
  if (!target_id) return { status: "error" };
  try {
    const res = await fetch(`/api/users/language?target_id=${encodeURIComponent(target_id)}`, {
      method: 'GET',
      credentials: 'include'
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("/api/api.js: getUserLanguage: data: ", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error('getUserLanguage error:', err);
    return { status: "error" };
  }
}

// ✅ 指定用戶所有貼文 IDs
export async function getUserAllPostIds(target_id) {
  try {
    if (!target_id) throw new Error("target_id is not defined");
    const res = await fetch(`/api/users/${encodeURIComponent(target_id)}/posts`, {
      method: 'GET',
      credentials: 'include'
    });
    await checkResOk(res);
    const arr = await res.json();
    console.log("/api/api.js: getUserAllPostIds: arr: ", arr);
    return arr;
  } catch (err) {
    handleNetworkError(err);
    console.error('getUserAllPostIds error:', err);
    return { status: "error" };
  }
}

// ✅ 以 user_id 查 username
export async function getUsernameById(target_id) {
  if (!target_id) return { status: "error" };
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(target_id)}/username`, {
      method: "GET",
      credentials: "include"
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("/api/api.js: getUsernameById: data: ", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error("getUsernameById error:", err);
    return { status: "error" };
  }
}

// ✅ 查詢是否對貼文按讚
export async function getUserLikePost(postId) {
  try {
    const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/like`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("api/api.js: getUserLikePost: data: ", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("Error in getUserLikePost:", error);
    return { status: "error" };
  }
}


// ✅ 取得封鎖名單
export async function getUserBlockList() {
  try {
    const response = await fetch(`/api/users/blocks`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:getUserBlockList] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:getUserBlockList] error:", error);
    return { status: "error" };
  }
}

// ✅ 友誼狀態
export async function apiGetFriendshipStatus(targetId) {
  try {
    const response = await fetch(
      `/api/friendships/status?target_id=${encodeURIComponent(targetId)}`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }
    );
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:apiGetFriendshipStatus] data:", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error("[API:apiGetFriendshipStatus] error:", err);
    return { status: "error" };
  }
}

// ✅ 我的貼文檢舉紀錄
export async function getMyPostReports() {
  try {
    const response = await fetch('/api/users/me/post-reports', {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:getMyPostReports] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:getMyPostReports] error:", error);
    return { status: "error" };
  }
}

// ✅ 檢查使用者名稱可用性
export async function checkUsernameAvailability(username) {
  try {
    const response = await fetch(
      `/api/users/check-username?check_username=${encodeURIComponent(username)}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:checkUsernameAvailability] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:checkUsernameAvailability] error:", error);
    return { status: "error" };
  }
}


export async function getUserRealtimeStatus(targetId) {
  try {
    const response = await fetch(`/api/real-time/user/status/${encodeURIComponent(targetId)}`, {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("/api/api.js: getUserRealtimeStatus: data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    return { status: "error" };
  }
}

export async function getRealtimeOnlineList() {
  try {
    const response = await fetch('/api/real-time/onlineList', {
      method: 'GET',
      credentials: 'include',
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("/api/api.js: getRealtimeOnlineList: data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    return { status: "error" };
  }
}


export async function getUnreadSystemUserNotifications() {
  console.log("api/api.js getUnreadSystemUserNotifications: start");

  let res;
  try {
    res = await fetch("/api/system-user-notifications/unread", {
      method: "GET",
      credentials: "include",
    });

    await checkResOk(res);

    const data = await res.json();
    console.log("api/api.js getUnreadSystemUserNotifications: data:", data);

    return data;
  } catch (err) {
    console.error("getUnreadSystemUserNotifications error:", err);
    handleNetworkError(err);
    return err;
  }
}


// 🔹 取得 Google OAuth 狀態
export async function getGoogleOauthStatus() {
  try {
    const response = await fetch('/api/auth/oauth/google/status', {
      method: 'GET',
      credentials: 'include', // ✅ 讓 cookie 一起傳
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("/api/api.js: getGoogleOauthStatus: data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    return { status: "error" };
  }
}



/* ✅ 錯誤處理統一區塊 */
function handleNetworkError(err) {
  if (err instanceof TypeError) {
    console.warn("[NetworkError] 網路錯誤，檢查連線狀態...");
    if (!navigator.onLine) {
      console.error("[NetworkError] 偵測到離線");
      eventBus.emit("openNetworkBanner", { state: "USER_OFFLINE" });
    } else {
      console.error("[NetworkError] 無法連線伺服器 (可能是 CORS / DNS / timeout)");
      eventBus.emit("openNetworkBanner", { state: "SERVER_UNREACHABLE" });
    }
  } else {
    console.error("[UnhandledError] 其他非網路錯誤:", err);
  }
}

export async function checkResOk(res) {
  if (res.ok) return res;

  let msg = "";
  let data = {}; // ✅ 先宣告避免未定義

  try {
    const jsondata = await res.json();
    msg = jsondata?.message || jsondata?.error?.message || JSON.stringify(jsondata);
    data = jsondata?.data || jsondata?.error?.data || {};
  } catch {
    try {
      msg = await res.text();
    } catch {
      msg = "";
    }
  }

  // 🔒 401 未授權
  if (res.status === 401) {
    console.warn("⚠️ Unauthorized: redirecting to home page");

    if (typeof eventBus !== "undefined") {
      eventBus.emit("Unauthorized", { url: res.url });
    }

    try {
      sessionStorage.clear();
      localStorage.removeItem("user_session");
    } catch (err) {
      console.error("Failed to clear storage:", err);
    }

    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/user/")) {
        sessionStorage.clear();
        window.location.reload();
      }
    }

    throw {
      code: 401,
      message: "Unauthorized",
      data,
    };
  }

  // 🕓 429 過多請求
  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    const displayMsg =
      msg || `操作太頻繁，請稍後再試${retryAfter ? `（約 ${retryAfter} 秒後）` : ""}`;
    if (typeof eventBus !== "undefined") {
      eventBus.emit("RateLimitExceeded", { state: "TOO_BUSY", url: res.url });
    }

    throw {
      code: 429,
      message: displayMsg,
      data,
    };
  }

  // 其他 HTTP 錯誤
  throw {
    "status":"error",
    code: res.status,
    message: msg || `HTTP error ${res.status}`,
    data,
  };
}

