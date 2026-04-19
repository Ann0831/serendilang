import { mockDb, getCurrentUser, listOnlineUsers, clone } from "./mock_db.js";
import { DEFAULT_AVATAR_URL, normalizeAvatarUrl } from "../utils/avatar.js";

function ok(data) {
  return { status: "success", data };
}

function fail(message = "mock error") {
  return { status: "error", message };
}

function sleep(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MESSAGE_API_DELAY_MS = 500;

function isLoggedIn() {
  return !(mockDb.__auth && mockDb.__auth.loggedIn === false);
}

function requireAuth() {
  if (isLoggedIn()) return null;
  return fail("not logged in");
}

export async function getUnreadMessageCount() {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  const blocked = new Set(Array.isArray(mockDb.blocks) ? mockDb.blocks : []);
  const unread = Object.entries(mockDb.conversations || {}).filter(([uid, conv]) => {
    if (blocked.has(uid)) return false;
    return conv?.sender_id !== mockDb.currentUserId && conv?.is_read !== 1;
  }).length;
  return ok(unread);
}

export async function getUnreadFriendRequestCount() {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  const reads = mockDb.friendRequestReads || {};
  const unread = (mockDb.friendRequests || []).filter((id) => reads[id] !== true).length;
  return ok(unread);
}

export async function getFriendsList() {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  const unreadAccepted = new Set(Array.isArray(mockDb.unreadAcceptedFriendIds) ? mockDb.unreadAcceptedFriendIds : []);
  return ok(
    (mockDb.friends || []).map((id) => ({
      user_id: id,
      username: mockDb.users[id]?.username || id,
      nativelanguage: mockDb.users[id]?.nativelanguage || null,
      targetlanguage: mockDb.users[id]?.targetlanguage || null,
      is_read: !unreadAccepted.has(id),
    })),
  );
}

export async function getPostSuggest() {
  await sleep();
  return ok(Object.keys(mockDb.posts).map((post_id) => ({ post_id, author_id: mockDb.posts[post_id].author_id })));
}

export async function fetchMessages(target_id, amount = 20) {
  await sleep(MESSAGE_API_DELAY_MS);
  const authError = requireAuth();
  if (authError) return authError;
  if (!target_id) return fail("target_id required");
  const history = Array.isArray(mockDb.conversationMessages?.[target_id])
    ? mockDb.conversationMessages[target_id]
    : [];
  const normalizedAmount =
    amount === "all"
      ? "all"
      : (Number.isFinite(Number(amount)) && Number(amount) > 0 ? Number(amount) : 20);
  if (history.length > 0) {
    const list = clone(normalizedAmount === "all" ? history : history.slice(-normalizedAmount)).map((msg) => ({
      ...msg,
      receiver_id: msg?.receiver_id || target_id,
      counterpart_id: msg?.counterpart_id || target_id,
      message_id: msg?.message_id || "",
    }));
    return ok(list);
  }
  const conv = mockDb.conversations[target_id];
  const row = conv
    ? [{
        processed_message_id: `m_${target_id}_fallback`,
        sender_id: conv.sender_id,
        receiver_id: target_id,
        counterpart_id: target_id,
        messageText: conv.messageText,
        timestamp: conv.timestamp,
        timestamp_ms: Date.parse(conv.timestamp) || Date.now(),
        message_id: "",
      }]
    : [];
  return ok(clone(normalizedAmount === "all" ? row : row.slice(-normalizedAmount)));
}

export async function getProfilePictureUrl(targetId) {
  await sleep();
  const user = mockDb.users[targetId] || getCurrentUser();
  return ok(normalizeAvatarUrl(user?.profile_picture_url || DEFAULT_AVATAR_URL));
}

export async function getPostById(post_id) {
  await sleep();
  const post = mockDb.posts[post_id];
  if (!post) return fail("post not found");
  const stats = mockDb.postStats?.[post_id] || {};
  const comments = mockDb.postComments?.[post_id] || [];
  return ok({
    ...clone(post),
    ...clone(stats),
    comments_preview: clone(comments.slice(0, 2)),
    latest_comment: comments.length > 0 ? clone(comments[comments.length - 1]) : null,
  });
}

export async function getRequestedFriendData() {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  const reads = mockDb.friendRequestReads || {};
  return ok(
    mockDb.friendRequests.map((id) => ({
      sender_id: id,
      sender_name: mockDb.users[id]?.username || id,
      username: mockDb.users[id]?.username || id,
      nativelanguage: mockDb.users[id]?.nativelanguage || "?",
      targetlanguage: mockDb.users[id]?.targetlanguage || "?",
      is_read: reads[id] === true,
      language: {
        nativelanguage: mockDb.users[id]?.nativelanguage || "?",
        targetlanguage: mockDb.users[id]?.targetlanguage || "?",
      },
    }))
  );
}

export async function getSpecificMessageScreen(target_id) {
  await sleep(MESSAGE_API_DELAY_MS);
  const authError = requireAuth();
  if (authError) return authError;
  const conv = mockDb.conversations[target_id];
  if (!conv) return fail("conversation not found");
  return ok({
    ...clone(conv),
    id: "",
    message_id: "",
    encrypted_message: "",
    receiver_id: conv?.receiver_id || target_id,
  });
}

export async function getUnreadAcceptFriendCount() {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  return ok(Array.isArray(mockDb.unreadAcceptedFriendIds) ? mockDb.unreadAcceptedFriendIds.length : 0);
}

export async function getAllMessagesScreen() {
  await sleep(MESSAGE_API_DELAY_MS);
  const authError = requireAuth();
  if (authError) return authError;
  return ok(
    clone(Object.values(mockDb.conversations)).map((conv) => ({
      ...conv,
      id: "",
      message_id: "",
      encrypted_message: "",
    })),
  );
}

export async function getCurrentUserIdentity() {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  return ok(clone(getCurrentUser()));
}

export async function getGlobalPostsSuggest() {
  await sleep();
  return ok(Object.keys(mockDb.posts).map((post_id) => ({ post_id, author_id: mockDb.posts[post_id].author_id })));
}

export async function getPotentialFriends() {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  const current = mockDb.currentUserId;
  const blocked = new Set(mockDb.blocks);
  const friends = new Set(mockDb.friends);
  const sent = new Set(Array.isArray(mockDb.sentFriendRequestIds) ? mockDb.sentFriendRequestIds : []);
  const arr = Object.values(mockDb.users).filter((u) => (
    u.user_id !== current
    && !blocked.has(u.user_id)
    && !friends.has(u.user_id)
    && !sent.has(u.user_id)
  ));
  return ok(arr.map((u) => ({
    user_id: u.user_id,
    username: u.username,
    nativelanguage: u.nativelanguage || null,
    targetlanguage: u.targetlanguage || null,
  })));
}

export async function getUserLanguage(target_id) {
  await sleep();
  const user = mockDb.users[target_id];
  if (!user) return fail("user not found");
  return ok({ targetlanguage: user.targetlanguage, nativelanguage: user.nativelanguage });
}

export async function getUserAllPostIds(target_id) {
  await sleep();
  const ids = Object.values(mockDb.posts)
    .filter((p) => p.author_id === target_id)
    .sort((a, b) => {
      const ta = Date.parse(a?.created_at || "") || 0;
      const tb = Date.parse(b?.created_at || "") || 0;
      return tb - ta; // newest -> oldest
    })
    .map((p) => p.post_id);
  return ok(ids);
}

export async function getUsernameById(target_id) {
  await sleep();
  return ok(mockDb.users[target_id]?.username || "Unknown");
}

export async function getUserLikePost(postId) {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  return ok(mockDb.likedPostIds.includes(postId));
}

export async function getUserBlockList() {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  return ok(clone(mockDb.blocks));
}

export async function apiGetFriendshipStatus(targetId) {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  const isFriend = Array.isArray(mockDb.friends) && mockDb.friends.includes(targetId);
  const hasOutgoingRequest = Array.isArray(mockDb.sentFriendRequestIds) && mockDb.sentFriendRequestIds.includes(targetId);
  const hasIncomingRequest = Array.isArray(mockDb.friendRequests) && mockDb.friendRequests.includes(targetId);

  if (isFriend) {
    return ok({ in: { state: "friend" }, out: { state: "friend" } });
  }
  if (hasOutgoingRequest) {
    return ok({ in: { state: "none" }, out: { state: "requested" } });
  }
  if (hasIncomingRequest) {
    return ok({ in: { state: "requested" }, out: { state: "none" } });
  }
  return ok({ in: { state: "none" }, out: { state: "none" } });
}

export async function getMyPostReports() {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  return ok(clone(mockDb.postReports));
}

export async function checkUsernameAvailability(username) {
  await sleep();
  const checkName = String(username || "");
  const legal = /^[A-Za-z0-9_]{1,20}$/.test(checkName);
  if (!legal) return ok({ result: "illegal" });
  const exists = Object.values(mockDb.users).some((u) => u.username === checkName);
  return ok({ result: exists ? "used" : "available" });
}

export async function getUserRealtimeStatus(targetId) {
  await sleep();
  // keep realtime_status in sync with 10s random online pool
  listOnlineUsers();
  return ok({ state: mockDb.users[targetId]?.realtime_status || "offline" });
}

export async function getRealtimeOnlineList() {
  await sleep();
  return ok(listOnlineUsers());
}

export async function getUnreadSystemUserNotifications() {
  await sleep();
  const authError = requireAuth();
  if (authError) return authError;
  return ok(mockDb.systemNotifications.filter((n) => !n.is_read));
}

export async function getGoogleOauthStatus() {
  await sleep();
  const auth = mockDb.__auth || {};
  const linked = auth.googleOauthLinked !== false;
  if (!linked) {
    return { status: "error", message: "Google oauth not linked" };
  }

  const current = getCurrentUser() || {};
  const username = String(current.username || "tester_one").trim() || "tester_one";
  const safe = username.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "tester_one";
  const fakeEmail = `${safe}@gmail.com`;
  return ok({
    email: fakeEmail,
    name: username,
    picture: normalizeAvatarUrl(current.profile_picture_url || DEFAULT_AVATAR_URL),
    email_verified: true,
    hasIdToken: true,
    exp_readable: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
}

export async function checkResOk(res) {
  return res;
}
