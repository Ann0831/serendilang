import { eventBus } from "../utils/eventBus.js";
import { mockDb, getCurrentUser, clone } from "./mock_db.js";
import { DEFAULT_AVATAR_URL, normalizeAvatarUrl } from "../utils/avatar.js";

function ok(data = {}) {
  return { status: "success", data };
}

function sleep(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureArrayField(key) {
  if (!Array.isArray(mockDb[key])) mockDb[key] = [];
  return mockDb[key];
}

function ensureObjectField(key) {
  if (!mockDb[key] || typeof mockDb[key] !== "object" || Array.isArray(mockDb[key])) mockDb[key] = {};
  return mockDb[key];
}

async function blobToDataUrl(blob) {
  if (!blob || typeof FileReader === "undefined") return "";
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    } catch {
      resolve("");
    }
  });
}

function ensureAuthState() {
  if (!mockDb.__auth || typeof mockDb.__auth !== "object") {
    mockDb.__auth = { loggedIn: true, googleOauthLinked: true, lastActionAt: Date.now() };
  }
  if (typeof mockDb.__auth.googleOauthLinked !== "boolean") {
    mockDb.__auth.googleOauthLinked = true;
  }
  return mockDb.__auth;
}

function isLoggedIn() {
  const auth = ensureAuthState();
  return auth.loggedIn !== false;
}

function requireAuthError() {
  if (isLoggedIn()) return null;
  return { status: "error", message: "not logged in" };
}

function currentUserOrNull() {
  if (!isLoggedIn()) return null;
  const user = getCurrentUser();
  if (!user || !user.user_id) return null;
  return user;
}

export async function testlogin() {
  await sleep();
  const auth = ensureAuthState();
  if (!auth.loggedIn) return ok({ state: "logout", identity: null });
  return ok({ state: "login", identity: clone(currentUserOrNull()) });
}

export async function logout() {
  await sleep();
  const auth = ensureAuthState();
  auth.loggedIn = false;
  auth.logoutAll = false;
  auth.lastActionAt = Date.now();
  return {
    status: "success",
    result: "success",
    message: "Logout successful",
    data: {
      state: "logout",
      logoutAll: false,
    },
  };
}

export async function logoutAll() {
  await sleep();
  const auth = ensureAuthState();
  auth.loggedIn = false;
  auth.lastActionAt = Date.now();
  auth.logoutAll = true;
  return {
    status: "success",
    result: "success",
    message: "All sessions logged out successfully",
    data: {
      state: "logout",
      logoutAll: true,
    },
  };
}

export async function postAcceptFriendRequest(targetId) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  if (!Array.isArray(mockDb.friends)) mockDb.friends = [];
  const existedIndex = mockDb.friends.indexOf(targetId);
  if (existedIndex >= 0) mockDb.friends.splice(existedIndex, 1);
  mockDb.friends.unshift(targetId);
  mockDb.friendRequests = mockDb.friendRequests.filter((id) => id !== targetId);
  if (Array.isArray(mockDb.sentFriendRequestIds)) {
    mockDb.sentFriendRequestIds = mockDb.sentFriendRequestIds.filter((id) => id !== targetId);
  }
  if (!Array.isArray(mockDb.unreadAcceptedFriendIds)) mockDb.unreadAcceptedFriendIds = [];
  if (!mockDb.unreadAcceptedFriendIds.includes(targetId)) {
    mockDb.unreadAcceptedFriendIds.unshift(targetId);
  }
  eventBus.emit("acceptFriendRequest:Complete", { target_id: targetId });
  return ok({ message: "Friend request accepted successfully" });
}

export async function postAddFriend(targetId) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  if (!Array.isArray(mockDb.sentFriendRequestIds)) mockDb.sentFriendRequestIds = [];
  if (!mockDb.sentFriendRequestIds.includes(targetId)) {
    mockDb.sentFriendRequestIds.push(targetId);
  }
  eventBus.emit("sendFriendRequest:Complete", { target_id: targetId });
  return ok({ message: "Friend request sent successfully" });
}

export async function postCheckUsernameExist(checkUserId) {
  await sleep();
  const username = String(checkUserId || "");
  const legal = /^[A-Za-z0-9_]{1,20}$/.test(username);
  if (!legal) return ok({ result: "illegal" });
  const exists = Object.values(mockDb.users).some((u) => u.username === username);
  return ok({ result: exists ? "used" : "available" });
}

