import { eventBus } from "/utils/eventBus.js";
import { setupWssHandlers} from "/wss/wssControll.js";
export function createVirtualWss(
  wssUrl,
  channelName = "virtual-wss",
  options={forced_becomeLeader:false},
  {
    heartbeatInterval = 3000,
    leaderTimeout = 10000,
    checkInterval = 3000,
  } = {},
) {
  const bc = new BroadcastChannel(channelName);
  const tabId = crypto.randomUUID();
  const leaderKey = `${channelName}-leader`;

  let isLeader = false;
  let socket = null;
  console.log("createVirtualWss: bc",bc);

  // ✅ 初始化階段：檢查上次 Leader 心跳是否過期
  const lastStoredHeartbeat = parseInt(localStorage.getItem(`${leaderKey}-lastHeartbeat`) || "0", 10);
  const initializeNow=Date.now();
  if (initializeNow - lastStoredHeartbeat > leaderTimeout) {
    console.warn("⚠️ [VirtualWSS] 偵測到 Leader 心跳過期，自動強制接手");
    options.forced_becomeLeader = true;
  }else if(lastStoredHeartbeat - initializeNow>10000){
    console.warn("⚠️ [VirtualWSS] 偵測到 lastStoredHeartbeat異常，自動強制接手");
    options.forced_becomeLeader = true;
  }
  console.log("lastStoredHeartbeat= ",lastStoredHeartbeat);
  let lastHeartbeat=lastStoredHeartbeat;



  console.log(
    `%c[VirtualWSS Init]%c tabId=${tabId}\nchannel=${channelName}\nwssUrl=${wssUrl}`,
    "color: #00bfff; font-weight: bold;",
    "color: #ccc;"
  );

  const ws = {
    isVirtual: true,
    isLeader: false,
    readyState: WebSocket.CONNECTING,
    socket: null,
    bc,
    tabId,
    leaderKey,
    heartbeatTimer: null,
    checkTimer: null,
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,

    send(data) {
      if (!isLeader) {
        bc.postMessage({ type: "send", payload: data, from: tabId });
      } else if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    },

    close() {
      if (ws.heartbeatTimer) clearInterval(ws.heartbeatTimer);
      if (ws.checkTimer) clearInterval(ws.checkTimer);

      if (isLeader && socket) {
        socket.close();
        bc.postMessage({ type: "close", from: tabId });
      }
      try { bc.close(); } catch {}
    },
  };
  setupWssHandlers(ws);
  function tryBecomeLeader() {
    const existing = localStorage.getItem(leaderKey);
    const expired = !lastHeartbeat || Date.now() - lastHeartbeat > leaderTimeout;

    if (existing && !expired&&!options.forced_becomeLeader) {
      console.log(options);
      console.log(`📡 Follower (${tabId}) 偵測到現有 Leader：${existing}`);
      console.log("ws: ",ws);
      ws.readyState = WebSocket.OPEN;
      ws.onopen?.();
      return;
    }

    const lockKey = `${leaderKey}-lock`;
    const now = Date.now();
    const lockValue = JSON.stringify({ tabId, ts: now });

    const currentLock = localStorage.getItem(lockKey);
    if (currentLock) {
      try {
        const parsed = JSON.parse(currentLock);
        if (now - parsed.ts < 3000) {
          console.log("⚠️ 已有其他分頁正在嘗試接管 Leader，暫不搶奪。");
          return;
        }
      } catch {}
    }

    localStorage.setItem(lockKey, lockValue);

    setTimeout(() => {
      const recheckLock = localStorage.getItem(lockKey);
      if (recheckLock !== lockValue) return;

      const currentLeader = localStorage.getItem(leaderKey);
      const stillExpired = !lastHeartbeat || Date.now() - lastHeartbeat > leaderTimeout;
      if (!currentLeader || stillExpired) {
        localStorage.setItem(leaderKey, tabId);
        if (localStorage.getItem(leaderKey) === tabId) {
          console.log(`👑 [${tabId}] 成為新的 Leader`);
          becomeLeader();
        }
      }
      localStorage.removeItem(lockKey);
    }, Math.random() * 200 + 100);
  }

  function becomeLeader() {
    isLeader = true;
    ws.isLeader = true;

    socket = new WebSocket(wssUrl);
    ws.socket = socket;

    console.log(`🟢 [Leader ${tabId}] 嘗試連線到 ${wssUrl}`);

    socket.onopen = () => {
      ws.readyState = WebSocket.OPEN;
      ws.onopen?.();
      bc.postMessage({ type: "connected", from: tabId });
      console.log(`✅ [Leader ${tabId}] 成功建立真實 WebSocket`);
    };

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.type === "pong") {
          ws.onmessage?.({ data: e.data });
          const now = Date.now();
        
          localStorage.setItem(`${leaderKey}-lastHeartbeat`, now);
          return;
        }
      } catch {}
      bc.postMessage({ type: "message", payload: e.data, from: tabId });
      ws.onmessage?.({ data: e.data });
    };

    socket.onclose = (e) => {
      bc.postMessage({ type: "close", from: tabId });
      ws.readyState = WebSocket.CLOSED;
      ws.onclose?.(e);
      localStorage.removeItem(leaderKey);
      ws.isLeader = false;
      isLeader = false;
      ws.socket = null;
      console.log(`🔴 [Leader ${tabId}] Socket 關閉`);
    };

    socket.onerror = (e) => {
      ws.onerror?.(e);
      bc.postMessage({ type: "error", payload: e.message, from: tabId });
    };

    // ❤️ Leader 發心跳（掛到 ws）
	  


    // ❤️ Leader 發心跳（新增：同步更新 localStorage）
    ws.heartbeatTimer = setInterval(() => {
      if (isLeader) {
        const now = Date.now();
        bc.postMessage({ type: "heartbeat", from: tabId, ts: now });
        localStorage.setItem(`${leaderKey}-lastHeartbeat`, now);
      }
    }, heartbeatInterval);	  
	  
  }

  bc.onmessage = (e) => {
    const msg = e.data;
    if (!msg) return;

    switch (msg.type) {
      case "connected":
        if (!isLeader) {
          ws.readyState = WebSocket.OPEN;
          ws.onopen?.();
          console.log(`🔗 [Follower ${tabId}] 接收到 connected`);
        }
        break;
      case "message":
        if (!isLeader) ws.onmessage?.({ data: msg.payload });
        break;
      case "send":
        if (isLeader && socket?.readyState === WebSocket.OPEN) socket.send(msg.payload);
        break;
      case "close": {
        const now = Date.now();

        // 🧩 發出確認請求，而不是直接關閉
        bc.postMessage({ type: "checkLeaderAlive", from: tabId, ts: now });
        console.log(`📡 [${isLeader ? "Leader" : "Follower"} ${tabId}] 收到關閉請求，先確認 Leader 是否仍存活...`);

        // 🕒 等待半個心跳週期後再決定是否關閉
        setTimeout(() => {
          const last = parseInt(localStorage.getItem(`${leaderKey}-lastHeartbeat`) || "0", 10);
          const leaderId = localStorage.getItem(`${leaderKey}-tabId`);
          const elapsed = now - last;

          if (elapsed > leaderTimeout) {
            console.warn(`⚠️ [${tabId}] Leader 無心跳超過 ${leaderTimeout} ms，視為失聯 → 將接手或重啟`);
            eventBus.emit("wssDisconnected", { forced_becomeLeader: true });
          } else {
            console.log(`✅ [${tabId}] Leader (${leaderId}) 仍存活，略過關閉`);
          }
        }, heartbeatInterval / 2);

        break;
      }
      case "error":
        if (!isLeader) ws.onerror?.({ message: msg.payload });
        break;
      case "heartbeat":
        console.log("bc receive heartbeat");
        if (msg.from !== tabId) lastHeartbeat = Date.now();
        break;
      case "checkLeaderAlive":
        console.log("receive checkLeaderAlive");
	if(isLeader){
            const now = Date.now();
            bc.postMessage({ type: "heartbeat", from: tabId, ts: now });
            localStorage.setItem(`${leaderKey}-lastHeartbeat`, now);

	}
    }
  };

  // 🩺 Follower 定期檢查 Leader 狀態（掛到 ws）
  ws.checkTimer = setInterval(() => {
    if (document.visibilityState === "hidden") {
      console.log("😴 分頁在背景，暫停本輪 leader 檢查");
      return;
    }

    lastHeartbeat = Math.max(
      parseInt(localStorage.getItem(`${leaderKey}-lastHeartbeat`) || "0", 10),
      lastHeartbeat || 0
    );
    const now = Date.now();
    if (
      !options.forced_becomeLeader &&
      !isLeader &&
      now - lastHeartbeat > leaderTimeout
    ) {
      bc.postMessage({ type: "checkLeaderAlive", from: tabId, ts: now });
      console.warn(`⚠️ [Follower ${tabId}] Leader timeout確認中...`);
      

      // 🕒 等半個 heartbeatInterval 再檢查一次
      setTimeout(() => {
        const stored = parseInt(
          localStorage.getItem(`${leaderKey}-lastHeartbeat`) || "0",
          10
        );

        lastHeartbeat = Math.max(stored, lastHeartbeat || 0);

        // 再次檢查
        if (Date.now() - lastHeartbeat > leaderTimeout) {
		const nowStr = new Date().toLocaleString("zh-TW", {
  		hour12: false,
  		year: "numeric",
  		month: "2-digit",
  		day: "2-digit",
  		hour: "2-digit",
  		minute: "2-digit",
  		second: "2-digit",
		});

		console.warn(
  `		⚠️ [Follower ${tabId}] 再次確認 Leader 已失聯，準備接手。 (${nowStr})`
		);


          
          eventBus.emit("wssDisconnected", { forced_becomeLeader: true });
        } else {
          console.log(`✅ [Follower ${tabId}] Leader 在第二次檢查中恢復心跳。`);
        }
      }, heartbeatInterval / 2);
    }



  }, checkInterval);

  window.addEventListener("beforeunload", () => {
    if (isLeader) {
      localStorage.removeItem(leaderKey);
      bc.postMessage({ type: "close", from: tabId });
      //socket?.close();
    }
    if (ws.heartbeatTimer) clearInterval(ws.heartbeatTimer);
    if (ws.checkTimer) clearInterval(ws.checkTimer);
  });

  tryBecomeLeader();
  return ws;
}

