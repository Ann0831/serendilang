import { setupWssHandlers } from "./wssControll.js";
import { listOnlineUsers, appendIncomingMessageToCurrentUser } from "../api/mock_db.js";

const WS_CONNECTING = typeof WebSocket !== "undefined" ? WebSocket.CONNECTING : 0;
const WS_OPEN = typeof WebSocket !== "undefined" ? WebSocket.OPEN : 1;
const WS_CLOSING = typeof WebSocket !== "undefined" ? WebSocket.CLOSING : 2;
const WS_CLOSED = typeof WebSocket !== "undefined" ? WebSocket.CLOSED : 3;

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toMessageEvent(payload) {
  return { data: JSON.stringify(payload) };
}

export function createFakeWss(_url = "", _options = {}) {
  let closed = false;
  let heartbeatEchoTimer = null;
  let demoTimer = null;
  let demoIncomingMessageTimer = null;
  let demoAliceIncomingMessageInterval = null;
  let demoIncomingCallTimer = null;
  let aliceMessageCursor = 0;
  const aliceMessageTemplates = [
    "Hi tester_one, Alice here. Want to practice for 5 minutes?",
    "I just finished a short reading. Can we do a quick chat?",
    "Alice: I wrote a short diary, can you help me check it later?",
    "Are you available now? We can do one speaking round.",
  ];

  const ws = {
    isFake: true,
    isVirtual: false,
    readyState: WS_CONNECTING,
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,

    send(raw) {
      if (ws.readyState !== WS_OPEN || closed) return;
      const data = safeJsonParse(raw);
      if (!data) return;

      // Echo heartbeat with pong so client behaves like connected server.
      if (data.type === "heartbeat") {
        clearTimeout(heartbeatEchoTimer);
        heartbeatEchoTimer = setTimeout(() => {
          if (ws.readyState !== WS_OPEN || closed) return;
          ws.onmessage?.(toMessageEvent({ type: "pong", ts: Date.now() }));
        }, 40);
      }
    },

    close(code = 1000, reason = "fake wss closed") {
      if (ws.readyState === WS_CLOSED || closed) return;
      closed = true;
      ws.readyState = WS_CLOSING;
      clearTimeout(heartbeatEchoTimer);
      clearInterval(demoTimer);
      clearInterval(demoAliceIncomingMessageInterval);
      clearTimeout(demoIncomingMessageTimer);
      clearTimeout(demoIncomingCallTimer);
      ws.readyState = WS_CLOSED;
      ws.onclose?.({ code, reason });
    },

    // For test usage: manually simulate any server push packet.
    __mockEmit(payload) {
      if (ws.readyState !== WS_OPEN || closed) return;
      ws.onmessage?.(toMessageEvent(payload));
    },
  };

  setupWssHandlers(ws);

  setTimeout(() => {
    if (closed) return;
    ws.readyState = WS_OPEN;
    ws.onopen?.();

    // Demo push #1: someone sends you a chat message after 5s.
    demoIncomingMessageTimer = setTimeout(() => {
      if (ws.readyState !== WS_OPEN || closed) return;
      const text = aliceMessageTemplates[aliceMessageCursor % aliceMessageTemplates.length];
      aliceMessageCursor += 1;
      appendIncomingMessageToCurrentUser("u2", text);
      ws.onmessage?.(
        toMessageEvent({
          action: "sendChatRoomMessage",
          fromwhom: "u2",
        }),
      );
    }, 5000);

    // Demo push #1-2: keep simulating Alice incoming messages periodically.
    demoAliceIncomingMessageInterval = setInterval(() => {
      if (ws.readyState !== WS_OPEN || closed) return;
      const text = aliceMessageTemplates[aliceMessageCursor % aliceMessageTemplates.length];
      aliceMessageCursor += 1;
      appendIncomingMessageToCurrentUser("u2", text);
      ws.onmessage?.(
        toMessageEvent({
          action: "sendChatRoomMessage",
          fromwhom: "u2",
        }),
      );
    }, 20000);

    // Demo push #2: another user calls you after 10s.
    demoIncomingCallTimer = setTimeout(() => {
      if (ws.readyState !== WS_OPEN || closed) return;
      ws.onmessage?.(
        toMessageEvent({
          action: "callRequest",
          fromwhom: "u7",
        }),
      );
    }, 10000);
  }, 10);

  // Small periodic online-list push so notification/event flows can be tested.
  demoTimer = setInterval(() => {
    if (ws.readyState !== WS_OPEN || closed) return;
    ws.onmessage?.(
      toMessageEvent({
        onlinelist: JSON.stringify(listOnlineUsers()),
      }),
    );
  }, 30000);

  if (typeof window !== "undefined") {
    window.__fakeWss = ws;
  }

  return ws;
}