export async function postDeleteAccount() {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  const me = currentUserOrNull();
  if (!me) return { status: "error", message: "no current user" };
  const meId = me.user_id;

  delete mockDb.users[meId];
  mockDb.friends = (mockDb.friends || []).filter((id) => id !== meId);
  mockDb.friendRequests = (mockDb.friendRequests || []).filter((id) => id !== meId);
  mockDb.blocks = (mockDb.blocks || []).filter((id) => id !== meId);
  delete mockDb.conversations?.[meId];
  delete mockDb.conversationMessages?.[meId];

  const postIdsToDelete = Object.values(mockDb.posts || {})
    .filter((p) => p?.author_id === meId)
    .map((p) => p.post_id)
    .filter(Boolean);
  postIdsToDelete.forEach((pid) => {
    delete mockDb.posts[pid];
    if (mockDb.postStats) delete mockDb.postStats[pid];
    if (mockDb.postComments) delete mockDb.postComments[pid];
  });
  mockDb.likedPostIds = (mockDb.likedPostIds || []).filter((pid) => !postIdsToDelete.includes(pid));
  mockDb.postReports = (mockDb.postReports || []).filter((r) => r?.author_id !== meId && r?.reporter_id !== meId);

  const fallbackId = Object.keys(mockDb.users || {})[0] || null;
  if (fallbackId) {
    mockDb.currentUserId = fallbackId;
    ensureAuthState().loggedIn = true;
  } else {
    ensureAuthState().loggedIn = false;
  }
  ensureAuthState().lastActionAt = Date.now();

  return ok({ result: "success" });
}

export async function postDeletePost(postId) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  if (!postId) return { status: "error", message: "post_id required" };
  delete mockDb.posts[postId];
  if (mockDb.postUploadedImages) delete mockDb.postUploadedImages[postId];
  if (mockDb.postStats) delete mockDb.postStats[postId];
  if (mockDb.postComments) delete mockDb.postComments[postId];
  mockDb.likedPostIds = (mockDb.likedPostIds || []).filter((id) => id !== postId);
  mockDb.postReports = (mockDb.postReports || []).filter((x) => x?.post_id !== postId);
  return ok({ result: "success" });
}

export async function postMakePost(imageFile, articleString) {
  await sleep();
  const current = currentUserOrNull();
  if (!current) return { status: "error", message: "not logged in" };

  const id = `p${Object.keys(mockDb.posts || {}).length + 1}`;
  const uploadedImages = ensureObjectField("postUploadedImages");
  const imageDataUrl = await blobToDataUrl(imageFile);
  const imageUrl = imageDataUrl || "";

  if (imageUrl) {
    uploadedImages[id] = {
      post_id: id,
      image_url: imageUrl,
      image_data: imageDataUrl,
      mime_type: imageFile?.type || "",
      size: Number(imageFile?.size || 0),
      uploaded_at: new Date().toISOString(),
    };
  } else {
    delete uploadedImages[id];
  }

  mockDb.posts[id] = {
    post_id: id,
    author_id: mockDb.currentUserId,
    author_name: current.username,
    username: current.username,
    title: "",
    article: articleString || "",
    created_at: new Date().toISOString(),
    image_url: imageUrl,
    like_count: 0,
  };
  eventBus.emit("postMakePost:Complete", {});
  return ok({ result: "success" });
}

export async function postMessage(targetId, message) {
  await sleep(300);
  const authError = requireAuthError();
  if (authError) return authError;
  if (!targetId) return { status: "error", message: "target_id required" };
  const nowIso = new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  const nextSeq = (mockDb.conversationMessages?.[targetId]?.length || 0) + 1;
  const entry = {
    processed_message_id: `m_${targetId}_${nextSeq}`,
    sender_id: mockDb.currentUserId,
    messageText: message || "",
    timestamp: nowIso,
    timestamp_ms: nowMs,
  };
  if (!mockDb.conversationMessages) mockDb.conversationMessages = {};
  if (!Array.isArray(mockDb.conversationMessages[targetId])) {
    mockDb.conversationMessages[targetId] = [];
  }
  mockDb.conversationMessages[targetId].push(entry);

  mockDb.conversations[targetId] = {
    other_user: { user_id: targetId, username: mockDb.users[targetId]?.username || targetId },
    messageText: message || "",
    timestamp: nowIso,
    sender_id: mockDb.currentUserId,
    is_read: 1,
  };
  eventBus.emit("sendMessage:Complete", { target_id: targetId });
  return ok({
    message_id: entry.processed_message_id,
  });
}

