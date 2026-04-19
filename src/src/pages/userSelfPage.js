import { getUserSelfAllPosts } from "../service/getUserSelfAllPosts.js";
import { getUserSelfPagePostCardData } from "../service/getUserSelfPagePostCardData.js";
import { validlanguage } from "../utils/language/validLanguage.js";
import { updateUsername, updateUserLanguage, updateUserProfilePicture, deleteUserProfilePicture } from "../service/uploadUserData.js";
import { fetchUserLanguage, fetchUserProfilePicUrl, fetchUsername } from "../service/getUserSelfBasicData.js";
import { updateState } from "../utils/uiStateAdapter.js";
import { uploadPostData } from "../service/uploadPostData.js";
import { refreshMenuBarIdentity } from "./menuBar.js";
import { refreshTopBarIdentity } from "./topBar.js";
import { refreshUserData } from "../userSelfData/userSelfData.js";
import { sortOnlineUsersByLanguage } from "./onlineUsersContainer.js";

export let userSelfPostIds = [];
let loadedPostsAmount = 0;
let loadingUserSelfPostsLock = false;
let already_initialize = false;
let mounted = false;
let showing = false;
let visiblePostIds = [];
let postDetailsById = {};
let _detailJobVersion = 0;
const _likeLocks = new Set();

let profileState = {
  username: "",
  profilePicUrl: "",
  language: { targetlanguage: "?", nativelanguage: "?" },
};
let profileLoading = true;

let modalState = {
  editLanguage: { open: false, submitting: false },
  editAvatar: { open: false, submitting: false },
  editUsername: { open: false, submitting: false },
};

function revokeEditAvatarPreviewIfAny() {
  const url = modalState?.editAvatar?.previewUrl;
  if (url && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // no-op
    }
  }
}

