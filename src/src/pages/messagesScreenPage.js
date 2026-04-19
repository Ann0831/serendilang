import { getCurrentUserBlockList_Global } from "../userSelfData/userSelfData.js";
import {
  fetchSpecificMessageScreenData,
  fetchAllMessageScreenSkeletonsData,
  enrichMessageScreenItemData,
} from "../service/getMessagesScreenData.js";
import { updateState } from "../utils/uiStateAdapter.js";

let _messagesPageState = {
  conversations: [],
  loadedCount: 0,
  batchSize: 3,
  loading: false,
  initialized: false,
  mounted: false,
  visibleConversationIds: [],
};
let _detailJobVersion = 0;
const _conversationRefreshVersion = new Map();

function _timeOfConversation(conv) {
  if (!conv) return 0;
  const ms = Number(conv?.timestamp_ms);
  if (Number.isFinite(ms) && ms > 0) return ms;
  const raw = conv?.timestamp || conv?.updated_at || conv?.last_message_time;
  const t = Date.parse(raw || "");
  return Number.isFinite(t) ? t : 0;
}

function _sortConversationsByLatestTime(list = []) {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) => {
    const aBlocked = !!a?.isBlocked;
    const bBlocked = !!b?.isBlocked;
    if (aBlocked && !bBlocked) return 1;
    if (!aBlocked && bBlocked) return -1;
    return _timeOfConversation(b) - _timeOfConversation(a);
  });
}

function syncMessagesPageState() {
  console.log(_messagesPageState)
  updateState("MessagesPage", _messagesPageState);
}

function patchMessagesPageState(patch) {
  _messagesPageState = { ..._messagesPageState, ...patch };
  syncMessagesPageState();
}

function _nextDetailJobVersion() {
  _detailJobVersion += 1;
  return _detailJobVersion;
}

function _isCurrentDetailJob(version) {
  return version === _detailJobVersion;
}

function _setConversationDetailState(userId, patch) {
  let changed = false;
  const next = _messagesPageState.conversations.map((conv) => {
    if (conv?.other_user?.user_id !== userId) return conv;
    changed = true;
    return { ...conv, ...patch };
  });
  if (!changed) return;
  patchMessagesPageState({ conversations: next });
}

function _getPendingVisibleConversationIds() {
  const visibleSet = new Set(_messagesPageState.visibleConversationIds || []);
  return (_messagesPageState.conversations || [])
    .filter((conv) => visibleSet.has(conv?.other_user?.user_id))
    .filter((conv) => conv?.detailStatus !== "ready" && conv?.detailStatus !== "error")
    .map((conv) => conv?.other_user?.user_id)
    .filter(Boolean);
}

