import React, { useEffect, useMemo, useRef, useState } from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState } from "../StateViewBase.jsx";
import { useOnlineUsersSet } from "../common/useOnlineUsersSet.js";
import { formatLanguageName } from "../../utils/language/languageDisplay.js";
import { toAvatarSrc } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";
import { formatChatSeparatorDateTime } from "../../utils/dateTimeFormat.js";

function getChatUiLocale() {
  if (typeof navigator !== "undefined" && typeof navigator.language === "string") {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("zh")) return "zh";
  }
  return "en";
}

const CHAT_MENU_TEXT = {
  en: {
    report: "Report",
    block: "Block",
    unblock: "Unblock",
  },
  zh: {
    report: "檢舉",
    block: "封鎖",
    unblock: "解除封鎖",
  },
};

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

function ChatRoomSkeleton() {
  return (
    <>
      <div className="relative z-10 h-16 bg-white text-indigo-900 flex items-center justify-between px-3 rounded-t-lg shadow-[0_8px_14px_-10px_rgba(15,23,42,0.45)]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></span>
          <div className="flex flex-col gap-2 min-w-0">
            <span className="h-3 w-28 rounded bg-gray-200 animate-pulse"></span>
            <span className="h-2.5 w-36 rounded bg-gray-100 animate-pulse"></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded bg-gray-100 animate-pulse"></span>
          <span className="w-7 h-7 rounded bg-gray-100 animate-pulse"></span>
          <span className="w-7 h-7 rounded bg-gray-100 animate-pulse"></span>
        </div>
      </div>

      <div className="messages-container relative flex-1 min-h-0 p-3 overflow-y-auto overflow-x-hidden min-w-0 bg-gray-50">
        <div className="flex flex-col gap-3">
          <div className="w-36 h-3 rounded bg-gray-100 animate-pulse self-start"></div>
          <div className="w-[72%] h-10 rounded-2xl rounded-bl-none bg-gray-200 animate-pulse self-start"></div>
          <div className="w-[66%] h-9 rounded-2xl rounded-br-none bg-indigo-100 animate-pulse self-end"></div>
          <div className="w-[58%] h-10 rounded-2xl rounded-bl-none bg-gray-200 animate-pulse self-start"></div>
          <div className="w-[62%] h-9 rounded-2xl rounded-br-none bg-indigo-100 animate-pulse self-end"></div>
        </div>
      </div>

      <div className="border-t flex items-center px-2 gap-2 pt-2 pb-2 bg-white" style={{ minHeight: "3rem" }}>
        <div className="h-9 flex-1 rounded-2xl bg-gray-100 animate-pulse"></div>
        <div className="h-9 w-11 rounded-xl bg-gray-200 animate-pulse"></div>
      </div>
    </>
  );
}

