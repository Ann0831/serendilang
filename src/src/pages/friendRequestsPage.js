import { getAllFriendRequests, enrichFriendRequestCardData } from "../service/getFriendRequestsData.js";
import { acceptFriendRequest } from "../service/acceptRequest.js";
import { markFriendRequestsAsRead } from "../service/markIsRead.js";
import { updateState } from "../utils/uiStateAdapter.js";
import { normalizeLanguage } from "../utils/normalizeLanguage.js";
import { updateUnreadFriendRequestDot } from "./refreshMenuDot.js";

export let friendRequests = [];
export let friendRequestsInitialized = false;
export let friendRequestsIndex = 0;
export let canScrollLeft = false;
export let canScrollRight = false;
let loadingFriendRequestCardLock = false;
let mounted = false;
let visibleRequestIds = [];
const FRIEND_REQUESTS_SCROLL_STEP = 320;
const SCROLL_EDGE_EPS = 6;
const FRIEND_REQUESTS_RIGHT_LOAD_EPS = 12;
const FRIEND_REQUESTS_LOADMORE_SKELETON_MIN_MS = 180;
let _onFriendRequestsContainerScroll = null;
let _onFriendRequestsWindowResize = null;
let _friendRequestsScrollTrackRaf = 0;
let _friendRequestsLastLeft = -1;
let _friendRequestsStableFrames = 0;
let _detailJobVersion = 0;
let _friendRequestsRightLoadLatch = false;

function getFriendRequestsContainerEl() {
  return document.getElementById("friendRequestsContainer");
}

function computeFriendRequestsScrollState(el = getFriendRequestsContainerEl()) {
  if (!el) {
    canScrollLeft = false;
    canScrollRight = false;
    return;
  }
  const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
  if (maxLeft <= SCROLL_EDGE_EPS) {
    canScrollLeft = false;
    canScrollRight = false;
    return;
  }
  const left = Math.min(maxLeft, Math.max(0, el.scrollLeft));
  canScrollLeft = left > SCROLL_EDGE_EPS;
  canScrollRight = left < maxLeft - SCROLL_EDGE_EPS;
}

function trackFriendRequestsScrollState(el = getFriendRequestsContainerEl()) {
  if (!el) return;
  if (_friendRequestsScrollTrackRaf) {
    cancelAnimationFrame(_friendRequestsScrollTrackRaf);
    _friendRequestsScrollTrackRaf = 0;
  }
  _friendRequestsLastLeft = -1;
  _friendRequestsStableFrames = 0;

  const step = () => {
    computeFriendRequestsScrollState(el);
    syncFriendRequestState();

    const cur = el.scrollLeft;
    if (Math.abs(cur - _friendRequestsLastLeft) < 0.5) {
      _friendRequestsStableFrames += 1;
    } else {
      _friendRequestsStableFrames = 0;
      _friendRequestsLastLeft = cur;
    }

    if (_friendRequestsStableFrames >= 3) {
      _friendRequestsScrollTrackRaf = 0;
      return;
    }
    _friendRequestsScrollTrackRaf = requestAnimationFrame(step);
  };

  _friendRequestsScrollTrackRaf = requestAnimationFrame(step);
}

function syncFriendRequestState() {
  updateState("FriendRequestsPage", {
    friendRequests,
    friendRequestsInitialized,
    friendRequestsIndex,
    loadingFriendRequestCardLock,
    mounted,
    visibleRequestIds,
    canScrollLeft,
    canScrollRight,
  });
}

function _nextDetailJobVersion() {
  _detailJobVersion += 1;
  return _detailJobVersion;
}

function _setFriendRequestDetailState(userId, patch) {
  let changed = false;
  const next = friendRequests.map((item) => {
    if (item?.sender_id !== userId) return item;
    changed = true;
    return { ...item, ...patch };
  });
  if (!changed) return;
  friendRequests = next;
  syncFriendRequestState();
}

function _getPendingVisibleRequestIds() {
  const visibleSet = new Set(visibleRequestIds || []);
  return (friendRequests || [])
    .filter((item) => visibleSet.has(item?.sender_id))
    .filter((item) => item?.detailStatus !== "ready" && item?.detailStatus !== "error")
    .map((item) => item?.sender_id)
    .filter(Boolean);
}

