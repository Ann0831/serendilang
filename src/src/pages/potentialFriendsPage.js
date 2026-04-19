import { getAllPotentialFriends, enrichPotentialFriendCardData } from "../service/getPotentialFriendsData.js";
import { addFriend } from "../service/addFriend.js";
import { updateState } from "../utils/uiStateAdapter.js";
import { normalizeLanguage } from "../utils/normalizeLanguage.js";

export let potentialFriends = [];
export let potentialFriendsInitialized = false;
export let potentialFriendsIndex = 0;
export let canScrollLeft = false;
export let canScrollRight = false;
let loadingPotentialFriendCardLock = false;
let mounted = false;
let visiblePotentialFriendIds = [];
const POTENTIAL_FRIENDS_SCROLL_STEP = 320;
const SCROLL_EDGE_EPS = 6;
const POTENTIAL_RIGHT_LOAD_EPS = 12;
let _onPotentialFriendsContainerScroll = null;
let _onPotentialFriendsWindowResize = null;
let _potentialFriendsScrollTrackRaf = 0;
let _potentialFriendsLastLeft = -1;
let _potentialFriendsStableFrames = 0;
let _detailJobVersion = 0;
let _potentialRightLoadLatch = false;
const POTENTIAL_LOADMORE_SKELETON_MIN_MS = 180;

function getPotentialFriendsContainerEl() {
  return document.getElementById("potentialfriendsContainer");
}

