import React from "react";
import { createRoot } from "react-dom/client";
import { getUserProfile } from "../service/getUserProfile.js";
import { getUserPosts } from "../service/getUserPosts.js";
import { getPostCardData } from "../service/postCardData.js";
import { updateState } from "../utils/uiStateAdapter.js";
import { eventBus } from "../utils/eventBus.js";
import UserProfilePage from "../ui/pages/UserProfilePage.jsx";

const STATE_ID = "UserProfilePage";
const DEFAULT_AVATAR = `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`;

let profileRoot = null;
let mounted = false;
let currentUserPageId = "";
let userProfilePostIds = [];
let loadedPostsAmount = 0;
let loadingUserProfilePostsLock = false;
let profileLoading = false;
let profile = null;
let visiblePostIds = [];
let postDetailsById = {};
let _detailJobVersion = 0;
let isLogin = true;
let _friendEventsBound = false;

function bindFriendRequestCompletionEvents() {
  if (_friendEventsBound) return;
  _friendEventsBound = true;

  eventBus.on("sendFriendRequest:Complete", async (params = {}) => {
    const targetId = String(params?.target_id || "");
    if (!targetId || targetId !== String(currentUserPageId || "")) return;
    await refreshUserProfileOnly();
  });

  eventBus.on("acceptFriendRequest:Complete", async (params = {}) => {
    const targetId = String(params?.target_id || "");
    if (!targetId || targetId !== String(currentUserPageId || "")) return;
    await refreshUserProfileOnly();
  });
}

function readUserProfileContext() {
  const ctx = window.__USER_PROFILE_CONTEXT__ || {};
  return {
    isLogin: ctx?.isLogin !== false,
    userId: String(ctx?.userId || "").trim(),
  };
}

function ensureMountNode() {
  let host = document.getElementById("user_profile_pages");
  if (!host) {
    host = document.createElement("main");
    host.id = "user_profile_pages";
    host.className = "w-full min-h-screen pt-16 bg-gray-50 text-gray-900";
    document.body.appendChild(host);
  }
  return host;
}

function ensureMounted() {
  const host = ensureMountNode();
  if (!profileRoot) {
    profileRoot = createRoot(host);
  }
  profileRoot.render(React.createElement(UserProfilePage));
}

function syncUserProfilePageState() {
  updateState(STATE_ID, {
    mounted,
    isLogin,
    currentUserPageId,
    userProfilePostIds,
    loadedPostsAmount,
    loadingUserProfilePostsLock,
    profileLoading,
    profile,
    visiblePostIds,
    postDetailsById,
    hasMore: loadedPostsAmount < userProfilePostIds.length,
  });
}

function _nextDetailJobVersion() {
  _detailJobVersion += 1;
  return _detailJobVersion;
}

function _isCurrentDetailJob(version) {
  return version === _detailJobVersion;
}

function _setPostDetail(postId, patch) {
  postDetailsById = {
    ...postDetailsById,
    [postId]: {
      ...(postDetailsById?.[postId] || {}),
      ...patch,
    },
  };
  syncUserProfilePageState();
}

function _getPendingVisiblePostIds() {
  const visibleSet = new Set(Array.isArray(visiblePostIds) ? visiblePostIds : []);
  return Object.entries(postDetailsById || {})
    .filter(([postId]) => visibleSet.has(postId))
    .filter(([, detail]) => detail?.status !== "ready" && detail?.status !== "error")
    .map(([postId]) => postId);
}

function _normalizePostData(raw, postId) {
  return {
    post_id: String(raw?.post_id || postId || ""),
    author_id: String(raw?.author_id || currentUserPageId || ""),
    author_name: String(raw?.author_name || profile?.username || "Unknown"),
    content: String(raw?.content || raw?.article || ""),
    created_at: raw?.created_at || "",
    image_url: raw?.image_url || "",
    like_count: Number.isFinite(Number(raw?.like_count)) ? Number(raw.like_count) : 0,
    userlikeit: !!raw?.userlikeit,
    profilePicture_url: raw?.profilePicture_url || profile?.profile_picture_url || DEFAULT_AVATAR,
    userLang: {
      nativelanguage: raw?.userLang?.nativelanguage || profile?.nativelanguage || "?",
      targetlanguage: raw?.userLang?.targetlanguage || profile?.targetlanguage || "?",
    },
  };
}

async function _enrichOnePost(postId, version) {
  if (!postId || !_isCurrentDetailJob(version) || !mounted) return;
  const current = postDetailsById?.[postId];
  if (current?.status === "ready" || current?.status === "error") return;

  _setPostDetail(postId, { status: "loading", data: null });

  try {
    const detail = await getPostCardData(postId, isLogin);
    if (!_isCurrentDetailJob(version) || !mounted) return;

    if (!detail || detail?.status === "error") {
      _setPostDetail(postId, {
        status: "error",
        data: _normalizePostData({}, postId),
      });
      return;
    }

    _setPostDetail(postId, {
      status: "ready",
      data: _normalizePostData(detail, postId),
    });
  } catch {
    if (!_isCurrentDetailJob(version) || !mounted) return;
    _setPostDetail(postId, {
      status: "error",
      data: _normalizePostData({}, postId),
    });
  }
}

async function _enrichVisiblePosts(version, ids = []) {
  const targets = ids.length > 0 ? ids : [...visiblePostIds];
  for (const postId of targets) {
    if (!_isCurrentDetailJob(version) || !mounted) return;
    await _enrichOnePost(postId, version);
  }
}

