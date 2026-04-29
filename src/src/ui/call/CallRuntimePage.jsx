import React, { useEffect, useMemo, useRef, useState } from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState } from "../StateViewBase.jsx";
import { toAvatarSrc, UI_DEFAULT_AVATAR_SRC } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";
import { formatLanguageName } from "../../utils/language/languageDisplay.js";
import { formatChatSeparatorDateTime } from "../../utils/dateTimeFormat.js";
import { safeNaviagate } from "../../utils/safeNavigate.js";

function detectLocale() {
  if (typeof navigator === "undefined") return "en";
  const lang = String(navigator.language || "").toLowerCase();
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

const CALL_TEXT = {
  en: {
    hideChat: "Hide Chat",
    showChat: "Show Chat",
    cameraOff: "Camera Off",
    readyToStart: "Ready to Start the Call?",
    start: "Start",
    callEnded: "Call Ended",
    viewProfile: "View Profile",
    close: "Close",
  },
  zh: {
    hideChat: "隱藏聊天",
    showChat: "顯示聊天",
    cameraOff: "關閉鏡頭",
    readyToStart: "準備開始通話了嗎？",
    start: "開始",
    callEnded: "通話結束",
    viewProfile: "查看個人頁",
    close: "關閉",
  },
};

const FALLBACK = {
  isCaller: false,
  isApp: false,
  targetId: "",
  showStartOverlay: false,
  showDialingOverlay: false,
  dialingText: "Dialing...",
  dialingButtonText: "Cancel",
  showEndCallButton: false,
  showTimeoutOverlay: false,
  showDisconnectedOverlay: false,
  showIceReconnectingOverlay: false,
  showWssDisconnectedNotice: false,
  targetIdentity: {
    username: "Loading...",
    avatarUrl: UI_DEFAULT_AVATAR_SRC,
    langInfo: { nativelanguage: "?", targetlanguage: "?" },
  },
  callEndOverlay: { visible: false, countdown: 10, fallbackOnly: false, username: "Unknown", avatarUrl: UI_DEFAULT_AVATAR_SRC, langText: "", targetId: "" },
  stopSignOverlay: { visible: false, message: "", username: "", avatarUrl: "", langText: "", targetId: "" },
  initError: { visible: false, message: "" },
};

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

function mergeMessages(prevMessages = [], incoming = []) {
  const map = new Map();
  [...prevMessages, ...incoming].forEach((m) => {
    const key = String(m?.message_id || `${m?.timestamp_ms || 0}-${m?.fromSelf ? "1" : "0"}-${m?.text || ""}`);
    map.set(key, m);
  });
  return [...map.values()].sort((a, b) => (a?.timestamp_ms || 0) - (b?.timestamp_ms || 0));
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

const MESSAGE_FETCH_AMOUNTS = ["10", "20", "50", "all"];
const CHAT_SPLIT_RATIO = 0.75;

function shouldDefaultChatOpen() {
  if (typeof window === "undefined") return true;
  const w = Math.max(1, window.innerWidth || 1);
  const h = Math.max(1, window.innerHeight || 1);
  return (w / h) > CHAT_SPLIT_RATIO;
}

function normalizeFetchAmount(value) {
  const raw = String(value ?? "").trim();
  return MESSAGE_FETCH_AMOUNTS.includes(raw) ? raw : "50";
}

function getNextFetchAmount(current) {
  const now = normalizeFetchAmount(current);
  const idx = MESSAGE_FETCH_AMOUNTS.indexOf(now);
  if (idx < 0 || idx >= MESSAGE_FETCH_AMOUNTS.length - 1) return null;
  return MESSAGE_FETCH_AMOUNTS[idx + 1];
}

function MessageBubble({ msg, profilePicUrl }) {
  const fromSelf = !!msg?.fromSelf;
  const status = msg?.deliveryStatus || "";
  const selfPending = fromSelf && status === "pending";
  const selfSent = fromSelf && status === "sent";
  const selfFailed = fromSelf && status === "failed";

  return (
    <div
      data-message-id={String(msg?.message_id || "")}
      className={fromSelf ? "w-full min-w-0 flex flex-col items-end mb-2 justify-end" : "w-full min-w-0 flex items-end mb-2 justify-start"}
    >
      {!fromSelf ? (
        <AvatarImage src={toAvatarSrc(profilePicUrl)} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-300 mr-2 flex-shrink-0" />
      ) : null}
      <div
        className={fromSelf
          ? `min-w-0 px-3 py-2 rounded-2xl max-w-[70%] text-sm leading-snug shadow break-words break-all whitespace-pre-wrap overflow-hidden rounded-br-none ${selfPending ? "bg-indigo-300 text-white" : selfFailed ? "bg-red-300 text-white" : "bg-indigo-500 text-white"}`
          : "min-w-0 px-3 py-2 rounded-2xl max-w-[70%] text-sm leading-snug shadow break-words break-all whitespace-pre-wrap overflow-hidden bg-gray-200 text-gray-900 rounded-bl-none"}
      >
        {msg?.text || ""}
      </div>
      {fromSelf && selfSent ? <div className="text-[11px] text-gray-400 mt-1 mr-1">sent</div> : null}
      {fromSelf && selfFailed ? <div className="text-[11px] text-red-500 mt-1 mr-1">failed</div> : null}
    </div>
  );
}

export default function CallRuntimePage() {
  const text = CALL_TEXT[detectLocale()] || CALL_TEXT.en;
  const s = useSubscribedState("CallRuntimePage", FALLBACK);
  const safeTargetId = String(s.targetId || "");
  const canShowChat = !s.isApp && !!safeTargetId;
  const [chatOpen, setChatOpen] = useState(() => shouldDefaultChatOpen());
  const [chatRows, setChatRows] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLoadingMore, setChatLoadingMore] = useState(false);
  const [chatHasMore, setChatHasMore] = useState(true);
  const [draft, setDraft] = useState("");
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [viewportRatio, setViewportRatio] = useState(() => {
    const w = Math.max(1, window.innerWidth || 1);
    const h = Math.max(1, window.innerHeight || 1);
    return w / h;
  });
  const chatListRef = useRef(null);
  const inputRef = useRef(null);
  const chatFetchAmountRef = useRef("50");
  const chatLoadMoreLockRef = useRef(false);
  const chatReqSeqRef = useRef(0);
  const chatPendingLoadsRef = useRef(new Map());
  const didAutoScrollOnOpenRef = useRef(false);
  const prevFirstMessageIdRef = useRef("");
  const prevLastMessageIdRef = useRef("");
  const shouldStickBottomRef = useRef(true);
  const splitLeftRight = viewportRatio > CHAT_SPLIT_RATIO;
  const showChatPane = canShowChat && chatOpen;
  const rootDirectionClass = showChatPane ? (splitLeftRight ? "flex-row" : "flex-col") : "flex-col";
  const callPaneClass = showChatPane
    ? (splitLeftRight ? "w-1/2 h-full" : "w-full h-1/2")
    : "w-full h-full";
  const chatPaneClass = showChatPane
    ? (splitLeftRight ? "w-1/2 h-full border-l border-gray-200" : "w-full h-1/2 border-t border-gray-200")
    : "hidden";

  const nextChatRequestId = () => {
    chatReqSeqRef.current += 1;
    return `call-chat-${Date.now()}-${chatReqSeqRef.current}`;
  };

  const loadChatMessages = async ({ amount = chatFetchAmountRef.current, merge = false } = {}) => {
    if (!canShowChat) return;
    if (merge) setChatLoadingMore(true);
    else setChatLoading(true);
    const requestId = nextChatRequestId();
    console.log("[call-ui] chat load start", {
      requestId,
      targetId: safeTargetId,
      amount,
      merge,
      canShowChat,
    });
    try {
      const normalizedAmount = normalizeFetchAmount(amount);
      const rows = await new Promise((resolve, reject) => {
        chatPendingLoadsRef.current.set(requestId, { resolve, reject });
        eventBus.emit("callPage:chatLoadRequested", {
          request_id: requestId,
          target_id: safeTargetId,
          amount: normalizedAmount,
          from: "ui/call/chatLoad",
        });
      });
      const normalized = normalizeMessagesWithTailSent(Array.isArray(rows) ? rows : []);
      console.log("[call-ui] chat load resolved", {
        requestId,
        rows: Array.isArray(rows) ? rows.length : -1,
      });
      chatFetchAmountRef.current = normalizedAmount;
      if (!merge) {
        setChatRows(normalized);
      } else {
        let grew = false;
        setChatRows((prev) => {
          const merged = normalizeMessagesWithTailSent(mergeMessages(prev, normalized));
          grew = merged.length > prev.length;
          return merged;
        });
        if (!grew) setChatHasMore(false);
      }
    } catch (err) {
      console.warn("[call-ui] loadChatMessages failed:", err);
    } finally {
      if (merge) setChatLoadingMore(false);
      else setChatLoading(false);
      console.log("[call-ui] chat load end", {
        requestId,
        merge,
      });
    }
  };

  useEffect(() => {
    const onResize = () => {
      const w = Math.max(1, window.innerWidth || 1);
      const h = Math.max(1, window.innerHeight || 1);
      setViewportRatio(w / h);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!canShowChat) return;
    setChatOpen(shouldDefaultChatOpen());
    chatFetchAmountRef.current = "50";
    setChatHasMore(true);
    setChatRows([]);
    didAutoScrollOnOpenRef.current = false;
    prevFirstMessageIdRef.current = "";
    prevLastMessageIdRef.current = "";
    shouldStickBottomRef.current = true;
  }, [canShowChat, safeTargetId]);

  useEffect(() => {
    if (!canShowChat) return;
    void loadChatMessages({ amount: chatFetchAmountRef.current, merge: false });
  }, [canShowChat, safeTargetId]);

  useEffect(() => {
    if (!canShowChat) return;
    const onChatSyncRequested = (params = {}) => {
      const fromId = String(params?.from_id || "");
      const toId = String(params?.to_id || "");
      if (fromId === safeTargetId || toId === safeTargetId) {
        void loadChatMessages({ amount: chatFetchAmountRef.current, merge: false });
      }
    };
    eventBus.on("callPage:chatSyncRequested", onChatSyncRequested);
    return () => {
      eventBus.off("callPage:chatSyncRequested", onChatSyncRequested);
    };
  }, [canShowChat, safeTargetId]);

  useEffect(() => {
    const onLoaded = (params = {}) => {
      const requestId = String(params?.request_id || "");
      if (!requestId) return;
      const rec = chatPendingLoadsRef.current.get(requestId);
      if (!rec) return;
      chatPendingLoadsRef.current.delete(requestId);
      rec.resolve(Array.isArray(params?.rows) ? params.rows : []);
    };

    const onLoadFailed = (params = {}) => {
      const requestId = String(params?.request_id || "");
      if (!requestId) return;
      const rec = chatPendingLoadsRef.current.get(requestId);
      if (!rec) return;
      chatPendingLoadsRef.current.delete(requestId);
      rec.reject(params?.error || new Error("chat_load_failed"));
    };

    const onSendSucceeded = (params = {}) => {
      const pendingId = String(params?.pending_id || "");
      if (!pendingId) return;
      setChatRows((prev) => prev.filter((m) => String(m?.message_id || "") !== pendingId));
      void loadChatMessages({ amount: chatFetchAmountRef.current, merge: false });
    };

    const onSendFailed = (params = {}) => {
      const pendingId = String(params?.pending_id || "");
      if (!pendingId) return;
      setChatRows((prev) => prev.map((m) => (
        m?.message_id === pendingId ? { ...m, deliveryStatus: "failed" } : m
      )));
    };

    eventBus.on("callPage:chatLoaded", onLoaded);
    eventBus.on("callPage:chatLoadFailed", onLoadFailed);
    eventBus.on("callPage:chatSendSucceeded", onSendSucceeded);
    eventBus.on("callPage:chatSendFailed", onSendFailed);
    return () => {
      eventBus.off("callPage:chatLoaded", onLoaded);
      eventBus.off("callPage:chatLoadFailed", onLoadFailed);
      eventBus.off("callPage:chatSendSucceeded", onSendSucceeded);
      eventBus.off("callPage:chatSendFailed", onSendFailed);
      for (const [, rec] of chatPendingLoadsRef.current.entries()) {
        rec.reject(new Error("chat_load_cancelled"));
      }
      chatPendingLoadsRef.current.clear();
    };
  }, [safeTargetId, canShowChat]);

  useEffect(() => {
    if (didAutoScrollOnOpenRef.current) return;
    const el = chatListRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    didAutoScrollOnOpenRef.current = true;
  }, [chatRows.length]);

  useEffect(() => {
    const el = chatListRef.current;
    if (!el) return;
    const firstId = String(chatRows[0]?.message_id || "");
    const lastId = String(chatRows[chatRows.length - 1]?.message_id || "");
    const prevFirstId = prevFirstMessageIdRef.current;
    const prevLastId = prevLastMessageIdRef.current;
    prevFirstMessageIdRef.current = firstId;
    prevLastMessageIdRef.current = lastId;

    if (!lastId || lastId === prevLastId) return;
    const isPrependLoad = !!prevFirstId && firstId !== prevFirstId && lastId === prevLastId;
    if (isPrependLoad) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [chatRows]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "36px";
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${Math.max(36, next)}px`;
  }, [draft]);

  const chatMessageNodes = useMemo(() => {
    const rows = Array.isArray(chatRows) ? chatRows.slice(-100) : [];
    const profilePicUrl = toAvatarSrc(s.targetIdentity.avatarUrl);
    const nodes = [];
    const GAP_MS = 180 * 1000;
    for (let i = 0; i < rows.length; i += 1) {
      const curr = rows[i];
      const prev = i > 0 ? rows[i - 1] : null;
      const currMs = Number(curr?.timestamp_ms || 0);
      const prevMs = Number(prev?.timestamp_ms || 0);
      if (i === 0 && currMs > 0) {
        nodes.push(
          <div key={`sep-first-call-${curr?.message_id || i}`} className="w-full flex justify-center py-1">
            <span className="text-[11px] text-gray-400">{formatChatSeparatorDateTime(currMs)}</span>
          </div>
        );
      }
      if (i > 0 && currMs > 0 && prevMs > 0 && currMs - prevMs > GAP_MS) {
        nodes.push(
          <div key={`sep-call-${curr?.message_id || i}`} className="w-full flex justify-center py-1">
            <span className="text-[11px] text-gray-400">{formatChatSeparatorDateTime(currMs)}</span>
          </div>
        );
      }
      nodes.push(
        <MessageBubble
          key={curr?.message_id || `${curr?.timestamp_ms || 0}-${curr?.text || ""}-${i}`}
          msg={curr}
          profilePicUrl={profilePicUrl}
        />
      );
    }
    return nodes;
  }, [chatRows, s.targetIdentity.avatarUrl]);

  const sendChatNow = async () => {
    if (!canShowChat) return;
    const text = String(draft || "").trim();
    if (!text) return;

    const pendingId = `call_pending_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setDraft("");
    setShowEmojiMenu(false);
    setChatRows((prev) => [...prev, { message_id: pendingId, fromSelf: true, text, deliveryStatus: "pending" }]);

    eventBus.emit("callPage:chatSendRequested", {
      target_id: safeTargetId,
      text,
      pending_id: pendingId,
      from: "ui/call/sendMessage",
    });
  };

  const onChatScroll = async (e) => {
    const el = e.currentTarget;
    if (!el) return;
    shouldStickBottomRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    if (el.scrollTop > 5) return;
    if (chatLoading || chatLoadingMore || !chatHasMore) return;
    if (chatLoadMoreLockRef.current) return;

    const nextAmount = getNextFetchAmount(chatFetchAmountRef.current);
    if (!nextAmount) {
      setChatHasMore(false);
      return;
    }

    chatLoadMoreLockRef.current = true;
    const prevScrollTop = el.scrollTop;
    const prevScrollHeight = el.scrollHeight;
    const prevAnchorNode = findFirstMessageNode(el);
    const prevAnchorId = prevAnchorNode?.getAttribute?.("data-message-id") || "";
    const prevAnchorOffset = prevAnchorNode
      ? prevAnchorNode.getBoundingClientRect().top - el.getBoundingClientRect().top
      : null;
    try {
      await loadChatMessages({ amount: nextAmount, merge: true });
      requestAnimationFrame(() => {
        if (prevAnchorId && prevAnchorOffset !== null) {
          const nextAnchorNode = findMessageNodeById(el, prevAnchorId);
          if (nextAnchorNode) {
            const nextAnchorOffset = nextAnchorNode.getBoundingClientRect().top - el.getBoundingClientRect().top;
            el.scrollTop += nextAnchorOffset - prevAnchorOffset;
            return;
          }
        }
        const nextHeight = el.scrollHeight;
        const diff = nextHeight - prevScrollHeight;
        el.scrollTop = Math.max(0, prevScrollTop + diff);
      });
    } finally {
      chatLoadMoreLockRef.current = false;
    }
  };

  return (
    <main className={`w-screen h-screen bg-black overflow-hidden flex ${rootDirectionClass} relative`}>
      {s.showStartOverlay ? (
        <div id="StartCallOverlay" className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 text-white">
          <div className="text-3xl font-semibold mb-8 drop-shadow-lg">{text.readyToStart}</div>
          <button id="StartCallButton" className="px-10 py-4 text-2xl font-bold rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-xl transition-all duration-200">
            {text.start}
          </button>
        </div>
      ) : null}

      <div id="callContainer" className={`${callPaneClass} relative bg-black mx-auto`} style={{ maxWidth: "min(100vw, 130vh)" }}>
        <div id="friendInfo" className="absolute top-4 inset-x-0 flex flex-col items-center justify-center z-[1000]">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white overflow-hidden shadow-md">
            <AvatarImage id="target_avatar" src={toAvatarSrc(s.targetIdentity.avatarUrl)} alt="avatar" className="w-full h-full object-cover" />
          </div>
          <div id="target_name" className="mt-1 text-white text-lg font-semibold drop-shadow-md">{s.targetIdentity.username || "Loading..."}</div>
          <div id="target_language" className="text-gray-300 text-sm font-medium mt-0.5">
            {(s.targetIdentity.langInfo?.nativelanguage || "?")} → {(s.targetIdentity.langInfo?.targetlanguage || "?")}
          </div>
        </div>

        <div className="w-full h-1/2 bg-gray-900 flex items-center justify-center">
          <div
            className="h-full w-auto max-w-full shrink-0"
            style={{ aspectRatio: "16 / 10" }}
          >
            <video id={`remoteVideo-${safeTargetId}`} autoPlay playsInline className="w-full h-full object-cover bg-gray-900"></video>
          </div>
        </div>
        <div className="w-full h-1/2 bg-black flex items-center justify-center">
          <div
            className="h-full w-auto max-w-full shrink-0"
            style={{ aspectRatio: "16 / 10" }}
          >
            <video id={`localVideo-${safeTargetId}`} autoPlay playsInline muted className="w-full h-full object-cover bg-black"></video>
          </div>
        </div>

        {s.showDialingOverlay ? (
          <div id="dialingOverlay" className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center text-white text-2xl z-10">
            <div id="dialingOverlay-text" className="animate-pulse flex items-center gap-2">
              <i className="ti ti-phone text-2xl"></i>
              <span>{s.dialingText || "Dialing..."}</span>
            </div>
            <button id="dialingOverlay-Buttontext" className="mt-6 px-6 py-3 bg-red-600 rounded-lg text-lg">{s.dialingButtonText || "Cancel"}</button>
          </div>
        ) : (
          <div id="dialingOverlay" className="absolute inset-0 bg-black/70 hidden flex-col justify-center items-center text-white text-2xl z-10">
            <div id="dialingOverlay-text" className="animate-pulse flex items-center gap-2">
              <i className="ti ti-phone text-2xl"></i>
              <span>{s.dialingText || "Dialing..."}</span>
            </div>
            <button id="dialingOverlay-Buttontext" className="mt-6 px-6 py-3 bg-red-600 rounded-lg text-lg">{s.dialingButtonText || "Cancel"}</button>
          </div>
        )}

        <button id="endCallButton" className={`${s.showEndCallButton ? "block" : "hidden"} fixed top-3 right-3 text-red-500 hover:text-red-600 transition z-[2000]`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="70" height="70">
            <path fill="currentColor" d="M12,8c-1.09,0-6.58,0.1-10.91,4.71c-0.38,0.4-0.38,1.02,0.01,1.41l2.29,2.27c0.35,0.35,0.91,0.39,1.3,0.09L8,14v-3.37 C9.26,10.23,10.6,10,12,10s2.74,0.23,4,0.63V14l3.31,2.48c0.4,0.3,0.95,0.26,1.3-0.09l2.29-2.27c0.39-0.39,0.39-1.01,0.01-1.41 C18.58,8.1,13.09,8,12,8z M6,13l-1.82,1.36l-0.96-0.96c0.91-0.83,1.85-1.47,2.78-1.95V13z M19.82,14.36L18,13v-1.54 c0.93,0.48,1.87,1.11,2.78,1.95L19.82,14.36z"/>
          </svg>
        </button>

        {s.isCaller ? (
          <div id="TimeoutOverlay" className={`absolute inset-0 z-[1500] bg-black/85 ${s.showTimeoutOverlay ? "flex" : "hidden"} flex-col justify-center items-center text-white text-2xl text-center`}>
            <div>Time out</div>
            <button id="finishButton" className="mt-6 px-8 py-3 bg-red-600 rounded-md text-lg">Finish</button>
          </div>
        ) : (
          <div id="disconnectedOverlay" className={`absolute inset-0 z-[1500] bg-black/85 ${s.showDisconnectedOverlay ? "flex" : "hidden"} flex-col justify-center items-center text-white text-2xl text-center`}>
            <div>📴 The other party has disconnected</div>
            <button id="finishButton" className="mt-6 px-8 py-3 bg-red-600 rounded-md text-lg">End Call</button>
          </div>
        )}
      </div>

      {canShowChat ? (
        <button
          type="button"
          className="fixed top-3 left-3 z-[2000] px-3 py-2 bg-black/70 text-white rounded-lg text-sm hover:bg-black/80 transition"
          onClick={() => setChatOpen((v) => !v)}
        >
          {chatOpen ? text.hideChat : text.showChat}
        </button>
      ) : null}

      {showChatPane ? (
        <aside className={`${chatPaneClass} bg-white flex flex-col min-h-0`}>
          <div className="relative z-10 h-16 bg-white text-indigo-900 flex items-center justify-between px-3 shadow-[0_8px_14px_-10px_rgba(15,23,42,0.45)]">
            <div className="flex items-center gap-3 min-w-0">
              <AvatarImage src={toAvatarSrc(s.targetIdentity.avatarUrl)} alt="avatar" className="w-10 h-10 rounded-full object-cover bg-white" />
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-semibold truncate">{s.targetIdentity.username || "Chat"}</span>
                <span className="text-xs text-black truncate">
                  {formatLanguageName(s.targetIdentity.langInfo?.nativelanguage, "?")} → {formatLanguageName(s.targetIdentity.langInfo?.targetlanguage, "?")}
                </span>
              </div>
            </div>
          </div>

          <div
            ref={chatListRef}
            className="messages-container relative flex-1 min-h-0 p-3 overflow-y-auto overflow-x-hidden min-w-0 bg-gray-50"
            onScroll={(e) => { void onChatScroll(e); }}
          >
            {chatLoading && chatRows.length === 0 ? (
              <div className="flex flex-col gap-3">
                <div className="w-36 h-3 rounded bg-gray-100 animate-pulse self-start"></div>
                <div className="w-[72%] h-10 rounded-2xl rounded-bl-none bg-gray-200 animate-pulse self-start"></div>
                <div className="w-[66%] h-9 rounded-2xl rounded-br-none bg-indigo-100 animate-pulse self-end"></div>
                <div className="w-[58%] h-10 rounded-2xl rounded-bl-none bg-gray-200 animate-pulse self-start"></div>
                <div className="w-[62%] h-9 rounded-2xl rounded-br-none bg-indigo-100 animate-pulse self-end"></div>
              </div>
            ) : chatRows.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">No messages yet.</div>
            ) : (
              chatMessageNodes
            )}

            {chatLoadingMore ? (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40">
                <div className="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-full shadow">
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t flex items-center px-2 gap-2 pt-2 pb-2 relative bg-white" style={{ minHeight: "3rem" }}>
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendChatNow();
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full border border-indigo-200 rounded-2xl pl-3 pr-11 py-2 text-sm resize-none overflow-y-hidden shadow-inner bg-indigo-50/60 text-gray-800 placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300"
                style={{ height: "36px", minHeight: "36px", maxHeight: "160px", lineHeight: "1.4", scrollbarWidth: "none" }}
              />
              <button
                className="absolute right-2 w-6 h-6 text-lg leading-none hover:bg-gray-100 rounded transition select-none flex items-center justify-center"
                style={{ bottom: "10px" }}
                onClick={() => setShowEmojiMenu((v) => !v)}
              >
                🙂
              </button>
              {showEmojiMenu ? (
                <div className="absolute bottom-11 right-0 bg-white border rounded shadow-lg p-2 grid grid-cols-5 gap-1 z-50">
                  {["😀", "😂", "😍", "😎", "🤔", "😭", "😡", "👍", "🔥", "🎉"].map((emo) => (
                    <button key={emo} className="text-2xl hover:bg-gray-100 rounded p-1" onClick={() => setDraft((prev) => `${prev}${emo}`)}>
                      {emo}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void sendChatNow()}
              className="h-9 min-h-9 px-3 rounded-xl transition flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700"
              aria-label="Send message"
              title="Send"
            >
              <i className="ti ti-send text-lg leading-none"></i>
            </button>
          </div>
        </aside>
      ) : null}

      <div id="camera-control" className="fixed bottom-4 left-4 z-50 flex items-center gap-3">
        <button id="toggleCameraBtn" className="px-4 py-2 bg-gray-800 text-white rounded-xl shadow-lg hover:bg-gray-700 active:scale-95 transition">
          {text.cameraOff}
        </button>
      </div>

      {s.showIceReconnectingOverlay ? (
        <div id="ice-reconnecting-overlay" className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 select-none pointer-events-none">
          <div className="text-white text-xl font-semibold animate-ice-shake">Connecting…</div>
        </div>
      ) : null}

      {s.showWssDisconnectedNotice ? (
        <div id="wss-disconnected-notice" className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-wss-fade select-none">
          <span className="inline-flex items-center gap-1">
            <i className="ti ti-alert-triangle"></i>
            <span>Signaling server disconnected. Call still active.</span>
          </span>
        </div>
      ) : null}

      {s.stopSignOverlay?.visible ? (
        <div id="call-stop-sign" className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-[9999] animate-fade-in">
          <div className="bg-white text-gray-800 rounded-2xl shadow-lg p-6 w-[90%] max-w-sm text-center animate-slide-up">
            <div className="flex flex-col items-center gap-3">
              {s.stopSignOverlay?.targetId ? (
                <>
                  <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-gray-300">
                    <AvatarImage src={toAvatarSrc(s.stopSignOverlay.avatarUrl)} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-2xl font-semibold mt-1">{s.stopSignOverlay.username || "Unknown"}</div>
                  <div className="text-gray-500 text-sm">{s.stopSignOverlay.langText || ""}</div>
                </>
              ) : null}
              <div className="mt-4 text-lg text-gray-700 font-medium">{text.callEnded}</div>
              <div className="mt-1 text-base leading-relaxed text-gray-600">{s.stopSignOverlay.message || ""}</div>
              <div className="flex flex-col items-center mt-6 space-y-3">
                {s.stopSignOverlay?.targetId ? (
                  <button
                    id="viewProfileButton"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg w-40 transition-all"
                    onClick={() => eventBus.emit("callPage:viewStopSignProfile", { targetId: s.stopSignOverlay.targetId })}
                  >
                    {text.viewProfile}
                  </button>
                ) : null}
                <button
                  id="stopSignCloseBtn"
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-lg w-40 transition-all"
                  onClick={() => eventBus.emit("callPage:closeStopSign", { from: "ui/call/stopSignCloseBtn" })}
                >
                  {text.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {s.callEndOverlay?.visible ? (
        <div id="CallEndOverlay" className="fixed inset-0 z-[3000] bg-black/85 flex flex-col justify-center items-center text-white text-center animate-fadein">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-white/30">
              <AvatarImage src={toAvatarSrc(s.callEndOverlay.avatarUrl)} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="text-2xl font-semibold mt-1">{s.callEndOverlay.username || "Unknown"}</div>
            <div className="text-gray-300 text-sm">{s.callEndOverlay.langText || ""}</div>
            <div className="mt-4 text-lg text-gray-200">{text.callEnded}</div>
            {!s.callEndOverlay?.fallbackOnly ? (
              <div id="countdownText" className="mt-2 text-sm text-gray-400">
                Closing in {Math.max(0, Number(s.callEndOverlay.countdown || 0))}s...
              </div>
            ) : null}
            <button
              id="callEndViewProfileButton"
              className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg w-40"
              onClick={() => eventBus.emit("callPage:viewProfileFromCallEnd", { targetId: s.callEndOverlay.targetId })}
            >
              {text.viewProfile}
            </button>
          </div>
        </div>
      ) : null}

      {s.initError?.visible ? (
        <div className="fixed inset-0 z-[4000] bg-black/85 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-6 text-center">
            <div className="text-lg font-semibold text-red-700">Call Initialization Failed</div>
            <div className="mt-3 text-sm text-gray-700 break-words">{String(s.initError?.message || "Failed to initialize call")}</div>
            <button
              type="button"
              className="mt-6 px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              onClick={() => {
                try {
                  window.close();
                } catch {}
                if (document.visibilityState !== "hidden") {
                  safeNaviagate("/");
                }
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