async function _enrichOneFriendRequest(userId, version) {
  if (!mounted) return;
  const current = friendRequests.find((x) => x?.sender_id === userId);
  if (!current || current?.detailStatus === "ready" || current?.detailStatus === "error") return;

  _setFriendRequestDetailState(userId, { detailStatus: "loading" });
  try {
    const enriched = await enrichFriendRequestCardData(current);
    if (!mounted) return;
    const normalizedLang = normalizeLanguage({
      ...current,
      ...enriched,
      language: enriched?.language || current?.language || null,
    });
    _setFriendRequestDetailState(userId, {
      profilePicUrl: enriched?.profilePicUrl || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      language: normalizedLang,
      nativelanguage: normalizedLang.nativelanguage,
      targetlanguage: normalizedLang.targetlanguage,
      detailStatus: "ready",
    });
  } catch {
    if (!mounted) return;
    _setFriendRequestDetailState(userId, {
      profilePicUrl: `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      language: { nativelanguage: "?", targetlanguage: "?" },
      nativelanguage: "?",
      targetlanguage: "?",
      detailStatus: "error",
    });
  }
}

async function _enrichVisibleFriendRequests(version, ids = []) {
  const targets = ids.length > 0 ? ids : [...visibleRequestIds];
  for (const userId of targets) {
    if (!mounted) return;
    await _enrichOneFriendRequest(userId, version);
  }
}

function ensureFriendRequestsScrollListener() {
  const el = getFriendRequestsContainerEl();
  if (!el) return;
  if (!_onFriendRequestsContainerScroll) {
    _onFriendRequestsContainerScroll = (evt) => {
      const currentEl =
        evt?.currentTarget instanceof HTMLElement
          ? evt.currentTarget
          : getFriendRequestsContainerEl();
      if (!currentEl) return;

      computeFriendRequestsScrollState(currentEl);
      syncFriendRequestState();

      const maxLeft = Math.max(0, currentEl.scrollWidth - currentEl.clientWidth);
      const atRight =
        maxLeft > FRIEND_REQUESTS_RIGHT_LOAD_EPS &&
        currentEl.scrollLeft >= maxLeft - FRIEND_REQUESTS_RIGHT_LOAD_EPS;
      if (!atRight) {
        _friendRequestsRightLoadLatch = false;
        return;
      }
      if (_friendRequestsRightLoadLatch) return;
      _friendRequestsRightLoadLatch = true;
      loadMoreFriendRequests();
    };
  }
  el.removeEventListener("scroll", _onFriendRequestsContainerScroll);
  el.addEventListener("scroll", _onFriendRequestsContainerScroll, { passive: true });

  if (!_onFriendRequestsWindowResize) {
    _onFriendRequestsWindowResize = () => refreshFriendRequestsScrollState();
    window.addEventListener("resize", _onFriendRequestsWindowResize);
  }
}

function detachFriendRequestsScrollListener() {
  const el = getFriendRequestsContainerEl();
  if (el && _onFriendRequestsContainerScroll) {
    el.removeEventListener("scroll", _onFriendRequestsContainerScroll);
  }
  if (_onFriendRequestsWindowResize) {
    window.removeEventListener("resize", _onFriendRequestsWindowResize);
    _onFriendRequestsWindowResize = null;
  }
  if (_friendRequestsScrollTrackRaf) {
    cancelAnimationFrame(_friendRequestsScrollTrackRaf);
    _friendRequestsScrollTrackRaf = 0;
  }
}

export function refreshFriendRequestsScrollState() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = getFriendRequestsContainerEl();
      if (!el) return;
      ensureFriendRequestsScrollListener();
      computeFriendRequestsScrollState(el);
      syncFriendRequestState();
    });
  });
}

export function scrollFriendRequestsLeft() {
  const el = getFriendRequestsContainerEl();
  if (!el) return;
  el.scrollBy({ left: -FRIEND_REQUESTS_SCROLL_STEP, behavior: "smooth" });
  trackFriendRequestsScrollState(el);
}

export function scrollFriendRequestsRight() {
  const el = getFriendRequestsContainerEl();
  if (!el) return;
  el.scrollBy({ left: FRIEND_REQUESTS_SCROLL_STEP, behavior: "smooth" });
  trackFriendRequestsScrollState(el);
}

export function loadMoreFriendRequests() {
  if (!friendRequestsInitialized || loadingFriendRequestCardLock) return;
  if (friendRequestsIndex >= friendRequests.length) return;

  loadingFriendRequestCardLock = true;
  // release right-edge latch while loading; it will be re-armed by next scroll cycle
  _friendRequestsRightLoadLatch = false;
  syncFriendRequestState();

  setTimeout(() => {
    const remaining = friendRequests.length - friendRequestsIndex;
    const count = Math.min(5, remaining);
    const next = friendRequests.slice(friendRequestsIndex, friendRequestsIndex + count);

    friendRequestsIndex += count;
    visibleRequestIds = [...visibleRequestIds, ...next.map((x) => x?.sender_id).filter(Boolean)];

    loadingFriendRequestCardLock = false;
    _friendRequestsRightLoadLatch = false;
    syncFriendRequestState();
    const targets = [...new Set([
      ...next.map((x) => x?.sender_id).filter(Boolean),
      ..._getPendingVisibleRequestIds(),
    ])];
    if (targets.length > 0) {
      const version = _nextDetailJobVersion();
      void _enrichVisibleFriendRequests(version, targets);
    }
    setTimeout(() => refreshFriendRequestsScrollState(), 0);
  }, FRIEND_REQUESTS_LOADMORE_SKELETON_MIN_MS);

  // TODO: 呼叫 UI 層 React render 函式
}

export async function handleAcceptFriendRequest(targetId) {
  if (!targetId) return false;

  const idx = friendRequests.findIndex((x) => x?.sender_id === targetId);
  if (idx < 0) return false;
  if (
    friendRequests[idx]?.actionStatus === "loading" ||
    friendRequests[idx]?.actionStatus === "accepted" ||
    friendRequests[idx]?.actionStatus === "removing"
  ) {
    return false;
  }

  friendRequests = friendRequests.map((x) =>
    x?.sender_id === targetId ? { ...x, actionStatus: "loading" } : x,
  );
  syncFriendRequestState();

  const ok = await acceptFriendRequest(targetId);
  if (!ok) {
    friendRequests = friendRequests.map((x) =>
      x?.sender_id === targetId ? { ...x, actionStatus: "error" } : x,
    );
    syncFriendRequestState();
    return false;
  }

  friendRequests = friendRequests.map((x) =>
    x?.sender_id === targetId ? { ...x, actionStatus: "accepted" } : x,
  );
  syncFriendRequestState();

  setTimeout(() => {
    friendRequests = friendRequests.map((x) =>
      x?.sender_id === targetId ? { ...x, actionStatus: "removing" } : x,
    );
    syncFriendRequestState();
  }, 500);

  setTimeout(() => {
    const acceptedIndex = friendRequests.findIndex((x) => x?.sender_id === targetId);
    if (acceptedIndex < 0) return;

    friendRequests = friendRequests.filter((x) => x?.sender_id !== targetId);
    visibleRequestIds = visibleRequestIds.filter((id) => id !== targetId);

    if (acceptedIndex < friendRequestsIndex) {
      friendRequestsIndex = Math.max(0, friendRequestsIndex - 1);
    }
    friendRequestsIndex = Math.min(friendRequestsIndex, friendRequests.length);

    loadMoreFriendRequests();
    syncFriendRequestState();
    setTimeout(() => refreshFriendRequestsScrollState(), 0);
  }, 850);

  return true;
}

export async function initFriendRequestsPage() {
  mounted = true;
  _friendRequestsRightLoadLatch = false;
  friendRequestsInitialized = false;
  loadingFriendRequestCardLock = true;
  syncFriendRequestState();

  try {
    const data = await getAllFriendRequests();
    friendRequests = Array.isArray(data)
      ? data.map((x) => ({
          ...x,
          profilePicUrl: "",
          language: {
            nativelanguage: normalizeLanguage(x).nativelanguage,
            targetlanguage: normalizeLanguage(x).targetlanguage,
          },
          nativelanguage: normalizeLanguage(x).nativelanguage,
          targetlanguage: normalizeLanguage(x).targetlanguage,
          detailStatus: "loading",
          uiStatus: "idle",
          actionStatus: "idle",
        }))
      : [];

    friendRequestsIndex = 0;
    visibleRequestIds = [];
    friendRequestsInitialized = true;
    loadingFriendRequestCardLock = false;
    syncFriendRequestState();

    loadMoreFriendRequests();
  } catch {
    loadingFriendRequestCardLock = false;
    syncFriendRequestState();
  }
}

export async function enterFriendRequestsPage() {
  mounted = true;
  const unreadDot = document.getElementById("unread-friendrequest-dot");
  const needReinit = unreadDot && !unreadDot.classList.contains("hidden");

  if (needReinit) {
    friendRequests = [];
    friendRequestsInitialized = false;
    friendRequestsIndex = 0;
    loadingFriendRequestCardLock = false;
    visibleRequestIds = [];
  }
  syncFriendRequestState();

  if (!friendRequestsInitialized || needReinit) await initFriendRequestsPage();
  await markFriendRequestsAsRead();
  await updateUnreadFriendRequestDot();
  setTimeout(() => {
    ensureFriendRequestsScrollListener();
    refreshFriendRequestsScrollState();
  }, 0);

  // TODO: 呼叫 UI 層 React render 函式
}

export function leaveFriendRequestsPage() {
  detachFriendRequestsScrollListener();
  mounted = false;
  _nextDetailJobVersion();
  friendRequests = [];
  friendRequestsInitialized = false;
  friendRequestsIndex = 0;
  visibleRequestIds = [];
  canScrollLeft = false;
  canScrollRight = false;
  _friendRequestsRightLoadLatch = false;
  syncFriendRequestState();
}