function _resolveFriendAction(nextProfile) {
  const targetId = String(nextProfile?.user_id || currentUserPageId || "");
  const inStatus = String(nextProfile?.friendship_status?.in?.state || "");
  const outStatus = String(nextProfile?.friendship_status?.out?.state || "");

  if (!isLogin) {
    return {
      label: "Add Friend",
      disabled: false,
      eventName: null,
      eventParameter: { target_id: targetId, from: "page/userProfile/addfriend" },
      style: "primary",
    };
  }

  if (inStatus === "friend" || outStatus === "friend") {
    return {
      label: "Friends",
      disabled: true,
      eventName: null,
      eventParameter: { target_id: targetId, from: "page/userProfile/addfriend" },
      style: "success",
    };
  }

  if (outStatus === "requested" || inStatus === "rejected" || outStatus === "rejected") {
    return {
      label: "Request Sent",
      disabled: true,
      eventName: null,
      eventParameter: { target_id: targetId, from: "page/userProfile/addfriend" },
      style: "muted",
    };
  }

  if (inStatus === "requested") {
    return {
      label: "Accept Friend Request",
      disabled: false,
      eventName: "acceptFriendRequest",
      eventParameter: { target_id: targetId, from: "page/userProfile/addfriend" },
      style: "success",
    };
  }

  return {
    label: "Add Friend",
    disabled: false,
    eventName: "sendFriendRequest",
    eventParameter: { target_id: targetId, from: "page/userProfile/addfriend" },
    style: "primary",
  };
}

async function refreshUserProfileOnly() {
  if (!currentUserPageId) {
    profileLoading = false;
    syncUserProfilePageState();
    return;
  }
  try {
    const nextProfile = await getUserProfile(currentUserPageId);
    profile = {
      ...(nextProfile || profile || {}),
      friendAction: _resolveFriendAction(nextProfile || profile || {}),
    };
    syncUserProfilePageState();
  } catch {
    // no-op
  }
}

function handleScroll() {
  if (!mounted) return;
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  const fullHeight = document.documentElement.scrollHeight;

  if (scrollY + vh >= fullHeight - 120) {
    void loadMoreUserProfilePosts();
  }
}

export async function initUserProfilePage() {
  ensureMounted();
  bindFriendRequestCompletionEvents();

  const context = readUserProfileContext();
  const userInfoEl = document.getElementById("userprofilepage-userinfo");
  currentUserPageId = context.userId || String(userInfoEl?.dataset?.userId || "").trim();
  isLogin = context.isLogin;

  mounted = true;
  userProfilePostIds = [];
  loadedPostsAmount = 0;
  loadingUserProfilePostsLock = false;
  profileLoading = true;
  profile = null;
  visiblePostIds = [];
  postDetailsById = {};
  syncUserProfilePageState();

  if (!currentUserPageId) return;

  try {
    const [profileSettled, postsSettled] = await Promise.allSettled([
      getUserProfile(currentUserPageId),
      getUserPosts(currentUserPageId),
    ]);
    const nextProfile = profileSettled.status === "fulfilled" ? profileSettled.value : null;
    const postIds = postsSettled.status === "fulfilled" ? postsSettled.value : [];

    profile = {
      ...(nextProfile || {
        user_id: currentUserPageId,
        username: "Unknown",
        nativelanguage: "?",
        targetlanguage: "?",
        profile_picture_url: DEFAULT_AVATAR,
      }),
      friendAction: _resolveFriendAction(nextProfile || {}),
    };
    profileLoading = false;

    userProfilePostIds = Array.isArray(postIds) ? postIds : [];
    loadedPostsAmount = 0;
    visiblePostIds = [];
    postDetailsById = {};
    syncUserProfilePageState();

    await loadMoreUserProfilePosts(5);
    window.removeEventListener("scroll", handleScroll);
    window.addEventListener("scroll", handleScroll, { passive: true });
  } catch {
    profile = {
      user_id: currentUserPageId,
      username: "Unknown",
      nativelanguage: "?",
      targetlanguage: "?",
      profile_picture_url: DEFAULT_AVATAR,
      friendAction: _resolveFriendAction({ user_id: currentUserPageId }),
    };
    profileLoading = false;
    syncUserProfilePageState();
  }
}

export async function loadMoreUserProfilePosts(batchSize = 5) {
  if (!mounted) return;
  if (loadingUserProfilePostsLock) return;

  const remaining = userProfilePostIds.length - loadedPostsAmount;
  if (remaining <= 0) return;

  loadingUserProfilePostsLock = true;
  syncUserProfilePageState();

  const count = Math.min(batchSize, remaining);
  const postsToLoad = userProfilePostIds.slice(loadedPostsAmount, loadedPostsAmount + count);

  loadedPostsAmount += count;
  visiblePostIds = [...visiblePostIds, ...postsToLoad];
  for (const postId of postsToLoad) {
    if (!postDetailsById[postId]) {
      postDetailsById = {
        ...postDetailsById,
        [postId]: { status: "loading", data: null },
      };
    }
  }

  loadingUserProfilePostsLock = false;
  syncUserProfilePageState();

  const pending = _getPendingVisiblePostIds();
  const targets = [...new Set([...postsToLoad, ...pending])];
  if (targets.length > 0) {
    const version = _nextDetailJobVersion();
    void _enrichVisiblePosts(version, targets);
  }
}

export function destroyUserProfilePage() {
  mounted = false;
  _nextDetailJobVersion();
  window.removeEventListener("scroll", handleScroll);
}
