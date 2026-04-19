import { isTestEnv } from "../environment/env.js";
import { mockDb } from "../api/mock_db.js";

const WS_CONNECTING = 0;
const WS_OPEN = 1;
const WS_CLOSING = 2;
const WS_CLOSED = 3;

const activeMockSockets = new Set();

function listAllMockUserIdsExcept(excludeUserId = "") {
  const users = mockDb?.users && typeof mockDb.users === "object" ? mockDb.users : {};
  const ex = String(excludeUserId || "");
  return Object.keys(users).filter((id) => String(id) !== ex);
}

function broadcastCallRequestToMockUsers(fromUserId, delayMs = 5000) {
  const senderId = String(fromUserId || "").trim();
  if (!senderId) return;

  setTimeout(() => {
    const targetUserIds = listAllMockUserIdsExcept(senderId);
    if (targetUserIds.length === 0) return;

    for (const targetId of targetUserIds) {
      for (const socket of activeMockSockets) {
        if (!socket || socket.readyState !== WS_OPEN) continue;
        if (String(socket._selfId || "") !== String(targetId)) continue;
        socket.onmessage?.({
          data: JSON.stringify({
            action: "callRequest",
            fromwhom: senderId,
            towhom: targetId,
            type: "ice",
            source: "mock-broadcast-all-users",
          }),
        });
      }
    }
  }, delayMs);
}

export const SIGNALING_URL = (path = "/", queryString = "") => {
  const { protocol, host } = window.location;
  const wsProto = protocol === "https:" ? "wss:" : "ws:";
  let url = `${wsProto}//${host}${path}`;
  if (queryString && typeof queryString === "string" && queryString.length > 0) {
    url += `?${queryString}`;
  }
  return url;
};

class MockSocket {
  constructor(url) {
    this.url = String(url || "");
    this.readyState = WS_CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;

    this._selfId = String(window.__CURRENT_USER_ID__ || "");
    this._peerId = String(window.__TARGET_USER_ID__ || "");
    this._isCaller = window.__IS_CALLER__ === true;

    setTimeout(() => {
      if (this.readyState !== WS_CONNECTING) return;
      this.readyState = WS_OPEN;
      activeMockSockets.add(this);
      try {
        this.onopen?.({ type: "open" });
      } catch (err) {
        this.onerror?.(err);
      }
    }, 80);
  }

  send(raw) {
    if (this.readyState !== WS_OPEN) return;

    let payload = null;
    try {
      payload = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      payload = null;
    }
    if (!payload || typeof payload !== "object") return;

    if (payload.action === "callRequest" && this._isCaller) {
      // Test env behavior:
      // after 5s, broadcast callRequest to all mock-db users' sockets.
      broadcastCallRequestToMockUsers(this._selfId, 5000);

      setTimeout(() => {
        if (this.readyState !== WS_OPEN) return;
        const agree = {
          action: "agreeCall",
          fromwhom: this._peerId,
          towhom: this._selfId,
          type: "ice",
        };
        this.onmessage?.({ data: JSON.stringify(agree) });
        this._simulatePeerHangupIn(5000);
      }, 3000);
    }

    // Callee side: after accepting call, simulate peer hangs up after 10s.
    if (payload.action === "agreeCall" && !this._isCaller) {
      this._simulatePeerHangupIn(10000);
    }

    if (payload.action === "turnOffCall" || payload.action === "cancelCallRequest") {
      setTimeout(() => this.close(1000, "mock call end"), 120);
    }
  }

  close(code = 1000, reason = "mock closed") {
    if (this.readyState === WS_CLOSED || this.readyState === WS_CLOSING) return;
    this.readyState = WS_CLOSING;
    activeMockSockets.delete(this);
    setTimeout(() => {
      this.readyState = WS_CLOSED;
      this.onclose?.({ code, reason, wasClean: true });
    }, 0);
  }

  _simulatePeerHangupIn(delayMs = 5000) {
    setTimeout(() => {
      if (this.readyState !== WS_OPEN) return;
      const turnOff = {
        action: "turnOffCall",
        fromwhom: this._peerId,
        towhom: this._selfId,
        type: "ice",
      };
      this.onmessage?.({ data: JSON.stringify(turnOff) });
    }, delayMs);
  }
}

export function createSocket(baseUrl) {
  if (!isTestEnv) {
    return new WebSocket(baseUrl);
  }
  return new MockSocket(baseUrl);
}

export function sendJSON(socket, payload) {
  if (socket && socket.readyState === WS_OPEN) {
    socket.send(JSON.stringify(payload));
  } else {
    console.warn("[call_wss mock] sendJSON: socket not open", payload);
  }
}