export async function postSendLike(postId) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  if (!mockDb.likedPostIds.includes(postId)) mockDb.likedPostIds.push(postId);
  if (mockDb.posts[postId]) mockDb.posts[postId].like_count += 1;
  return ok({ result: "success" });
}

export async function postSendPostReport(postId, reason) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  mockDb.postReports.push({ post_id: postId, reason, reported_at: new Date().toISOString() });
  return ok({ result: "success" });
}

export async function postSendReportUser(targetId, reason, evidenceFile = null) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  const reports = ensureArrayField("userReports");
  reports.push({
    report_id: `ru_${reports.length + 1}`,
    reporter_id: mockDb.currentUserId,
    target_id: targetId,
    reason: reason || "",
    evidence_filename: evidenceFile?.name || "",
    reported_at: new Date().toISOString(),
  });
  return ok({ result: "success" });
}

export async function postSetFriendRequestRead() {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  const reads = ensureObjectField("friendRequestReads");
  (mockDb.friendRequests || []).forEach((id) => {
    reads[id] = true;
  });
  return ok({ message: "Marked friend requests as read" });
}

export async function postSetAcceptFriendRead() {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  mockDb.unreadAcceptedFriendIds = [];
  return ok({ message: "Marked accepted friends as read" });
}

export async function postTestLogin() {
  return testlogin();
}

export async function postLogin(username, _password) {
  await sleep();
  const user = Object.values(mockDb.users).find((u) => u.username === username);
  if (!user) return { status: "error", loginstate: "fail", message: "user not found" };
  mockDb.currentUserId = user.user_id;
  const auth = ensureAuthState();
  auth.loggedIn = true;
  auth.lastActionAt = Date.now();
  return ok({ loginstate: "success" });
}

export async function postRegister(
  username,
  _hashed_password,
  nativelanguage,
  targetlanguage,
  profilePicFile,
  inviteCode,
  agree_terms,
  agree_privacy,
) {
  await sleep();
  if (!agree_terms || !agree_privacy) {
    return { status: "error", message: "You must agree to both the Terms of Service and Privacy Policy." };
  }
  if (!inviteCode || !String(inviteCode).trim()) {
    return { status: "error", message: "Invalid invitation code" };
  }
  const legal = /^[A-Za-z0-9_]{1,20}$/.test(String(username || ""));
  if (!legal) {
    return { status: "error", message: "Invalid username format" };
  }
  const exists = Object.values(mockDb.users).some((u) => u.username === username);
  if (exists) {
    return { status: "error", message: "Username already taken" };
  }
  const id = `u${Object.keys(mockDb.users).length + 1}`;
  const avatarDataUrl = await blobToDataUrl(profilePicFile);
  const profilePicUrl = normalizeAvatarUrl(avatarDataUrl || DEFAULT_AVATAR_URL);
  mockDb.users[id] = {
    user_id: id,
    username: username || id,
    nativelanguage: nativelanguage || "?",
    targetlanguage: targetlanguage || "?",
    profile_picture_url: profilePicUrl,
    realtime_status: "online",
  };
  const auth = ensureAuthState();
  auth.loggedIn = true;
  auth.lastActionAt = Date.now();
  return ok({ user_id: id });
}

export async function postUnsendLike(postId) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  mockDb.likedPostIds = mockDb.likedPostIds.filter((id) => id !== postId);
  if (mockDb.posts[postId]) mockDb.posts[postId].like_count = Math.max(0, mockDb.posts[postId].like_count - 1);
  return ok({ result: "success" });
}

export async function updateUserLanguage(targetlanguage, nativelanguage) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  const user = getCurrentUser();
  user.targetlanguage = targetlanguage || user.targetlanguage;
  user.nativelanguage = nativelanguage || user.nativelanguage;
  return ok({ result: "success" });
}

export async function modifyProfilePicture(file) {
  await sleep();
  const me = currentUserOrNull();
  if (!me) return { status: "error", message: "not logged in" };

  const avatarPool = ensureObjectField("userUploadedAvatars");
  const avatarDataUrl = await blobToDataUrl(file);
  const imageUrl = avatarDataUrl || "";
  if (!imageUrl) {
    return { status: "error", message: "invalid image file" };
  }

  avatarPool[me.user_id] = {
    user_id: me.user_id,
    image_url: imageUrl,
    image_data: avatarDataUrl,
    mime_type: file?.type || "",
    size: Number(file?.size || 0),
    uploaded_at: new Date().toISOString(),
  };
  me.profile_picture_url = imageUrl;
  return ok({ result: "success" });
}

