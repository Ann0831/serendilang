
import {eventBus} from "../utils/eventBus.js";


// /api/post_api.js


export async function testlogin() {
  console.log("[API:testlogin]");
  try {
    const response = await fetch("/api/auth/testlogin", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    await checkResOk(response);

    const data = await response.json();
    console.log("[API:testlogin] data:", data);
    return data;

  } catch (error) {
    handleNetworkError(error);
    console.error("[API:testlogin] error:", error);
    return { status: "error" };
  }
}


// ✅ 登出目前裝置
export async function logout() {
  console.log("[API:logout]");
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:logout] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:logout] error:", error);
    return { status: "error" };
  }
}

// ✅ 登出所有裝置
export async function logoutAll() {
  console.log("[API:logoutAll]");
  try {
    const response = await fetch("/api/auth/logout/all", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:logoutAll] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:logoutAll] error:", error);
    return { status: "error" };
  }
}

// ✅ 接受好友請求
export async function postAcceptFriendRequest(targetId) {
  try {
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
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postAcceptFriendRequest] error:", error);
    return { status: "error" };
  }
}

// ✅ 發送好友邀請
export async function postAddFriend(targetId) {
  try {
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
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postAddFriend] error:", error);
    return { status: "error" };
  }
}

// ✅ 檢查 username 是否存在
export async function postCheckUsernameExist(checkUserId) {
  try {
    const response = await fetch("/api/users/check-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ check_user_id: checkUserId }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postCheckUsernameExist] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postCheckUsernameExist] error:", error);
    return { status: "error" };
  }
}

// ✅ 刪除目前使用者帳號
export async function postDeleteAccount() {
  try {
    const response = await fetch("/api/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postDeleteAccount] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postDeleteAccount] error:", error);
    return { status: "error" };
  }
}

// ✅ 刪除貼文
export async function postDeletePost(postId) {
  try {
    const response = await fetch("/api/posts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postDeletePost] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postDeletePost] error:", error);
    return { status: "error" };
  }
}

// ✅ 建立新貼文
export async function postMakePost(imageFile, articleString) {
  try {
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
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postMakePost] error:", error);
    if (error && typeof error === "object") {
       return { status: "error", ...error };
    }
    return { status: "error", message: String(error) };

  }
}

// ✅ 發送訊息
export async function postMessage(targetId, message) {
  try {
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
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postMessage] error:", error);
    return { status: "error" };
  }
}


// ✅ 對貼文送讚
export async function postSendLike(postId) {
  try {
    const response = await fetch("/api/posts/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postSendLike] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postSendLike] error:", error);
    return { status: "error" };
  }
}

// ✅ 檢舉貼文
export async function postSendPostReport(postId, reason) {
  try {
    const response = await fetch("/api/reports/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, reason }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postSendPostReport] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postSendPostReport] error:", error);
    return { status: "error" };
  }
}

// ✅ 檢舉使用者
export async function postSendReportUser(targetId, reason, evidenceFile = null) {
  try {
    const formData = new FormData();
    formData.append("target_id", targetId);
    formData.append("reason", reason);
    if (evidenceFile) formData.append("file", evidenceFile);

    const response = await fetch("/api/reports/users", {
      method: "POST",
      body: formData,
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postSendReportUser] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postSendReportUser] error:", error);
    return { status: "error" };
  }
}

export async function postSetFriendRequestRead() {
  try {
    const response = await fetch("/api/friends/requests/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postSetFriendRequestRead] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postSetFriendRequestRead] error:", error);
    return { status: "error" };
  }
}



// ✅ 標記「接受好友通知」為已讀
export async function postSetAcceptFriendRead() {
  try {
    const response = await fetch("/api/friends/accepted/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postSetAcceptFriendRead] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postSetAcceptFriendRead] error:", error);
    return { status: "error" };
  }
}

// ✅ 測試登入狀態
export async function postTestLogin() {
  try {
    const response = await fetch("/api/auth/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postTestLogin] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postTestLogin] error:", error);
    return { status: "error" };
  }
}

// ✅ 登入
export async function postLogin(username, password) {
  try {
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
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postLogin] error:", error);
    return error;
  }
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

  try {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("hashed_password", hashed_password);
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
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postRegister] error:", error);
    return { status: "error", ...(typeof error === "object" && error ? error : {}) };

  }
}


// ✅ 取消貼文讚
export async function postUnsendLike(postId) {
  console.log("[API:postUnsendLike] postId:", postId);
  try {
    const response = await fetch("/api/posts/unlike", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postUnsendLike] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postUnsendLike] error:", error);
    return { status: "error" };
  }
}

// ✅ 更新語言設定
export async function updateUserLanguage(targetlanguage, nativelanguage) {
  try {
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
  } catch (err) {
    handleNetworkError(err);
    console.error("[API:updateUserLanguage] error:", err);
    return { status: "error" };
  }
}

