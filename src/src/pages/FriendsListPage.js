import { getFriendsList, enrichFriendItemData } from "../service/getFriendsListPageData.js";
import { getCurrentUserBlockList_Global } from "../userSelfData/userSelfData.js";
import { markAcceptedFriendsAsRead } from "../service/markIsRead.js";
import { updateState } from "../utils/uiStateAdapter.js";
import { updateUnreadAcceptFriendDot } from "./refreshMenuDot.js";

let _friendsListPageState = {
  friendsList: [],
  loadedCount: 0,
  batchSize: 3,
  initialized: false,
  loading: false,
  mounted: false,
  visibleFriendIds: [],
};

const PAGE_ID = "friendslistpage";
let _detailJobVersion = 0;

function syncFriendsListState() {
  updateState("FriendsListPage", _friendsListPageState);
}

function patchFriendsListState(patch) {
  _friendsListPageState = { ..._friendsListPageState, ...patch };
  syncFriendsListState();
}

function _nextDetailJobVersion() {
  _detailJobVersion += 1;
  return _detailJobVersion;
}

function _isCurrentDetailJob(version) {
  return version === _detailJobVersion;
}

function _setFriendDetailState(friendId, patch) {
  let changed = false;
  const nextList = _friendsListPageState.friendsList.map((friend) => {
    if (friend?.friend_id !== friendId) return friend;
    changed = true;
    return { ...friend, ...patch };
  });
  if (changed) patchFriendsListState({ friendsList: nextList });
}

function _getPendingVisibleFriendIds() {
  const visibleSet = new Set(_friendsListPageState.visibleFriendIds || []);
  return (_friendsListPageState.friendsList || [])
    .filter((friend) => visibleSet.has(friend?.friend_id))
    .filter((friend) => friend?.detailStatus !== "ready" && friend?.detailStatus !== "error")
    .map((friend) => friend?.friend_id)
    .filter(Boolean);
}

