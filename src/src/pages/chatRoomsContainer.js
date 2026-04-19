import React from "react";
import { createRoot } from "react-dom/client";
import { getCurrentUserBlockList_Global } from "../userSelfData/userSelfData.js";
import { getChatRoomData, getChatMessages } from "../service/getChatRoomData.js";
import { updateState, getState } from "../utils/uiStateAdapter.js";
import ChatRoomsContainerView from "../ui/pages/ChatRoomsContainer.jsx";

const MAX_CHATROOMS = 2;
const toKey = (id) => String(id);

let activeChatRooms = [];
let hiddenChatRooms = [];
const chatRoomLocks = new Map();
const chatRoomMessageLoadLocks = new Set();
let chatRoomMeta = Object.create(null);
const chatRoomRevisions = Object.create(null);
let chatRoot = null;

function readState() {
  return getState("ChatRoomsContainer") || {};
}

function syncChatRoomsState() {
  updateState("ChatRoomsContainer", {
    ...readState(),
    activeChatRooms: [...activeChatRooms],
    hiddenChatRooms: [...hiddenChatRooms],
    lockCount: chatRoomLocks.size,
    messageLoadLockCount: chatRoomMessageLoadLocks.size,
    chatRoomMeta: { ...chatRoomMeta },
  });
}

function patchChatMeta(userId, patch) {
  const id = toKey(userId);
  const prev = chatRoomMeta[id] || {};
  chatRoomMeta = {
    ...chatRoomMeta,
    [id]: { ...prev, ...patch },
  };
  syncChatRoomsState();
}

export async function setChatRoomIncomingCall(userId, active, patch = {}) {
  const id = toKey(userId);
  // Ensure room exists immediately, but do not block incoming-call UI on data loading.
  ensureChatMeta(id).catch(() => {});
  const nextPatch = {
    incomingCall: !!active,
    incomingCallAt: !!active ? Date.now() : null,
    ...patch,
  };
  patchChatMeta(id, nextPatch);
}

function resetRoomState(userId) {
  const id = toKey(userId);
  chatRoomRevisions[id] = (chatRoomRevisions[id] || 0) + 1;
  activeChatRooms = activeChatRooms.filter((x) => x !== id);
  hiddenChatRooms = hiddenChatRooms.filter((x) => x !== id);
  chatRoomLocks.delete(id);
  chatRoomMessageLoadLocks.delete(id);
  const next = { ...chatRoomMeta };
  delete next[id];
  chatRoomMeta = next;
}

function mergeMessages(prevMessages = [], incoming = []) {
  const map = new Map();
  [...prevMessages, ...incoming].forEach((m) => {
    if (!m?.message_id) return;
    map.set(m.message_id, m);
  });
  return [...map.values()].sort((a, b) => (a?.timestamp_ms || 0) - (b?.timestamp_ms || 0));
}

function normalizeMessagesWithTailSent(messages = []) {
  const normalized = (Array.isArray(messages) ? messages : []).map((m) => {
    const next = { ...m };
    if (next.deliveryStatus) delete next.deliveryStatus;
    return next;
  });
  const last = normalized[normalized.length - 1];
  if (last?.fromSelf) {
    last.deliveryStatus = "sent";
  }
  return normalized;
}

function findFirstMessageNode(messagesDiv) {
  if (!messagesDiv) return null;
  const nodes = messagesDiv.querySelectorAll?.("[data-message-id]");
  if (!nodes || nodes.length === 0) return null;
  return nodes[0] || null;
}

function findMessageNodeById(messagesDiv, messageId) {
  if (!messagesDiv || !messageId) return null;
  const nodes = messagesDiv.querySelectorAll?.("[data-message-id]");
  if (!nodes || nodes.length === 0) return null;
  for (const node of nodes) {
    if (node?.getAttribute?.("data-message-id") === messageId) return node;
  }
  return null;
}