// ✅ 更新使用者大頭貼
export async function modifyProfilePicture(file) {
  if (!file) throw new Error("No file provided");

  const formData = new FormData();
  formData.append("imagefile", file);

  try {
    const response = await fetch("/api/users/profile-picture/modify", {
      method: "POST",
      body: formData,
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:modifyProfilePicture] data:", data);
    return data;
  } catch (err) {
    handleNetworkError(err);
    console.error("[API:modifyProfilePicture] error:", err);
    return { status: "error" };
  }
}

// ✅ 將訊息標記為已讀
export async function setMessageRead(targetId) {
  try {
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
  } catch (err) {
    handleNetworkError(err);
    console.error("[API:setMessageRead] error:", err);
    return { status: "error" };
  }
}

// ✅ 封鎖使用者
export async function postUserBlock(targetId) {
  try {
    const response = await fetch("/api/users/blocks/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: targetId }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postUserBlock] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postUserBlock] error:", error);
    return { status: "error" };
  }
}

// ✅ 解除封鎖使用者
export async function postUserUnBlock(targetId) {
  try {
    const response = await fetch("/api/users/blocks/unblock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: targetId }),
    });
    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postUserUnBlock] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postUserUnBlock] error:", error);
    return { status: "error" };
  }
}

export async function postAnalyticsFirstOnlineList(onlineList, place) {
  try {
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
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postAnalyticsFirstOnlineList] error:", error);
    return { status: "error" };
  }
}


export async function postAnalyticsWssDisconnect(code, reason) {
  try {
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
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postAnalyticsWssDisconnect] error:", error);
    return { status: "error" };
  }
}



export async function markSystemUserNotificationAsRead(notification_id) {
  console.log("api/post_api.js markSystemUserNotificationAsRead: id=", notification_id);

  if (!notification_id) return { status: "error", message: "Missing notification_id" };

  let res;
  try {
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
  } catch (err) {
    console.error("markSystemUserNotificationAsRead error:", err);
    handleNetworkError(err);
    return err;
  }
}



export async function postDeleteProfilePicture() {
  try {
    const response = await fetch("/api/users/profile-picture/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postDeleteProfilePicture] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postDeleteProfilePicture] error:", error);
    return { status: "error" };
  }
}

export async function postApiAnalyticsIceDisconnected(call_id) {
  try {
    const response = await fetch("/api/analytics/IceDisconnected_handler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call_id }),
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postApiAnalyticsIceDisconnected] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postApiAnalyticsIceDisconnected] error:", error);
    return { status: "error" };
  }
}

export async function postApiUsersUpdateUsername(new_username) {
  try {
    const response = await fetch("/api/users/updateusername", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_username }),
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("[API:postApiUsersUpdateUsername] data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    console.error("[API:postApiUsersUpdateUsername] error:", error);
    if (error && typeof error === "object") {
      return {
        status: "error",
        ...(error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error),
      };
    } else {
      return { status: "error" };
    }

  
  }
}


// 🔹 清除 Google OAuth Cookie
export async function clearGoogleOauthCookie() {
  try {
    const response = await fetch('/api/auth/oauth/google/clear', {
      method: 'POST',
      credentials: 'include', // ✅ 確保能帶 cookie
    });

    await checkResOk(response);
    const data = await response.json();
    console.log("/api/api.js: clearGoogleOauthCookie: data:", data);
    return data;
  } catch (error) {
    handleNetworkError(error);
    return { status: "error" };
  }
}




function handleNetworkError(err) {
  if (err instanceof TypeError) {
    console.warn("網路錯誤，檢查連線狀態...");

    // ✔ 使用者真的離線（Wi-Fi/4G 斷線）
    if (!navigator.onLine) {
      console.error("偵測到離線");
      eventBus.emit("openNetworkBanner", { state: "USER_OFFLINE" });
      return;
    }

    // ✔ 使用者在線上 → 改成 fallback double-check
    console.error("網路連不上伺服器 (可能是 DNS / CORS / timeout)");
    fallbackDoubleCheck();
    return;

  } else {
    console.error("其他非網路錯誤:", err);
    fallbackDoubleCheck();
  }

  // ---------------------------
  // 🔽 下方是本函式內部的一個小 helper，不對外暴露
  // ---------------------------
  function fallbackDoubleCheck() {
    // 🔄 第一次檢查
    fetch("/", { method: "GET", cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          console.warn("[fallback-check] 第一次 fetch('/') → 回應非200");
          throw new Error("FirstFetchFailed");
        }
      })
      .catch(() => {
        console.warn("[fallback-check] 第一次 fetch('/') 失敗");

        // ⏳ 1 秒後第二次檢查
        setTimeout(() => {
          fetch("/", { method: "GET", cache: "no-store" })
            .then((res2) => {
              if (!res2.ok) {
                console.error("[fallback-check] 第二次 fetch('/') → 回應非200 → SERVER_UNREACHABLE");
                eventBus.emit("openNetworkBanner", { state: "SERVER_UNREACHABLE" });
              }
            })
            .catch(() => {
              console.error("[fallback-check] 第二次 fetch('/') 也失敗 → SERVER_UNREACHABLE");
              eventBus.emit("openNetworkBanner", { state: "SERVER_UNREACHABLE" });
            });
        }, 1000);
      });
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