async function _enrichOneFriend(friendId, version) {
  if (!_isCurrentDetailJob(version) || !_friendsListPageState.mounted) return;
  const current = _friendsListPageState.friendsList.find((x) => x?.friend_id === friendId);
  if (!current || current.detailStatus === "ready" || current.detailStatus === "error") return;

  _setFriendDetailState(friendId, { detailStatus: "loading" });

  try {
    const enriched = await enrichFriendItemData(current);
    if (!_isCurrentDetailJob(version) || !_friendsListPageState.mounted) return;
    _setFriendDetailState(friendId, {
      profilePicUrl: enriched?.profilePicUrl || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      language: {
        nativelanguage: enriched?.language?.nativelanguage || "?",
        targetlanguage: enriched?.language?.targetlanguage || "?",
      },
      detailStatus: "ready",
    });
  } catch {
    if (!_isCurrentDetailJob(version) || !_friendsListPageState.mounted) return;
    _setFriendDetailState(friendId, {
      profilePicUrl: `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      language: { nativelanguage: "?", targetlanguage: "?" },
      detailStatus: "error",
    });
  }
}

async function _enrichVisibleFriendsInBackground(version, ids = []) {
  const visibleIds = ids.length > 0 ? ids : [..._friendsListPageState.visibleFriendIds];
  for (const friendId of visibleIds) {
    if (!_isCurrentDetailJob(version) || !_friendsListPageState.mounted) return;
    await _enrichOneFriend(friendId, version);
  }
}

function _hasMoreFriends() {
  const list = _friendsListPageState.friendsList;
  return Array.isArray(list) && _friendsListPageState.loadedCount < list.length;
}

function _sortFriendsForUi(list) {
  return [...list].sort((a, b) => {
    if (a?.is_read === false && b?.is_read !== false) return -1;
    if (a?.is_read !== false && b?.is_read === false) return 1;
    return Number(!!a?.isBlocked) - Number(!!b?.isBlocked);
  });
}

function _mergeFriendsWithCurrentState(baseFriendsList, blockList = []) {
  const prevMap = new Map((_friendsListPageState.friendsList || []).map((f) => [f?.friend_id, f]));
  const blockSet = new Set(Array.isArray(blockList) ? blockList : []);
  const merged = (Array.isArray(baseFriendsList) ? baseFriendsList : [])
    .map((friend) => {
      const id = friend?.friend_id;
      const prev = prevMap.get(id) || {};
      return {
        ...friend,
        profilePicUrl: prev?.profilePicUrl || "",
        language: prev?.language || null,
        detailStatus: prev?.detailStatus || "loading",
        uiStatus: prev?.uiStatus || "idle",
        isBlocked: blockSet.has(id),
      };
    })
    .filter((f) => f?.friend_id && f?.friend_name);

  return _sortFriendsForUi(merged);
}

function _reconcileVisibleState(nextFriendsList, { resetViewport = false } = {}) {
  if (resetViewport) return { loadedCount: 0, visibleFriendIds: [] };

  const baseTarget = Math.min(_friendsListPageState.loadedCount || 0, nextFriendsList.length);
  const targetCount = Math.max(
    _friendsListPageState.batchSize || 0,
    (_friendsListPageState.visibleFriendIds || []).length,
    baseTarget,
  );
  const visibleFriendIds = nextFriendsList
    .slice(0, targetCount)
    .map((f) => f?.friend_id)
    .filter(Boolean);

  return {
    loadedCount: visibleFriendIds.length,
    visibleFriendIds,
  };
}

async function _ensureFriendsFilledViewport(maxRounds = 20) {
  let round = 0;
  while (
    _friendsListPageState.mounted &&
    _hasMoreFriends() &&
    round < maxRounds &&
    document.documentElement.scrollHeight <= window.innerHeight + 80
  ) {
    const loaded = loadMoreFriends();
    if (!loaded) break;
    round += 1;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

async function syncFriendsListFromServer({ resetViewport = false } = {}) {
  patchFriendsListState({ loading: true });

  try {
    const [friendsSettled, blockSettled] = await Promise.allSettled([
      getFriendsList(),
      getCurrentUserBlockList_Global(),
    ]);
    const baseFriendsList = friendsSettled.status === "fulfilled" ? friendsSettled.value : [];
    const blockList = blockSettled.status === "fulfilled" ? blockSettled.value : [];

    const mergedFriendsList = _mergeFriendsWithCurrentState(baseFriendsList, blockList);
    const { loadedCount, visibleFriendIds } = _reconcileVisibleState(mergedFriendsList, { resetViewport });

    _friendsListPageState = {
      ..._friendsListPageState,
      friendsList: mergedFriendsList,
      loadedCount,
      visibleFriendIds,
      initialized: true,
      loading: false,
    };
    syncFriendsListState();

    if (loadedCount === 0 && mergedFriendsList.length > 0) {
      loadMoreFriends();
    } else {
      const pendingIds = _getPendingVisibleFriendIds();
      if (pendingIds.length > 0) {
        const version = _nextDetailJobVersion();
        void _enrichVisibleFriendsInBackground(version, pendingIds);
      }
    }
  } catch {
    patchFriendsListState({ loading: false });
  }
}

async function initFriendsListPage() {
  await syncFriendsListFromServer({ resetViewport: true });
  window.removeEventListener("scroll", _onScrollLoadMore);
  window.addEventListener("scroll", _onScrollLoadMore);
  void _ensureFriendsFilledViewport();
}

export async function enterFriendsListPage() {
  patchFriendsListState({ mounted: true });
  const unreadDot = document.getElementById("unread-acceptfriend-dot");
  const needReinit = unreadDot && !unreadDot.classList.contains("hidden");

  if (!_friendsListPageState.initialized) {
    await initFriendsListPage();
  } else {
    await syncFriendsListFromServer({ resetViewport: !!needReinit });
    window.removeEventListener("scroll", _onScrollLoadMore);
    window.addEventListener("scroll", _onScrollLoadMore);
    void _ensureFriendsFilledViewport();
  }
  await markAcceptedFriendsAsRead();
  await updateUnreadAcceptFriendDot();
}

export function exitFriendsListPage() {
  _nextDetailJobVersion();
  patchFriendsListState({ mounted: false });
  window.removeEventListener("scroll", _onScrollLoadMore);
}

export async function reloadFriendsListPage() {
  _nextDetailJobVersion();
  _friendsListPageState = {
    ..._friendsListPageState,
    friendsList: [],
    loadedCount: 0,
    initialized: false,
    loading: false,
    visibleFriendIds: [],
  };
  syncFriendsListState();
  await initFriendsListPage();
}

function _onScrollLoadMore() {
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
  if (nearBottom) {
    const loaded = loadMoreFriends();
    if (loaded) {
      void _ensureFriendsFilledViewport();
    }
  }
}

function loadMoreFriends() {
  if (_friendsListPageState.loading) return;

  const { friendsList, loadedCount, batchSize } = _friendsListPageState;
  if (!Array.isArray(friendsList) || loadedCount >= friendsList.length) return 0;

  patchFriendsListState({ loading: true });

  const nextBatch = friendsList.slice(loadedCount, loadedCount + batchSize);
  const nextLoadedCount = loadedCount + nextBatch.length;
  const nextVisibleFriendIds = [
    ..._friendsListPageState.visibleFriendIds,
    ...nextBatch.map((x) => x?.friend_id).filter(Boolean),
  ];
  patchFriendsListState({
    loadedCount: nextLoadedCount,
    visibleFriendIds: nextVisibleFriendIds,
    loading: false,
  });
  const targets = [...new Set([
    ...nextBatch.map((x) => x?.friend_id).filter(Boolean),
    ..._getPendingVisibleFriendIds(),
  ])];
  if (targets.length > 0) {
    const version = _nextDetailJobVersion();
    void _enrichVisibleFriendsInBackground(version, targets);
  }
  return nextBatch.length;
}