function computePotentialFriendsScrollState(el = getPotentialFriendsContainerEl()) {
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

function trackPotentialFriendsScrollState(el = getPotentialFriendsContainerEl()) {
  if (!el) return;
  if (_potentialFriendsScrollTrackRaf) {
    cancelAnimationFrame(_potentialFriendsScrollTrackRaf);
    _potentialFriendsScrollTrackRaf = 0;
  }
  _potentialFriendsLastLeft = -1;
  _potentialFriendsStableFrames = 0;

  const step = () => {
    computePotentialFriendsScrollState(el);
    syncPotentialFriendsState();

    const cur = el.scrollLeft;
    if (Math.abs(cur - _potentialFriendsLastLeft) < 0.5) {
      _potentialFriendsStableFrames += 1;
    } else {
      _potentialFriendsStableFrames = 0;
      _potentialFriendsLastLeft = cur;
    }

    if (_potentialFriendsStableFrames >= 3) {
      _potentialFriendsScrollTrackRaf = 0;
      return;
    }
    _potentialFriendsScrollTrackRaf = requestAnimationFrame(step);
  };

  _potentialFriendsScrollTrackRaf = requestAnimationFrame(step);
}

function syncPotentialFriendsState() {
  updateState("PotentialFriendsPage", {
    potentialFriends,
    potentialFriendsInitialized,
    potentialFriendsIndex,
    loadingPotentialFriendCardLock,
    mounted,
    visiblePotentialFriendIds,
    canScrollLeft,
    canScrollRight,
  });
}

function _nextDetailJobVersion() {
  _detailJobVersion += 1;
  return _detailJobVersion;
}

function _isCurrentDetailJob(version) {
  return version === _detailJobVersion;
}

function _setPotentialFriendDetailState(userId, patch) {
  let changed = false;
  const next = potentialFriends.map((item) => {
    if (item?.user_id !== userId) return item;
    changed = true;
    return { ...item, ...patch };
  });
  if (!changed) return;
  potentialFriends = next;
  syncPotentialFriendsState();
}

function _getPendingVisiblePotentialFriendIds() {
  const visibleSet = new Set(visiblePotentialFriendIds || []);
  return (potentialFriends || [])
    .filter((item) => visibleSet.has(item?.user_id))
    .filter((item) => item?.detailStatus !== "ready" && item?.detailStatus !== "error")
    .map((item) => item?.user_id)
    .filter(Boolean);
}

async function _enrichOnePotentialFriend(userId, version) {
  if (!mounted) return;
  const current = potentialFriends.find((x) => x?.user_id === userId);
  if (!current || current?.detailStatus === "ready" || current?.detailStatus === "error") return;

  _setPotentialFriendDetailState(userId, { detailStatus: "loading" });
  try {
    const enriched = await enrichPotentialFriendCardData(current);
    if (!mounted) return;
    const langObj =
      enriched?.language && typeof enriched.language === "object"
        ? enriched.language
        : null;
    const normalizedLang = normalizeLanguage(langObj || enriched);
    _setPotentialFriendDetailState(userId, {
      profilePicUrl: enriched?.profilePicUrl || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      language: normalizedLang,
      nativelanguage: normalizedLang.nativelanguage,
      targetlanguage: normalizedLang.targetlanguage,
      detailStatus: "ready",
    });
  } catch {
    if (!mounted) return;
    _setPotentialFriendDetailState(userId, {
      profilePicUrl: `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      language: { nativelanguage: "?", targetlanguage: "?" },
      nativelanguage: "?",
      targetlanguage: "?",
      detailStatus: "error",
    });
  }
}

async function _enrichVisiblePotentialFriends(version, ids = []) {
  const targets = ids.length > 0 ? ids : [...visiblePotentialFriendIds];
  for (const userId of targets) {
    if (!mounted) return;
    await _enrichOnePotentialFriend(userId, version);
  }
}

function ensurePotentialFriendsScrollListener() {
  const el = getPotentialFriendsContainerEl();
  if (!el) return;
  if (!_onPotentialFriendsContainerScroll) {
    _onPotentialFriendsContainerScroll = (evt) => {
      const currentEl =
        evt?.currentTarget instanceof HTMLElement
          ? evt.currentTarget
          : getPotentialFriendsContainerEl();
      if (!currentEl) return;

      computePotentialFriendsScrollState(currentEl);
      syncPotentialFriendsState();

      const maxLeft = Math.max(0, currentEl.scrollWidth - currentEl.clientWidth);
      const atRight =
        maxLeft > POTENTIAL_RIGHT_LOAD_EPS &&
        currentEl.scrollLeft >= maxLeft - POTENTIAL_RIGHT_LOAD_EPS;
      if (!atRight) {
        _potentialRightLoadLatch = false;
        return;
      }
      if (_potentialRightLoadLatch) return;
      _potentialRightLoadLatch = true;
      loadMorePotentialFriends();
    };
  }
  el.removeEventListener("scroll", _onPotentialFriendsContainerScroll);
  el.addEventListener("scroll", _onPotentialFriendsContainerScroll, { passive: true });

  if (!_onPotentialFriendsWindowResize) {
    _onPotentialFriendsWindowResize = () => refreshPotentialFriendsScrollState();
    window.addEventListener("resize", _onPotentialFriendsWindowResize);
  }
}

export function refreshPotentialFriendsScrollState() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = getPotentialFriendsContainerEl();
      if (!el) return;
      ensurePotentialFriendsScrollListener();
      computePotentialFriendsScrollState(el);
      syncPotentialFriendsState();
    });
  });
}

export function scrollPotentialFriendsLeft() {
  const el = getPotentialFriendsContainerEl();
  if (!el) return;
  el.scrollBy({ left: -POTENTIAL_FRIENDS_SCROLL_STEP, behavior: "smooth" });
  trackPotentialFriendsScrollState(el);
}

export function scrollPotentialFriendsRight() {
  const el = getPotentialFriendsContainerEl();
  if (!el) return;
  el.scrollBy({ left: POTENTIAL_FRIENDS_SCROLL_STEP, behavior: "smooth" });
  trackPotentialFriendsScrollState(el);
}

export function loadMorePotentialFriends() {
  if (!potentialFriendsInitialized || loadingPotentialFriendCardLock) return;
  if (potentialFriendsIndex >= potentialFriends.length) return;

  loadingPotentialFriendCardLock = true;
  // release right-edge latch while loading; it will be re-armed by next scroll cycle
  _potentialRightLoadLatch = false;
  syncPotentialFriendsState();

  setTimeout(() => {
    const remaining = potentialFriends.length - potentialFriendsIndex;
    const count = Math.min(5, remaining);
    const next = potentialFriends.slice(potentialFriendsIndex, potentialFriendsIndex + count);

    potentialFriendsIndex += count;
    visiblePotentialFriendIds = [
      ...visiblePotentialFriendIds,
      ...next.map((x) => x?.user_id).filter(Boolean),
    ];

    loadingPotentialFriendCardLock = false;
    _potentialRightLoadLatch = false;
    syncPotentialFriendsState();
    const targets = [...new Set([
      ...next.map((x) => x?.user_id).filter(Boolean),
      ..._getPendingVisiblePotentialFriendIds(),
    ])];
    if (targets.length > 0) {
      const version = _nextDetailJobVersion();
      void _enrichVisiblePotentialFriends(version, targets);
    }
    setTimeout(() => refreshPotentialFriendsScrollState(), 0);
  }, POTENTIAL_LOADMORE_SKELETON_MIN_MS);

  // TODO: 呼叫 UI 層 React render 函式
}

export async function handleSendFriendRequestFromPotential(targetId) {
  if (!targetId) return false;

  const idx = potentialFriends.findIndex((x) => x?.user_id === targetId);
  if (idx < 0) return false;
  const status = potentialFriends[idx]?.actionStatus;
  if (status === "loading" || status === "sent" || status === "removing") return false;

  potentialFriends = potentialFriends.map((x) =>
    x?.user_id === targetId ? { ...x, actionStatus: "loading" } : x,
  );
  syncPotentialFriendsState();

  const ok = await addFriend(targetId);
  if (!ok) {
    potentialFriends = potentialFriends.map((x) =>
      x?.user_id === targetId ? { ...x, actionStatus: "error" } : x,
    );
    syncPotentialFriendsState();
    return false;
  }

  potentialFriends = potentialFriends.map((x) =>
    x?.user_id === targetId ? { ...x, actionStatus: "sent" } : x,
  );
  syncPotentialFriendsState();

  setTimeout(() => {
    potentialFriends = potentialFriends.map((x) =>
      x?.user_id === targetId ? { ...x, actionStatus: "removing" } : x,
    );
    syncPotentialFriendsState();
  }, 500);

  setTimeout(() => {
    const sentIndex = potentialFriends.findIndex((x) => x?.user_id === targetId);
    if (sentIndex < 0) return;

    potentialFriends = potentialFriends.filter((x) => x?.user_id !== targetId);
    visiblePotentialFriendIds = visiblePotentialFriendIds.filter((id) => id !== targetId);

    if (sentIndex < potentialFriendsIndex) {
      potentialFriendsIndex = Math.max(0, potentialFriendsIndex - 1);
    }
    potentialFriendsIndex = Math.min(potentialFriendsIndex, potentialFriends.length);

    loadMorePotentialFriends();
    syncPotentialFriendsState();
    setTimeout(() => refreshPotentialFriendsScrollState(), 0);
  }, 850);

  return true;
}

export async function initPotentialFriendsPage() {
  mounted = true;
  _potentialRightLoadLatch = false;
  loadingPotentialFriendCardLock = true;
  potentialFriendsInitialized = false;
  syncPotentialFriendsState();

  try {
    const data = await getAllPotentialFriends();
    const raw = Array.isArray(data) ? data : [];
    potentialFriends = raw.map((x) => ({
      ...x,
      profilePicUrl: "",
      language: null,
      nativelanguage: normalizeLanguage(x).nativelanguage,
      targetlanguage: normalizeLanguage(x).targetlanguage,
      detailStatus: "loading",
      uiStatus: "idle",
      actionStatus: "idle",
    }));
    potentialFriendsIndex = 0;
    visiblePotentialFriendIds = [];
    potentialFriendsInitialized = true;
    loadingPotentialFriendCardLock = false;
    syncPotentialFriendsState();
    loadMorePotentialFriends();
    setTimeout(() => {
      ensurePotentialFriendsScrollListener();
      refreshPotentialFriendsScrollState();
    }, 0);
  } catch {
    loadingPotentialFriendCardLock = false;
    syncPotentialFriendsState();
  }
}