function syncUserSelfPageState() {
  updateState("UserSelfPage", {
    userSelfPostIds,
    loadedPostsAmount,
    loadingUserSelfPostsLock,
    already_initialize,
    mounted,
    showing,
    visiblePostIds,
    postDetailsById,
    profileState,
    profileLoading,
    modalState,
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
  syncUserSelfPageState();
}

function _updatePostDetailData(postId, updater) {
  const cur = postDetailsById?.[postId];
  if (!cur || cur.status !== "ready" || !cur.data) return;
  const nextData = updater(cur.data);
  postDetailsById = {
    ...postDetailsById,
    [postId]: {
      ...cur,
      data: nextData,
    },
  };
  syncUserSelfPageState();
}

async function _enrichPostDetail(postId, version) {
  if (!postId || !_isCurrentDetailJob(version) || !mounted) return;
  const current = postDetailsById?.[postId];
  if (current?.status === "ready") return;
  _setPostDetail(postId, { status: "loading" });

  try {
    const data = await getUserSelfPagePostCardData(postId);
    if (!_isCurrentDetailJob(version) || !mounted) return;
    if (!data || data?.status === "error") {
      _setPostDetail(postId, { status: "error", data: null });
      return;
    }
    _setPostDetail(postId, { status: "ready", data });
  } catch {
    if (!_isCurrentDetailJob(version) || !mounted) return;
    _setPostDetail(postId, { status: "error", data: null });
  }
}

async function _enrichVisiblePosts(version, ids = []) {
  const targets = ids.length > 0 ? ids : [...visiblePostIds];
  for (const postId of targets) {
    if (!_isCurrentDetailJob(version) || !mounted) return;
    await _enrichPostDetail(postId, version);
  }
}

function _getPendingVisiblePostIds() {
  const visibleSet = new Set(Array.isArray(visiblePostIds) ? visiblePostIds : []);
  return Object.entries(postDetailsById || {})
    .filter(([postId]) => visibleSet.has(postId))
    .filter(([, detail]) => detail?.status !== "ready" && detail?.status !== "error")
    .map(([postId]) => postId);
}

async function refreshProfileState() {
  profileLoading = true;
  syncUserSelfPageState();
  const [languageSettled, profileSettled, usernameSettled] = await Promise.allSettled([
    fetchUserLanguage(),
    fetchUserProfilePicUrl(),
    fetchUsername(),
  ]);
  const language = languageSettled.status === "fulfilled" ? languageSettled.value : null;
  const profilePicUrl = profileSettled.status === "fulfilled" ? profileSettled.value : null;
  const username = usernameSettled.status === "fulfilled" ? usernameSettled.value : null;

  profileState = {
    username: username || "Unknown User",
    profilePicUrl: profilePicUrl || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
    language: language || { targetlanguage: "?", nativelanguage: "?" },
  };
  profileLoading = false;
  syncUserSelfPageState();

  // TODO: 呼叫 UI 層 React render 函式
}

function handleScroll() {
  if (!mounted || !showing) return;
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  const fullHeight = document.documentElement.scrollHeight;
  if (scrollY + vh >= fullHeight - 50) loadMoreUserSelfPosts();
}

export async function userSelfPage_Enter() {
  const dot = document.getElementById("unread-profile-dot");

  mounted = true;
  showing = true;
  if (dot && !dot.classList.contains("hidden")) {
    dot.classList.add("hidden");
  }
  syncUserSelfPageState();

  if (!already_initialize) {
    await initUserSelfPage();
  } else {
    const pending = _getPendingVisiblePostIds();
    if (pending.length > 0) {
      const version = _nextDetailJobVersion();
      void _enrichVisiblePosts(version, pending);
    }
  }

  window.addEventListener("scroll", handleScroll);
}

export async function userSelfPage_Leave() {
  _nextDetailJobVersion();
  mounted = false;
  showing = false;
  syncUserSelfPageState();
  window.removeEventListener("scroll", handleScroll);
}

export async function initUserSelfPage() {
  try {
    profileLoading = true;
    userSelfPostIds = await getUserSelfAllPosts();
    loadedPostsAmount = 0;
    visiblePostIds = [];
    postDetailsById = {};
    syncUserSelfPageState();

    await refreshProfileState();
    await loadMoreUserSelfPosts();
    already_initialize = true;
    syncUserSelfPageState();
  } catch {
    syncUserSelfPageState();
  }
}

export async function reInitUserSelfPosts() {
  if (!already_initialize) return;

  try {
    userSelfPostIds = await getUserSelfAllPosts();
    loadedPostsAmount = 0;
    loadingUserSelfPostsLock = false;
    visiblePostIds = [];
    postDetailsById = {};
    already_initialize = true;
    syncUserSelfPageState();

    await loadMoreUserSelfPosts();
  } catch {
    syncUserSelfPageState();
  }
}

export async function userSelfPage_ReInitAll() {
  const shouldRefreshNow = !!mounted && !!showing;
  if (shouldRefreshNow && typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
  _nextDetailJobVersion();
  userSelfPostIds = [];
  loadedPostsAmount = 0;
  loadingUserSelfPostsLock = false;
  visiblePostIds = [];
  postDetailsById = {};
  already_initialize = false;
  profileLoading = true;
  syncUserSelfPageState();

  if (shouldRefreshNow) {
    await initUserSelfPage();
  }
}

export async function loadMoreUserSelfPosts(batchSize = 5) {
  if (!mounted || !showing) return;
  if (loadingUserSelfPostsLock) return;
  if (!Array.isArray(userSelfPostIds) || userSelfPostIds.length === 0) return;
  if (loadedPostsAmount >= userSelfPostIds.length) return;

  loadingUserSelfPostsLock = true;
  syncUserSelfPageState();

  const remaining = userSelfPostIds.length - loadedPostsAmount;
  const count = Math.min(batchSize, remaining);
  const postsToLoad = userSelfPostIds.slice(loadedPostsAmount, loadedPostsAmount + count);
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

  loadingUserSelfPostsLock = false;
  syncUserSelfPageState();
  const version = _nextDetailJobVersion();
  const pending = _getPendingVisiblePostIds();
  const targets = [...new Set([...postsToLoad, ...pending])];
  void _enrichVisiblePosts(version, targets);

  // TODO: 呼叫 UI 層 React render 函式
}

function normalizeLanguageSelection(input, options = []) {
  const raw = typeof input === "string" ? input.trim() : String(input || "").trim();
  if (!raw) return "";

  const finders = (Array.isArray(options) ? options : [])
    .map((opt) => ({
      name: typeof opt?.name === "string" ? opt.name : "",
      lower: typeof opt?.lowercase === "string" ? opt.lowercase : "",
    }))
    .filter((x) => x.name);

  const rawLower = raw.toLowerCase();
  const aliasMap = {
    chinese: "chinese (mandarin)",
    mandarin: "chinese (mandarin)",
    "chinese mandarin": "chinese (mandarin)",
  };
  const normalizedLower = aliasMap[rawLower] || rawLower;

  const exact = finders.find((x) => x.name.toLowerCase() === normalizedLower || x.lower === normalizedLower);
  if (exact) return exact.name;

  const contains = finders.find((x) => x.name.toLowerCase().includes(normalizedLower) || normalizedLower.includes(x.name.toLowerCase()));
  if (contains) return contains.name;

  return raw;
}

export function openEditLanguageModal(currentNative = "", currentTarget = "") {
  const _ = document.getElementById("userselfpage-edit-language-btn");
  const languageOptions = validlanguage().languages;
  modalState.editLanguage = {
    open: true,
    submitting: false,
    currentNative: normalizeLanguageSelection(currentNative, languageOptions),
    currentTarget: normalizeLanguageSelection(currentTarget, languageOptions),
    options: languageOptions,
  };
  syncUserSelfPageState();
}

export function updateEditLanguageModal(field, value) {
  if (!["currentNative", "currentTarget"].includes(String(field || ""))) return;
  modalState.editLanguage = {
    ...modalState.editLanguage,
    [field]: typeof value === "string" ? value : String(value || ""),
    result: "",
  };
  syncUserSelfPageState();
}

export function closeEditLanguageModal() {
  modalState.editLanguage = { open: false, submitting: false };
  syncUserSelfPageState();
}

export async function submitEditLanguageModal() {
  modalState.editLanguage = { ...modalState.editLanguage, submitting: true };
  syncUserSelfPageState();

  try {
    const target = modalState.editLanguage.currentTarget;
    const native = modalState.editLanguage.currentNative;
    const success = await updateUserLanguage(target, native);

    modalState.editLanguage = {
      ...modalState.editLanguage,
      submitting: false,
      result: success?.result === "success" ? "success" : "fail",
    };
    syncUserSelfPageState();

    if (success?.result === "success") {
      await refreshUserData();
      await refreshProfileState();
      await sortOnlineUsersByLanguage();
    }
  } catch {
    modalState.editLanguage = { ...modalState.editLanguage, submitting: false, result: "fail" };
    syncUserSelfPageState();
  }
}

export function openEditAvatarModal() {
  const _ = document.getElementById("userselfpage-profile-pic");
  revokeEditAvatarPreviewIfAny();
  modalState.editAvatar = { open: true, submitting: false, file: null, previewUrl: "", result: "" };
  syncUserSelfPageState();
}

export function updateEditAvatarModalFile(file = null) {
  const nextFile = file && typeof file === "object" ? file : null;
  if (nextFile && typeof nextFile.type === "string" && !nextFile.type.startsWith("image/")) {
    modalState.editAvatar = {
      ...modalState.editAvatar,
      result: "fail",
    };
    syncUserSelfPageState();
    return;
  }

  revokeEditAvatarPreviewIfAny();
  let previewUrl = "";
  if (nextFile && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    try {
      previewUrl = URL.createObjectURL(nextFile);
    } catch {
      previewUrl = "";
    }
  }
  modalState.editAvatar = {
    ...modalState.editAvatar,
    file: nextFile,
    previewUrl,
    result: "",
  };
  syncUserSelfPageState();
}

export function closeEditAvatarModal() {
  revokeEditAvatarPreviewIfAny();
  modalState.editAvatar = { open: false, submitting: false };
  syncUserSelfPageState();
}

export async function submitEditAvatarModal() {
  modalState.editAvatar = { ...modalState.editAvatar, submitting: true };
  syncUserSelfPageState();

  try {
    // TODO: UI 層應回填選到的 file 到 state
    const file = modalState.editAvatar.file || null;
    const res = await updateUserProfilePicture(file);
    modalState.editAvatar = {
      ...modalState.editAvatar,
      submitting: false,
      result: res?.result === "success" ? "success" : "fail",
    };
    if (res?.result === "success") {
      revokeEditAvatarPreviewIfAny();
      modalState.editAvatar = { ...modalState.editAvatar, file: null, previewUrl: "" };
    }
    syncUserSelfPageState();

    if (res?.result === "success") {
      await refreshUserData();
      await refreshProfileState();
      await refreshMenuBarIdentity();
      await refreshTopBarIdentity();
    }
  } catch {
    modalState.editAvatar = { ...modalState.editAvatar, submitting: false, result: "fail" };
    syncUserSelfPageState();
  }
}

export async function submitDeleteAvatarModal() {
  modalState.editAvatar = { ...modalState.editAvatar, submitting: true };
  syncUserSelfPageState();

  try {
    const res = await deleteUserProfilePicture();
    modalState.editAvatar = {
      ...modalState.editAvatar,
      submitting: false,
      result: res?.result === "success" ? "success" : "fail",
    };
    syncUserSelfPageState();

    if (res?.result === "success") {
      await refreshUserData();
      await refreshProfileState();
      await refreshMenuBarIdentity();
      await refreshTopBarIdentity();
    }
  } catch {
    modalState.editAvatar = { ...modalState.editAvatar, submitting: false, result: "fail" };
    syncUserSelfPageState();
  }
}

export function openEditUsernameModal(currentUsername = "") {
  const _ = document.getElementById("userselfpage-username");
  modalState.editUsername = { open: true, submitting: false, currentUsername, result: "" };
  syncUserSelfPageState();
}

export function updateEditUsernameModal(username = "") {
  modalState.editUsername = {
    ...modalState.editUsername,
    currentUsername: typeof username === "string" ? username : String(username || ""),
    result: "",
  };
  syncUserSelfPageState();
}

export function closeEditUsernameModal() {
  modalState.editUsername = { open: false, submitting: false };
  syncUserSelfPageState();
}

export async function submitEditUsernameModal() {
  modalState.editUsername = { ...modalState.editUsername, submitting: true };
  syncUserSelfPageState();

  try {
    const username = modalState.editUsername.currentUsername;
    const res = await updateUsername(username);
    modalState.editUsername = {
      ...modalState.editUsername,
      submitting: false,
      result: res?.result === "success" ? "success" : "fail",
    };
    syncUserSelfPageState();

    if (res?.result === "success") {
      await refreshUserData();
      await refreshProfileState();
      await refreshMenuBarIdentity();
    }
  } catch {
    modalState.editUsername = { ...modalState.editUsername, submitting: false, result: "fail" };
    syncUserSelfPageState();
  }
}

export async function userSelfPage_ToggleLike(postId) {
  if (!postId) return { result: "fail", reason: "missing_post_id" };
  if (_likeLocks.has(postId)) return { result: "ignored", reason: "busy" };

  const current = postDetailsById?.[postId];
  if (!current || current.status !== "ready" || !current.data) {
    return { result: "fail", reason: "post_not_ready" };
  }

  const prevLiked = !!current.data.userlikeit;
  const prevCount = Number.isFinite(Number(current.data.like_count))
    ? Number(current.data.like_count)
    : 0;
  const nextLiked = !prevLiked;
  const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

  _likeLocks.add(postId);
  _updatePostDetailData(postId, (d) => ({
    ...d,
    userlikeit: nextLiked,
    like_count: nextCount,
    likePending: true,
  }));

  try {
    const res = nextLiked
      ? await uploadPostData.sendLike(postId)
      : await uploadPostData.unsendLike(postId);

    if (res?.result === "success") {
      _updatePostDetailData(postId, (d) => ({ ...d, likePending: false }));
      return { result: "success", liked: nextLiked };
    }

    _updatePostDetailData(postId, (d) => ({
      ...d,
      userlikeit: prevLiked,
      like_count: prevCount,
      likePending: false,
    }));
    return { result: "fail", reason: "api_fail" };
  } catch {
    _updatePostDetailData(postId, (d) => ({
      ...d,
      userlikeit: prevLiked,
      like_count: prevCount,
      likePending: false,
    }));
    return { result: "fail", reason: "exception" };
  } finally {
    _likeLocks.delete(postId);
  }
}