async function _enrichOneConversation(userId, version) {
  if (!_messagesPageState.mounted) return;
  const current = _messagesPageState.conversations.find((x) => x?.other_user?.user_id === userId);
  if (!current || current.detailStatus === "ready" || current.detailStatus === "error") return;

  _setConversationDetailState(userId, { detailStatus: "loading" });
  try {
    const enriched = await enrichMessageScreenItemData(current);
    if (!_messagesPageState.mounted) return;
    _setConversationDetailState(userId, {
      profilePicUrl: enriched?.profilePicUrl || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      language: enriched?.language || { nativelanguage: "?", targetlanguage: "?" },
      detailStatus: "ready",
    });
  } catch {
    if (!_messagesPageState.mounted) return;
    _setConversationDetailState(userId, {
      profilePicUrl: `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      language: { nativelanguage: "?", targetlanguage: "?" },
      detailStatus: "error",
    });
  }
}

async function _enrichVisibleConversations(version, ids = []) {
  const targets = ids.length > 0 ? ids : [..._messagesPageState.visibleConversationIds];
  for (const userId of targets) {
    if (!_messagesPageState.mounted) return;
    await _enrichOneConversation(userId, version);
  }
}

function _hasMoreConversations() {
  const list = _messagesPageState.conversations;
  return Array.isArray(list) && _messagesPageState.loadedCount < list.length;
}

async function _ensureMessagesFilledViewport(maxRounds = 20) {
  let round = 0;
  while (
    _messagesPageState.mounted &&
    _hasMoreConversations() &&
    round < maxRounds &&
    document.documentElement.scrollHeight <= window.innerHeight + 80
  ) {
    const loaded = loadMoreMessageScreens();
    if (!loaded) break;
    round += 1;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

export async function messagesPage_Enter() {
  patchMessagesPageState({ mounted: true });

  const unreadDot = document.getElementById("unread-message-dot");
  const needReinit = unreadDot && !unreadDot.classList.contains("hidden");

  if (_messagesPageState.initialized && !needReinit) {
    window.addEventListener("scroll", _onScrollLoadMore);
    const pendingIds = _getPendingVisibleConversationIds();
    if (pendingIds.length > 0) {
      const version = _nextDetailJobVersion();
      void _enrichVisibleConversations(version, pendingIds);
    }
    return;
  }

  _messagesPageState = {
    conversations: [],
    loadedCount: 0,
    batchSize: 3,
    loading: true,
    initialized: true,
    mounted: true,
    visibleConversationIds: [],
  };
  syncMessagesPageState();

  try {
    let conversations = await fetchAllMessageScreenSkeletonsData();
    if (!Array.isArray(conversations)) conversations = [];

    const blockList = await getCurrentUserBlockList_Global().catch(() => []);
    if (Array.isArray(blockList)) {
      conversations = conversations
        .map((conv) => ({
          ...conv,
          isBlocked: blockList.includes(conv?.other_user?.user_id),
          profilePicUrl: "",
          language: null,
          detailStatus: "loading",
          uiStatus: "idle",
        }));
    }
    conversations = _sortConversationsByLatestTime(conversations);

    _messagesPageState.conversations = conversations;
    _messagesPageState.loading = false;
    syncMessagesPageState();

    loadMoreMessageScreens();
    window.addEventListener("scroll", _onScrollLoadMore);
    void _ensureMessagesFilledViewport();

    // TODO: 呼叫 UI 層 React render 函式
  } catch {
    patchMessagesPageState({ loading: false });
  }
}

export function messagesPage_Leave() {
  _nextDetailJobVersion();
  patchMessagesPageState({ mounted: false });
  window.removeEventListener("scroll", _onScrollLoadMore);
}

function _onScrollLoadMore() {
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
  if (nearBottom) {
    const loaded = loadMoreMessageScreens();
    if (loaded) {
      void _ensureMessagesFilledViewport();
    }
  }
}

function loadMoreMessageScreens() {
  if (_messagesPageState.loading) return;

  const { conversations, loadedCount, batchSize } = _messagesPageState;
  if (!Array.isArray(conversations) || loadedCount >= conversations.length) return 0;

  patchMessagesPageState({ loading: true });

  const nextBatch = conversations.slice(loadedCount, loadedCount + batchSize);
  const nextLoadedCount = loadedCount + nextBatch.length;
  const nextVisibleConversationIds = [
    ..._messagesPageState.visibleConversationIds,
    ...nextBatch.map((x) => x?.other_user?.user_id).filter(Boolean),
  ];
  patchMessagesPageState({
    loadedCount: nextLoadedCount,
    visibleConversationIds: nextVisibleConversationIds,
    loading: false,
  });
  const targets = [...new Set([
    ...nextBatch.map((x) => x?.other_user?.user_id).filter(Boolean),
    ..._getPendingVisibleConversationIds(),
  ])];
  if (targets.length > 0) {
    const version = _nextDetailJobVersion();
    void _enrichVisibleConversations(version, targets);
  }
  return nextBatch.length;

  // TODO: 呼叫 UI 層 React render 函式
}

export async function reloadMessagesPage() {
  _nextDetailJobVersion();
  _messagesPageState = {
    ..._messagesPageState,
    conversations: [],
    loadedCount: 0,
    loading: true,
    visibleConversationIds: [],
    initialized: true,
  };
  syncMessagesPageState();

  try {
    let conversations = await fetchAllMessageScreenSkeletonsData();
    if (!Array.isArray(conversations)) conversations = [];
    const blockList = await getCurrentUserBlockList_Global().catch(() => []);

    if (Array.isArray(blockList)) {
      conversations = conversations
        .map((conv) => ({
          ...conv,
          isBlocked: blockList.includes(conv?.other_user?.user_id),
          profilePicUrl: "",
          language: null,
          detailStatus: "loading",
          uiStatus: "idle",
        }));
    }
    conversations = _sortConversationsByLatestTime(conversations);

    _messagesPageState.conversations = conversations;
    _messagesPageState.loading = false;
    syncMessagesPageState();
    loadMoreMessageScreens();
    void _ensureMessagesFilledViewport();
  } catch {
    _messagesPageState.loading = false;
    syncMessagesPageState();
  }
}

export async function refreshSingleConversation(target_user_id, options = {}) {
  if (!_messagesPageState.initialized) return;
  if (!target_user_id) return;

  const userId = String(target_user_id);
  const requestVersion = (_conversationRefreshVersion.get(userId) || 0) + 1;
  _conversationRefreshVersion.set(userId, requestVersion);

  const updatedConv = await fetchSpecificMessageScreenData(userId);
  if (!updatedConv || typeof updatedConv !== "object") return;
  if ((_conversationRefreshVersion.get(userId) || 0) !== requestVersion) return;

  const prev = _messagesPageState.conversations.find(
    (c) => c?.other_user?.user_id === userId,
  ) || null;
  const prevTime = _timeOfConversation(prev);
  const nextTime = _timeOfConversation(updatedConv);
  const saferConv = prev && prevTime > nextTime
    ? {
        ...updatedConv,
        messageText: prev?.messageText,
        timestamp: prev?.timestamp,
        sender_id: prev?.sender_id,
        is_read: prev?.is_read,
      }
    : updatedConv;
  const optimisticMs = Number(options?.optimisticTimestampMs) || 0;
  const shouldForceTop = options?.forceTop === true;
  const mergedTimeMs = shouldForceTop ? Math.max(prevTime, nextTime, optimisticMs, Date.now()) : Math.max(prevTime, nextTime);
  const safeTimestampMs = Number.isFinite(mergedTimeMs) && mergedTimeMs > 0 ? mergedTimeMs : nextTime;
  const safeTimestampIso =
    safeTimestampMs > 0 ? new Date(safeTimestampMs).toISOString() : (saferConv?.timestamp || prev?.timestamp || null);
  const mergedConv = {
    ...(prev || {}),
    ...saferConv,
    other_user: {
      ...(prev?.other_user || {}),
      ...(saferConv?.other_user || {}),
    },
    profilePicUrl: prev?.profilePicUrl || "",
    language: prev?.language || null,
    detailStatus: prev?.detailStatus || "loading",
    isBlocked: prev?.isBlocked || false,
    timestamp: safeTimestampIso,
    timestamp_ms: safeTimestampMs || undefined,
    uiStatus: "idle",
  };

  const nextConversations = (_messagesPageState.conversations || []).filter(
    (c) => c?.other_user?.user_id !== userId,
  );
  nextConversations.unshift(mergedConv);
  const sortedConversations = _sortConversationsByLatestTime(nextConversations);

  const nextVisibleConversationIds = [
    userId,
    ...(_messagesPageState.visibleConversationIds || []).filter((x) => x !== userId),
  ];

  patchMessagesPageState({
    conversations: sortedConversations,
    visibleConversationIds: nextVisibleConversationIds,
    loadedCount: Math.min(
      Math.max(_messagesPageState.loadedCount, nextVisibleConversationIds.length),
      sortedConversations.length,
    ),
  });

  const version = _nextDetailJobVersion();
  void _enrichVisibleConversations(version, [userId]);
  // TODO: 呼叫 UI 層 React render 函式
}

export function bumpConversationActivity(target_user_id, payload = {}) {
  if (!_messagesPageState.initialized) return;
  if (!target_user_id) return;

  const userId = String(target_user_id);
  const prev = (_messagesPageState.conversations || []).find(
    (c) => c?.other_user?.user_id === userId,
  ) || null;
  if (!prev) return;

  const nextMs = Number(payload?.timestamp_ms) || Date.now();
  const nextIso = payload?.timestamp || new Date(nextMs).toISOString();
  const next = {
    ...prev,
    messageText: typeof payload?.messageText === "string" ? payload.messageText : prev?.messageText,
    sender_id: payload?.sender_id || prev?.sender_id,
    is_read: payload?.is_read ?? prev?.is_read,
    timestamp: nextIso,
    timestamp_ms: nextMs,
    uiStatus: "idle",
  };

  const rest = (_messagesPageState.conversations || []).filter(
    (c) => c?.other_user?.user_id !== userId,
  );
  const sortedConversations = _sortConversationsByLatestTime([next, ...rest]);
  const nextVisibleConversationIds = [
    userId,
    ...(_messagesPageState.visibleConversationIds || []).filter((x) => x !== userId),
  ];

  patchMessagesPageState({
    conversations: sortedConversations,
    visibleConversationIds: nextVisibleConversationIds,
    loadedCount: Math.min(
      Math.max(_messagesPageState.loadedCount, nextVisibleConversationIds.length),
      sortedConversations.length,
    ),
  });
}