function buildPendingMessageId(userId) {
  return `pending_${toKey(userId)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function updateMessageById(userId, messageId, updater) {
  const id = toKey(userId);
  const meta = chatRoomMeta[id];
  if (!meta || !Array.isArray(meta.messages)) return false;
  let changed = false;
  const nextMessages = meta.messages.map((m) => {
    if (m?.message_id !== messageId) return m;
    changed = true;
    return updater(m);
  });
  if (!changed) return false;
  patchChatMeta(id, { messages: nextMessages, lastLocalSendAt: Date.now() });
  return true;
}

function isTempLocalMessage(msg) {
  const mid = String(msg?.message_id || "");
  return mid.startsWith("pending_") || msg?.deliveryStatus === "pending" || msg?.deliveryStatus === "failed";
}

export function initChatRoomsContainer() {
  let container = document.getElementById("chatRoomsContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "chatRoomsContainer";
    document.body.appendChild(container);
  }

  if (!chatRoot) {
    chatRoot = createRoot(container);
    chatRoot.render(React.createElement(ChatRoomsContainerView));
  }
  return container;
}

async function ensureChatMeta(id) {
  if (chatRoomMeta[id]) return chatRoomMeta[id];
  const revision = chatRoomRevisions[id] || 0;

      chatRoomMeta = {
      ...chatRoomMeta,
      [id]: {
        userId: id,
        isBlocked: false,
      data: null,
      messages: [],
        loading: true,
        loadingMessages: false,
        incomingCall: false,
        incomingCallAt: null,
        inputText: "",
        uiStatus: "loading",
      },
    };
  syncChatRoomsState();

  try {
    const [blockSettled, dataSettled, messagesSettled] = await Promise.allSettled([
      getCurrentUserBlockList_Global(),
      getChatRoomData(id),
      getChatMessages(id, 20),
    ]);
    const blockList = blockSettled.status === "fulfilled" ? blockSettled.value : [];
    const data = dataSettled.status === "fulfilled" ? dataSettled.value : null;
    const messages = messagesSettled.status === "fulfilled" ? messagesSettled.value : [];

    if ((chatRoomRevisions[id] || 0) !== revision) {
      return chatRoomMeta[id] || null;
    }

    const prevMeta = chatRoomMeta[id] || {};
    const keepIncoming = !!prevMeta.incomingCall;
    const keepIncomingAt = keepIncoming
      ? (Number(prevMeta.incomingCallAt) || Date.now())
      : null;

    chatRoomMeta = {
      ...chatRoomMeta,
      [id]: {
        ...prevMeta,
        userId: id,
        isBlocked: Array.isArray(blockList) ? blockList.includes(id) : false,
        data: data || null,
        messages: normalizeMessagesWithTailSent(Array.isArray(messages) ? messages : []),
        loading: false,
        loadingMessages: false,
        incomingCall: keepIncoming,
        incomingCallAt: keepIncomingAt,
        inputText: "",
        uiStatus: data ? "ready" : "error",
      },
    };
    syncChatRoomsState();
    return chatRoomMeta[id];
  } catch (error) {
    patchChatMeta(id, {
      loading: false,
      loadingMessages: false,
      uiStatus: "error",
    });
    return chatRoomMeta[id];
  }
}

export async function openChatRoom(userId) {
  const id = toKey(userId);
  const container = initChatRoomsContainer();
  if (!container) return null;

  if (chatRoomLocks.has(id)) return chatRoomLocks.get(id);

  let resolver;
  const lockPromise = new Promise((resolve) => {
    resolver = resolve;
  });
  chatRoomLocks.set(id, lockPromise);
  syncChatRoomsState();

  try {
    // Start loading metadata/messages in background so UI can show skeleton immediately.
    ensureChatMeta(id).catch(() => {});

    if (activeChatRooms.includes(id)) {
      activeChatRooms = activeChatRooms.filter((x) => x !== id);
      activeChatRooms.push(id);
      syncChatRoomsState();
      resolver(container);
      return container;
    }

    if (hiddenChatRooms.includes(id)) {
      hiddenChatRooms = hiddenChatRooms.filter((x) => x !== id);
      activeChatRooms.push(id);

      if (activeChatRooms.length > MAX_CHATROOMS) {
        const oldestId = activeChatRooms.shift();
        await hideChatRoom(oldestId);
      }

      syncChatRoomsState();
      resolver(container);
      return container;
    }

    if (activeChatRooms.length >= MAX_CHATROOMS) {
      const oldestId = activeChatRooms.shift();
      await hideChatRoom(oldestId);
    }

    activeChatRooms.push(id);
    syncChatRoomsState();
    resolver(container);
    return container;
  } finally {
    chatRoomLocks.delete(id);
    syncChatRoomsState();
  }
}

export async function hideChatRoom(userId) {
  const id = toKey(userId);
  activeChatRooms = activeChatRooms.filter((x) => x !== id);
  if (!hiddenChatRooms.includes(id)) hiddenChatRooms.push(id);
  syncChatRoomsState();
}

export async function closeChatRoom(userId) {
  resetRoomState(userId);
  syncChatRoomsState();

  while (hiddenChatRooms.length > 0 && activeChatRooms.length < MAX_CHATROOMS) {
    const nextId = hiddenChatRooms.shift();
    await openChatRoom(nextId);
  }
}

export function closeAllChatRooms() {
  activeChatRooms = [];
  hiddenChatRooms = [];
  chatRoomMeta = Object.create(null);
  chatRoomMessageLoadLocks.clear();
  syncChatRoomsState();
}

export function checkChatRoomStatus(userId) {
  const id = toKey(userId);
  if (activeChatRooms.includes(id)) return "active";
  if (hiddenChatRooms.includes(id)) return "hidden";
  return "none";
}

export async function handleLoadMoreMessages(wrapper, extraParams = {}) {
  const userId = wrapper?.dataset?.userId;
  if (!userId) return;
  const id = toKey(userId);
  const meta = chatRoomMeta[id] || (await ensureChatMeta(id));
  if (!meta) return;
  if (meta.loading || meta.loadingMessages) return;
  if (chatRoomMessageLoadLocks.has(id)) return;
  chatRoomMessageLoadLocks.add(id);
  const revision = chatRoomRevisions[id] || 0;

  const messagesDiv = wrapper?.querySelector?.(".messages-container");
  const prevScrollTop = typeof messagesDiv?.scrollTop === "number" ? messagesDiv.scrollTop : 0;
  const prevScrollHeight = typeof messagesDiv?.scrollHeight === "number" ? messagesDiv.scrollHeight : 0;
  const prevAnchorNode = findFirstMessageNode(messagesDiv);
  const prevAnchorId = prevAnchorNode?.getAttribute?.("data-message-id") || "";
  const prevAnchorOffset = prevAnchorNode && messagesDiv
    ? prevAnchorNode.getBoundingClientRect().top - messagesDiv.getBoundingClientRect().top
    : null;

  patchChatMeta(id, { loadingMessages: true });
  try {
    let fetchAmount = extraParams?.amount;
    if (!fetchAmount) {
      const currentCount = Array.isArray(meta.messages) ? meta.messages.length : 0;
      if (currentCount < 15) fetchAmount = 20;
      else if (currentCount < 40) fetchAmount = 50;
      else fetchAmount = "all";
    }
    const normalizedAmount =
      fetchAmount === "all"
        ? "all"
        : (Number.isFinite(Number(fetchAmount)) && Number(fetchAmount) > 0 ? Number(fetchAmount) : 50);
    const fetched = await getChatMessages(id, normalizedAmount);
    if ((chatRoomRevisions[id] || 0) !== revision || !chatRoomMeta[id]) return;
    const merged = mergeMessages(meta.messages || [], Array.isArray(fetched) ? fetched : []);
    patchChatMeta(id, {
      messages: normalizeMessagesWithTailSent(merged),
      loadingMessages: false,
    });

    if (extraParams?.keepLoc && messagesDiv) {
      requestAnimationFrame(() => {
        if (prevAnchorId && prevAnchorOffset !== null) {
          const nextAnchorNode = findMessageNodeById(messagesDiv, prevAnchorId);
          if (nextAnchorNode) {
            const nextAnchorOffset = nextAnchorNode.getBoundingClientRect().top - messagesDiv.getBoundingClientRect().top;
            messagesDiv.scrollTop += nextAnchorOffset - prevAnchorOffset;
            return;
          }
        }
        const nextHeight = messagesDiv.scrollHeight;
        const diff = nextHeight - prevScrollHeight;
        messagesDiv.scrollTop = Math.max(0, prevScrollTop + diff);
      });
    } else if (extraParams?.toBottom && messagesDiv) {
      requestAnimationFrame(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      });
    }
  } catch {
    patchChatMeta(id, { loadingMessages: false });
  } finally {
    chatRoomMessageLoadLocks.delete(id);
  }
}

export function appendPendingOutgoingMessage(userId, text) {
  const id = toKey(userId);
  const meta = chatRoomMeta[id];
  if (!meta) return null;
  const pendingId = buildPendingMessageId(id);
  const nowMs = Date.now();
  const pendingMsg = {
    message_id: pendingId,
    fromSelf: true,
    text: text || "",
    timestamp: new Date(nowMs).toISOString(),
    timestamp_ms: nowMs,
    deliveryStatus: "pending",
  };
  const nextMessages = mergeMessages(meta.messages || [], [pendingMsg]);
  patchChatMeta(id, { messages: nextMessages, lastLocalSendAt: nowMs });
  return pendingId;
}

export function confirmOutgoingMessageSent(userId, pendingId, payload = {}) {
  if (!pendingId) return;
  const id = toKey(userId);
  const serverMessageId = payload?.message_id ? String(payload.message_id) : null;
  updateMessageById(id, pendingId, (m) => ({
    ...m,
    message_id: serverMessageId || m.message_id,
    timestamp: payload?.timestamp || m.timestamp,
    timestamp_ms: payload?.timestamp_ms || m.timestamp_ms,
    deliveryStatus: "sent",
  }));
}

export function markOutgoingMessageFailed(userId, pendingId) {
  if (!pendingId) return;
  const id = toKey(userId);
  updateMessageById(id, pendingId, (m) => ({
    ...m,
    deliveryStatus: "failed",
  }));
}

export async function reconcileChatRoomWithLatest(userId, amount = 20) {
  const id = toKey(userId);
  const meta = chatRoomMeta[id] || (await ensureChatMeta(id));
  if (!meta) return;

  try {
    const latest = await getChatMessages(id, amount);
    const base = Array.isArray(meta.messages)
      ? meta.messages.filter((m) => !isTempLocalMessage(m))
      : [];
    const merged = mergeMessages(base, Array.isArray(latest) ? latest : []);
    patchChatMeta(id, { messages: normalizeMessagesWithTailSent(merged) });
  } catch {
    // no-op
  }
}
