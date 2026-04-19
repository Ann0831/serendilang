
import {eventBus} from "../utils/eventBus.js";


// /api/post_api.js


export async function testlogin() {
  console.log("[API:testlogin]");
  
    const response = await fetch("/api/auth/testlogin", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    await checkResOk(response);

    const data = await response.json();
    console.log("[API:testlogin] data:", data);
    return data;

  
}


// ✅ 登出目前裝置
export async function logout() {
  console.log("[API:logout]");
  
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:logout] data:", data);
    return data;
  
}

// ✅ 登出所有裝置
export async function logoutAll() {
  console.log("[API:logoutAll]");
  
    const response = await fetch("/api/auth/logout/all", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:logoutAll] data:", data);
    return data;
  
}

// ✅ 接受好友請求
export async function postAcceptFriendRequest(targetId) {
  
    const response = await fetch(
      `/api/friends/requests/accept?target_id=${encodeURIComponent(targetId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postAcceptFriendRequest] data:", data);
    eventBus.emit("acceptFriendRequest:Complete", { target_id: targetId });
    return data;
  
}

// ✅ 發送好友邀請
export async function postAddFriend(targetId) {
  
    const response = await fetch(
      `/api/friends/requests?target_id=${encodeURIComponent(targetId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postAddFriend] data:", data);
    eventBus.emit("sendFriendRequest:Complete", { target_id: targetId });
    return data;
  
}

// ✅ 檢查 username 是否存在
export async function postCheckUsernameExist(checkUserId) {
  
    const response = await fetch(
      `/api/users/check-username?check_username=${encodeURIComponent(checkUserId)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postCheckUsernameExist] data:", data);
    return data;
  
}

// ✅ 刪除目前使用者帳號
export async function postDeleteAccount() {
  
    const response = await fetch("/api/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postDeleteAccount] data:", data);
    return data;
  
}

// ✅ 刪除貼文
export async function postDeletePost(postId) {
  
    const response = await fetch("/api/posts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postDeletePost] data:", data);
    return data;
  
}

// ✅ 建立新貼文
export async function postMakePost(imageFile, articleString) {
  
    const formData = new FormData();
    formData.append("articleString", articleString);
    if (imageFile) {
      formData.append("imageFile", imageFile);
    }
    
    const response = await fetch("/api/posts/create", {
      method: "POST",
      body: formData,
    });
    await checkResOk(response);
    const data = await response.json();
    eventBus.emit("postMakePost:Complete", {});

    console.log("[API:postMakePost] data:", data);
    return data;
  
}

// ✅ 發送訊息
export async function postMessage(targetId, message) {
  
    const response = await fetch("/api/messages/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: targetId, message }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postMessage] data:", data);

    
    eventBus.emit("sendMessage:Complete", { target_id: targetId });
    
    return data;
  
}


// ✅ 對貼文送讚
export async function postSendLike(postId) {
  
    const response = await fetch("/api/posts/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postSendLike] data:", data);
    return data;
  
}

// ✅ 檢舉貼文
export async function postSendPostReport(postId, reason) {
  
    const response = await fetch("/api/reports/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, reason }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postSendPostReport] data:", data);
    return data;
  
}

// ✅ 檢舉使用者
export async function postSendReportUser(targetId, reason, evidenceFile = null) {
  
    const formData = new FormData();
    formData.append("target_id", targetId);
    formData.append("reason", reason);
    if (evidenceFile) formData.append("evidencepicture", evidenceFile);

    const response = await fetch("/api/reports/users", {
      method: "POST",
      body: formData,
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postSendReportUser] data:", data);
    return data;
  
}

export async function postSetFriendRequestRead() {
  
    const response = await fetch("/api/friends/requests/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postSetFriendRequestRead] data:", data);
    return data;
  
}



// ✅ 標記「接受好友通知」為已讀
export async function postSetAcceptFriendRead() {
  
    const response = await fetch("/api/friends/accepted/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postSetAcceptFriendRead] data:", data);
    return data;
  
}

// ✅ 測試登入狀態
export async function postTestLogin() {
  
    const response = await fetch("/api/auth/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postTestLogin] data:", data);
    return data;
  
}

// ✅ 登入
export async function postLogin(username, password) {
  
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postLogin] data:", data);
    return data;
  
}

// ✅ 註冊
export async function postRegister(
  username,
  hashed_password,
  nativelanguage,
  targetlanguage,
  profilePicFile,
  inviteCode,
  agree_terms,
  agree_privacy
) {
  console.log("[API:postRegister] 🧾 Register form preview:");
  console.log("  username:", username || "(empty)");
  console.log(
    "  hashed_password:",
    hashed_password ? hashed_password.slice(0, 16) + "..." : "(empty)"
  );
  console.log("  nativelanguage:", nativelanguage || "(empty)");
  console.log("  targetlanguage:", targetlanguage || "(empty)");
  console.log("  inviteCode:", inviteCode || "(empty)");
  console.log(
    "  profilePicFile:",
    profilePicFile ? `${profilePicFile.name} (${profilePicFile.size} bytes)` : "(no file selected)"
  );

  
    const formData = new FormData();
    formData.append("username", username);
    if (typeof hashed_password === "string" && hashed_password.length > 0) {
      formData.append("hashed_password", hashed_password);
    }
    if (nativelanguage) formData.append("nativelanguage", nativelanguage);
    if (targetlanguage) formData.append("targetlanguage", targetlanguage);
    if (inviteCode) formData.append("inviteCode", inviteCode);
    if (profilePicFile) formData.append("profilePicFile", profilePicFile);
    if (agree_terms) formData.append("agree_terms", agree_terms);
    if (agree_privacy) formData.append("agree_privacy", agree_privacy);
    console.log("[API:postRegister] formData entries:");
    for (const [key, value] of formData.entries()) {
      console.log("  ", key, "→", value);
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postRegister] data:", data);
    return data;
  
}


// ✅ 取消貼文讚
export async function postUnsendLike(postId) {
  console.log("[API:postUnsendLike] postId:", postId);
  
    const response = await fetch("/api/posts/unlike", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postUnsendLike] data:", data);
    return data;
  
}

// ✅ 更新語言設定
export async function updateUserLanguage(targetlanguage, nativelanguage) {
  
    const res = await fetch("/api/users/language/modify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ targetlanguage, nativelanguage }),
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("[API:updateUserLanguage] data:", data);
    return data;
  
}

// ✅ 更新使用者大頭貼
export async function modifyProfilePicture(file) {
  if (!file) throw new Error("No file provided");

  const formData = new FormData();
  formData.append("imagefile", file);

  
    const response = await fetch("/api/users/profile-picture/modify", {
      method: "POST",
      body: formData,
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:modifyProfilePicture] data:", data);
    return data;
  
}

// ✅ 將訊息標記為已讀
export async function setMessageRead(targetId) {
  
    const res = await fetch("/api/messages/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ target_id: targetId }),
    });
    await checkResOk(res);
    const data = await res.json();
    console.log("[API:setMessageRead] data:", data);
    return data;
  
}

// ✅ 封鎖使用者
export async function postUserBlock(targetId) {
  
    const response = await fetch("/api/users/blocks/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: targetId }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postUserBlock] data:", data);
    return data;
  
}

// ✅ 解除封鎖使用者
export async function postUserUnBlock(targetId) {
  
    const response = await fetch("/api/users/blocks/unblock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: targetId }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postUserUnBlock] data:", data);
    return data;
  
}

export async function postAnalyticsFirstOnlineList(onlineList, place) {
  
    // 收集螢幕資訊（包成一個 object）
    const screenInfo = {
      window_width: window.innerWidth,
      window_height: window.innerHeight,
      screen_width: screen.width,
      screen_height: screen.height,
    };

    const response = await fetch("/api/analytics/FirstOnlineList", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        online_list: onlineList,
        place,          // 由前端指定 "page" / "sidebar" / "popup" 等
        ...screenInfo,  // 展開螢幕資訊
      }),
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postAnalyticsFirstOnlineList] data:", data);
    return data;
  
}


export async function postAnalyticsWssDisconnect(code, reason) {
  
    const response = await fetch("/api/analytics/WssDisconnect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        reason,
      }),
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postAnalyticsWssDisconnect] data:", data);
    return data;
  
}



export async function markSystemUserNotificationAsRead(notification_id) {
  console.log("api/post_api.js markSystemUserNotificationAsRead: id=", notification_id);

  if (!notification_id) return { status: "error", message: "Missing notification_id" };

  let res;
  
    res = await fetch("/api/system-user-notifications/mark-read", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notification_id }),
    });

    await checkResOk(res);

    const data = await res.json();
    console.log("api/post_api.js markSystemUserNotificationAsRead: data:", data);

    return data;
  
}



export async function postDeleteProfilePicture() {
  
    const response = await fetch("/api/users/profile-picture/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postDeleteProfilePicture] data:", data);
    return data;
  
}

export async function postApiCallsInit(target_id, use_camera, is_caller) {
  
    const response = await fetch("/api/calls/init", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id, use_camera, is_caller }),
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postApiCallsInit] data:", data);
    return data;
  
}

export async function postApiAnalyticsIceDisconnected(call_id) {
  
    const response = await fetch("/api/analytics/IceDisconnected_handler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call_id }),
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postApiAnalyticsIceDisconnected] data:", data);
    return data;
  
}

export async function postApiUsersUpdateUsername(new_username) {
  
    const response = await fetch("/api/users/updateusername", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_username }),
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postApiUsersUpdateUsername] data:", data);
    return data;
  
}


// 🔹 清除 Google OAuth Cookie
export async function clearGoogleOauthCookie() {
  
    const response = await fetch('/api/auth/oauth/google/clear', {
      method: 'POST',
      credentials: 'include', // ✅ 確保能帶 cookie
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("/api/api.js: clearGoogleOauthCookie: data:", data);
    return data;
  
}




export async function checkResOk(res) {
  if (res.ok) {
    eventBus.emit("networkConnected", { from: "post_api/checkResOk" });
    return res;
  }

  let msg = "";
  let data = {}; // ✅ 先宣告避免未定義

  const jsondata = await res
    .clone()
    .json()
    .catch(() => null);
  if (jsondata) {
    msg = jsondata?.message || jsondata?.error?.message || JSON.stringify(jsondata);
    data = jsondata?.data || jsondata?.error?.data || {};
  } else {
    msg = await res
      .text()
      .catch(() => "");
  }

  // 🔒 401 未授權
  if (res.status === 401) {
    console.warn("⚠️ Unauthorized: redirecting to home page");

    if (typeof eventBus !== "undefined") {
      eventBus.emit("Unauthorized", { url: res.url });
    }

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("user_session");
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

export async function setTestLoginState(_loggedIn = false) {
  return { status: "success", data: { ignored: true } };
}