function ChatRoomCard({ id, meta, right = "1rem", isOnline = false }) {
  const menuText = CHAT_MENU_TEXT[getChatUiLocale()] || CHAT_MENU_TEXT.en;
  const data = meta?.data || {};
  const language = data?.language || {};
  const profilePicUrl = toAvatarSrc(data?.profilePicUrl);
  const username = data?.username || id;
  const blocked = !!meta?.isBlocked;
  const messages = Array.isArray(meta?.messages) ? meta.messages : [];
  const loading = !!meta?.loading;
  const loadingMessages = !!meta?.loadingMessages;
  const incomingCall = !!meta?.incomingCall;
  const incomingCallAt = Number(meta?.incomingCallAt || 0);

  const [draft, setDraft] = useState("");
  const [incomingRemainSec, setIncomingRemainSec] = useState(25);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const didAutoScrollOnOpenRef = useRef(false);
  const prevFirstMessageIdRef = useRef("");
  const prevLastMessageIdRef = useRef("");
  const didUserInteractScrollRef = useRef(false);
  const bottomLoadLatchRef = useRef(false);
  const menuId = `ChatRoom_Menu-${id}`;
  const emojiId = `EmojiMenu-${id}`;

  const rows = useMemo(() => messages.slice(-100), [messages]);
  const messageNodes = useMemo(() => {
    const nodes = [];
    const GAP_MS = 180 * 1000;
    for (let i = 0; i < rows.length; i += 1) {
      const curr = rows[i];
      const prev = i > 0 ? rows[i - 1] : null;
      const currMs = Number(curr?.timestamp_ms || 0);
      const prevMs = Number(prev?.timestamp_ms || 0);
      if (i === 0 && currMs > 0) {
        nodes.push(
          <div key={`sep-first-${id}-${curr?.message_id || i}`} className="w-full flex justify-center py-1">
            <span className="text-[11px] text-gray-400">{formatChatSeparatorDateTime(currMs)}</span>
          </div>
        );
      }
      if (i > 0 && currMs > 0 && prevMs > 0 && currMs - prevMs > GAP_MS) {
        nodes.push(
          <div key={`sep-${id}-${curr?.message_id || i}`} className="w-full flex justify-center py-1">
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
  }, [rows, id, profilePicUrl]);

  useEffect(() => {
    if (didAutoScrollOnOpenRef.current) return;
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    didAutoScrollOnOpenRef.current = true;
  }, [rows.length]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const firstId = String(rows[0]?.message_id || "");
    const lastId = String(rows[rows.length - 1]?.message_id || "");
    const prevFirstId = prevFirstMessageIdRef.current;
    const prevLastId = prevLastMessageIdRef.current;
    prevFirstMessageIdRef.current = firstId;
    prevLastMessageIdRef.current = lastId;

    if (!lastId || lastId === prevLastId) return;

    // If only older messages are prepended, keepLoc should control position.
    const isPrependLoad = !!prevFirstId && firstId !== prevFirstId && lastId === prevLastId;
    if (isPrependLoad) return;

    const last = rows[rows.length - 1];
    if (!last?.fromSelf) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [rows]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "36px";
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${Math.max(36, next)}px`;
  }, [draft]);

  useEffect(() => {
    if (!incomingCall) return;
    const startedAt = Number.isFinite(incomingCallAt) && incomingCallAt > 0 ? incomingCallAt : Date.now();
    const elapsed = Date.now() - startedAt;
    const remain = Math.max(0, 25000 - elapsed);
    const timer = setTimeout(() => {
      eventBus.emit("reject-call", { user_id: id, from: "chatRoom/incoming-timeout", silent: true });
    }, remain);
    return () => clearTimeout(timer);
  }, [incomingCall, incomingCallAt, id]);

  useEffect(() => {
    if (!incomingCall) return;
    const startedAt = Number.isFinite(incomingCallAt) && incomingCallAt > 0 ? incomingCallAt : Date.now();
    const calcRemainSec = () => Math.max(0, Math.ceil((25000 - (Date.now() - startedAt)) / 1000));
    setIncomingRemainSec(calcRemainSec());
    const ticker = setInterval(() => {
      setIncomingRemainSec(calcRemainSec());
    }, 250);
    return () => clearInterval(ticker);
  }, [incomingCall, incomingCallAt]);

  const onScrollMessages = (e) => {
    const el = e.currentTarget;
    if (!el) return;
    const atBottomRaw = el.scrollTop + el.clientHeight >= el.scrollHeight - 5;
    let atBottom = false;
    if (!atBottomRaw) {
      bottomLoadLatchRef.current = false;
    } else if (didUserInteractScrollRef.current && !bottomLoadLatchRef.current) {
      atBottom = true;
      bottomLoadLatchRef.current = true;
    }
    eventBus.emit(
      "ChatRoomScroll",
      {
        user_id: id,
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        atBottom,
      },
      el
    );
  };

  const sendNow = () => {
    if (blocked) return;
    const text = (draft || "").trim();
    if (!text) return;
    eventBus.emit("sendMessage", { user_id: id, text, from: "ui/chatRoom/send" });
    setDraft("");
  };

  return (
    <div
      key={id}
      data-user-id={id}
      data-chatroom-root="true"
      className="bg-white shadow-lg rounded-lg border flex flex-col fixed bottom-4 z-[60]"
      style={{ width: "23rem", height: "28rem", right }}
    >
      {loading ? <ChatRoomSkeleton /> : (
        <>
      {incomingCall ? (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 z-[80] rounded-lg">
          <div className="w-16 h-16 rounded-full border-4 border-green-400 border-t-transparent animate-spin"></div>
          <div className="text-white text-base font-semibold text-center px-4">
            {username || "Unknown"} is calling you...
          </div>
          <div className="text-white/90 text-sm">
            Auto close in {incomingRemainSec}s
          </div>
          <div className="flex flex-col items-center gap-2 w-full max-w-[18rem] px-4">
            <div className="flex w-full gap-2">
              <button
                className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-sm"
                onClick={() => eventBus.emit("accept-video-call", { user_id: id, from: "chatRoom/incoming" })}
              >
                Accept (With Camera)
              </button>
              <button
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition text-sm"
                onClick={() => eventBus.emit("accept-voice-call", { user_id: id, from: "chatRoom/incoming" })}
              >
                Accept (Without Camera)
              </button>
            </div>
            <button
              className="w-full px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm"
              onClick={() => eventBus.emit("reject-call", { user_id: id, from: "chatRoom/incoming" })}
            >
              Reject
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 h-16 bg-white text-indigo-900 flex items-center justify-between px-3 rounded-t-lg shadow-[0_8px_14px_-10px_rgba(15,23,42,0.45)]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative w-10 h-10 flex-shrink-0">
            <AvatarImage
              src={profilePicUrl}
              alt={`${username} avatar`}
              className="w-10 h-10 rounded-full object-cover bg-white cursor-pointer"
              onClick={() => eventBus.emit("openUserPage", { author_id: id, from: "ui/chatRoom/avatar" })}
            />
            {isOnline ? (
              <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-green-500 rounded-full border border-white"></span>
            ) : null}
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-semibold truncate cursor-pointer" onClick={() => eventBus.emit("openUserPage", { author_id: id, from: "ui/chatRoom/name" })}>
              {username}
            </span>
            <span className="text-xs text-black truncate">
              {formatLanguageName(language?.nativelanguage, "?")} → {formatLanguageName(language?.targetlanguage, "?")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 rounded hover:bg-gray-200 transition text-gray-600" onClick={() => eventBus.emit("start-voice-call", { target_id: id, from: "chatRoom" })}>
            <i className="ti ti-phone text-lg"></i>
          </button>
          <button className="p-1 rounded hover:bg-gray-200 transition text-gray-600" onClick={() => eventBus.emit("start-video-call", { target_id: id, from: "chatRoom" })}>
            <i className="ti ti-video text-lg"></i>
          </button>
          <div className="relative">
            <button
              data-chatroom-menu-toggle="true"
              className="p-1 rounded hover:bg-gray-200 transition text-gray-600"
              onClick={() => eventBus.emit("Toggle_ChatRoom_Menu", { target_id: id, from: "chatRoom" })}
            >
              <i className="ti ti-dots text-lg"></i>
            </button>
            <div id={menuId} className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg hidden flex-col text-sm z-50">
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-200 focus:outline-none"
                onClick={() =>
                  eventBus.emit("chatRoomMenuReport", {
                    target_id: id,
                    target_name: username,
                    menu_id: menuId,
                    from: "ui/chatRoom/menu/report",
                  })
                }
              >
                {menuText.report}
              </button>
              {blocked ? (
                <button
                  className="w-full px-4 py-2 text-left text-green-700 hover:bg-gray-200 focus:outline-none"
                  onClick={() =>
                    eventBus.emit("openUnblockUserModal", {
                      target_id: id,
                      target_name: username,
                      from: "ui/chatRoom/menu/unblock",
                    })
                  }
                >
                  {menuText.unblock}
                </button>
              ) : (
                <button
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-200 focus:outline-none"
                  onClick={() =>
                    eventBus.emit("chatRoomMenuBlock", {
                      target_id: id,
                      target_name: username,
                      menu_id: menuId,
                      from: "ui/chatRoom/menu/block",
                    })
                  }
                >
                  {menuText.block}
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close chat room"
            title="Close"
            className="w-7 h-7 rounded hover:bg-gray-200 transition text-gray-700 text-lg leading-none flex items-center justify-center"
            onClick={() => eventBus.emit("closeChatRoom", { user_id: id, from: "chatRoom/close-x" })}
          >
            ×
          </button>
        </div>
      </div>

      <div
        ref={messagesRef}
        className={`messages-container relative flex-1 min-h-0 p-3 space-y-2 overflow-y-auto overflow-x-hidden min-w-0 ${
          blocked ? "bg-gray-200/80" : "bg-gray-50"
        }`}
        onScroll={onScrollMessages}
        onWheel={() => {
          didUserInteractScrollRef.current = true;
        }}
        onTouchMove={() => {
          didUserInteractScrollRef.current = true;
        }}
      >
        {blocked ? (
          <div className="h-full w-full flex items-center justify-center text-lg text-red-700 font-bold">
            This user is blocked by you.
          </div>
        ) : rows.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">No messages yet.</div>
        ) : (
          messageNodes
        )}

        {loadingMessages ? (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-full shadow">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></span>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`border-t flex items-center px-2 gap-2 pt-2 pb-2 relative ${
          blocked ? "bg-gray-200/80" : "bg-white"
        }`}
        style={{ minHeight: "3rem" }}
      >
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            data-action="chat-input"
            data-user-id={id}
            disabled={blocked}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendNow();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className={`w-full border border-indigo-200 rounded-2xl pl-3 pr-11 py-2 text-sm resize-none overflow-y-hidden shadow-inner ${
              blocked
                ? "bg-gray-100 text-gray-400 placeholder:text-gray-400 cursor-not-allowed"
                : "bg-indigo-50/60 text-gray-800 placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300"
            }`}
            style={{ height: "36px", minHeight: "36px", maxHeight: "160px", lineHeight: "1.4", scrollbarWidth: "none" }}
          />
          <button
            data-emoji-menu-toggle="true"
            className="absolute right-2 w-6 h-6 text-lg leading-none hover:bg-gray-100 rounded transition select-none flex items-center justify-center"
            style={{ bottom: "10px" }}
            disabled={blocked}
            onClick={(e) => eventBus.emit("toggleEmojiMenu", { user_id: id, from: "chatRoom" }, e.currentTarget)}
          >
            🙂
          </button>
          <div id={emojiId} className="absolute bottom-11 right-0 bg-white border rounded shadow-lg p-2 grid grid-cols-5 gap-1 hidden z-50">
            {["😀", "😂", "😍", "😎", "🤔", "😭", "😡", "👍", "🔥", "🎉"].map((emo) => (
              <button key={emo} className="text-2xl hover:bg-gray-100 rounded p-1" onClick={() => setDraft((prev) => `${prev}${emo}`)}>
                {emo}
              </button>
            ))}
          </div>
        </div>
        <button
          className={`h-9 min-h-9 px-3 rounded-xl transition flex items-center justify-center ${
            blocked
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
          disabled={blocked}
          onClick={sendNow}
          aria-label="Send message"
          title="Send"
        >
          <i className="ti ti-send text-lg leading-none"></i>
        </button>
      </div>
        </>
      )}
    </div>
  );
}

export default function ChatRoomsContainer() {
  const s = useSubscribedState("ChatRoomsContainer", {});
  const active = Array.isArray(s.activeChatRooms) ? s.activeChatRooms : [];
  const hidden = Array.isArray(s.hiddenChatRooms) ? s.hiddenChatRooms : [];
  const meta = s.chatRoomMeta || {};
  const onlineIds = useOnlineUsersSet();

  return (
    <>
      {hidden.length > 0 ? (
        <div className="fixed bottom-4 right-[48rem] z-[60] flex gap-2">
          {hidden.map((id) => (
            <button
              key={`hidden-${id}`}
              className="px-3 py-1 rounded-full bg-white border shadow text-xs hover:bg-gray-50"
              onClick={() => eventBus.emit("openChatRoom", { user_id: id, from: "ui/chatRooms/hidden" })}
            >
              {meta?.[id]?.data?.username || id}
            </button>
          ))}
        </div>
      ) : null}

      {active.map((id) => (
        <ChatRoomCard
          key={id}
          id={id}
          meta={meta?.[id] || {}}
          right={id === active[active.length - 1] ? "1rem" : "24.5rem"}
          isOnline={onlineIds.has(String(id))}
        />
      ))}
    </>
  );
}