export async function setMessageRead(targetId) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  let affected = 0;
  if (mockDb.conversations[targetId] && mockDb.conversations[targetId].is_read !== 1) {
    mockDb.conversations[targetId].is_read = 1;
    affected = 1;
  }
  return ok({
    result: "success",
    affected,
    message: affected > 0 ? `Marked ${affected} messages as read` : "No unread messages found",
  });
}

export async function postUserBlock(targetId) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  if (!mockDb.blocks.includes(targetId)) mockDb.blocks.push(targetId);
  return ok({ result: "success" });
}

export async function postUserUnBlock(targetId) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  mockDb.blocks = mockDb.blocks.filter((id) => id !== targetId);
  return ok({ result: "success" });
}

export async function postAnalyticsFirstOnlineList(_onlineList, _place) {
  await sleep();
  const logs = ensureArrayField("analyticsLogs");
  logs.push({
    type: "FirstOnlineList",
    online_list: Array.isArray(_onlineList) ? [..._onlineList] : [],
    place: _place || "",
    created_at: new Date().toISOString(),
  });
  return ok({ message: "FirstOnlineList log created successfully", log_id: logs.length });
}

export async function postAnalyticsWssDisconnect(_code, _reason) {
  await sleep();
  const logs = ensureArrayField("analyticsLogs");
  logs.push({
    type: "WssDisconnect",
    code: _code,
    reason: _reason,
    created_at: new Date().toISOString(),
  });
  return ok({ message: "WSS disconnect recorded" });
}

export async function markSystemUserNotificationAsRead(notification_id) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  const n = mockDb.systemNotifications.find((x) => x.notification_id === notification_id);
  if (n) n.is_read = true;
  return ok({ message: "Marked as read" });
}

export async function postDeleteProfilePicture() {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  const me = getCurrentUser();
  const avatarPool = ensureObjectField("userUploadedAvatars");
  if (me?.user_id) delete avatarPool[me.user_id];
  me.profile_picture_url = DEFAULT_AVATAR_URL;
  return ok({ result: "success" });
}

export async function postApiCallsInit(target_id, use_camera, is_caller) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;

  const current = getCurrentUser();
  if (!target_id || typeof target_id !== "string") {
    return { status: "error", message: "Invalid target_id" };
  }

  const fakeCallId = `mock_${Date.now()}`;
  return ok({
    is_caller: !!is_caller,
    current_user_id: current?.user_id || "u1",
    target_id,
    use_camera: use_camera ? "1" : "0",
    call_id: fakeCallId,
    turn_auth: { username: "mock-turn-user", credential: "mock-turn-cred" },
    rtc_config: {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      iceTransportPolicy: "all",
    },
    only_stun_rtc_config: {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      iceTransportPolicy: "all",
    },
    only_turn_rtc_config: {
      iceServers: [],
      iceTransportPolicy: "all",
    },
    only_external_rtc_config: {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      iceTransportPolicy: "all",
    },
  });
}

export async function postApiAnalyticsIceDisconnected(_call_id) {
  await sleep();
  const logs = ensureArrayField("analyticsLogs");
  logs.push({
    type: "IceDisconnected",
    call_id: _call_id,
    created_at: new Date().toISOString(),
  });
  return ok({ message: "ICE disconnected recorded" });
}

export async function postApiUsersUpdateUsername(new_username) {
  await sleep();
  const authError = requireAuthError();
  if (authError) return authError;
  if (!new_username || typeof new_username !== "string") {
    return { status: "error", message: "Invalid parameter: new_username" };
  }
  getCurrentUser().username = new_username;
  return ok({ result: "success" });
}

export async function clearGoogleOauthCookie() {
  await sleep();
  const auth = ensureAuthState();
  auth.googleOauthLinked = false;
  auth.lastActionAt = Date.now();
  return ok({ message: "GoogleOauthData cookie cleared" });
}

export async function checkResOk(res) {
  return res;
}

export async function setTestLoginState(loggedIn = false) {
  await sleep();
  const auth = ensureAuthState();
  auth.loggedIn = !!loggedIn;
  auth.lastActionAt = Date.now();
  return ok({ ignored: true });
}
