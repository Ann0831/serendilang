// wss/wssControll.js
import {eventBus} from "/utils/eventBus.js";
import {recordWssDisconnect} from "/service/analyticsService.js";
import {soundPlayer} from "/utils/soundPlayer.js";
/**
 * 對 WebSocket 註冊事件 handler
 * @param {WebSocket} ws
 */
let heartbeatInterval;

export function setupWssHandlers(ws) {
  ws.onopen = () => {
    console.log("✅ WSS connected");
    eventBus.emit("wssConnected",{});
    heartbeatInterval = setInterval(() => {
      if (ws.isVirtual && !ws.isLeader) return; // 🔸 follower 不發心跳

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "heartbeat", ts: Date.now() }));
      }
    }, 5000);

  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.onlinelist) {
        // 注意：onlinelist 是字串化的 JSON 陣列
        
        console.log("📡 Online list:", data.onlinelist);
	eventBus.emit("onlineUsers-list-broadcast");
      } else if(data.action==="callRequest"){
	 console.log("wss receive callRequest");
	 eventBus.emit("call-request",{"from_id":data.fromwhom});
         if (ws.isLeader) {
                 try {
                         soundPlayer.loop("/assets/sounds/incoming_call_sound.mp3", 1);
                 } catch (err) {
                         console.warn("[MessageSound] Failed to play:", err);
                 }
         }
      }else if(data.action==="sendChatRoomMessage"){
	 console.log("wss/wssControll.js: wssrecieve: ",data);
         if (ws.isLeader) {
                 try {
                         soundPlayer.play("/assets/sounds/receive_message_sound.mp3", 1);
                 } catch (err) {
                         console.warn("[MessageSound] Failed to play:", err);
                 }
         }

	 eventBus.emit("receiveChatRoomMessage:wss",{"from_id":data.fromwhom});
      }else if(data.action==="sendChatRoomMessage:sync"){
         console.log("wss/wssControll.js: wssrecieve: ",data);
         eventBus.emit("sendChatRoomMessage:sync",{"from_id":data.fromwhom,"to_id":data.towhom});
      }else if(data.action==="turnOffCall"||data.action==="cancelCallRequest"){
	 eventBus.emit("call-TurnOffCall",{"from_id":data.fromwhom});
         if (true) {
                 try {
                         soundPlayer.stop("/assets/sounds/incoming_call_sound.mp3");
                 } catch (err) {
                         console.warn("[MessageSound] Failed to play:", err);
                 }
         }

      }else if(data.action==="agreeCall:sync"){
	 console.log("agreeCall:sync --- ",data);
         eventBus.emit("agreeCall:sync",{"agreeWhom":data.agreeWhom});
         if (true) {
                 try {
                         soundPlayer.stop("/assets/sounds/incoming_call_sound.mp3");
                 } catch (err) {
                         console.warn("[MessageSound] Failed to play:", err);
                 }
         }

      }else if(data.action==="sendFriendRequest"){
         console.log("wss/wssControll.js: wssrecieve: ",data);
         eventBus.emit("receiveFriendRequest:wss",{"from_id":data.fromwhom});

      }else if(data.action==="acceptFriendRequest"){
         console.log("wss/wssControll.js: wssrecieve: ",data);
         eventBus.emit("receiveAcceptFriendRequest:wss",{"from_id":data.fromwhom});

      }else if(data.action==="notifyCallSuccess"){
              eventBus.emit("call-notifyCallSuccess",{"from_id":data.fromwhom});

      }else{
        //console.log("📩 Message:", data);
      }
    } catch(err) {
      console.error(err);
      console.log("📩 Raw message:", event.data);
    }
  };

  ws.onclose = (event) => {
    console.log("❌ WSS disconnected");
    eventBus.emit("wssDisconnected",{});
    clearInterval(heartbeatInterval);
    console.log(`❌ Disconnected. Code=${event?.code}, Reason=${event?.reason}`);

    if (!(ws.isVirtual && !ws.isLeader)) {
      recordWssDisconnect(event.code, event.reason);
    }
  };

  ws.onclose = (event) => {
    console.log("❌ WSS disconnected");
    console.log(`❌ Disconnected. Code=${event?.code}, Reason=${event?.reason}`);

    // 🧹 清理所有本地計時器
    try {
      if (ws.heartbeatTimer) {
        clearInterval(ws.heartbeatTimer);
        ws.heartbeatTimer = null;
        console.log("🧼 Cleared heartbeatTimer");
      }
      if (ws.checkTimer) {
        clearInterval(ws.checkTimer);
        ws.checkTimer = null;
        console.log("🧼 Cleared checkTimer");
      }
    } catch (err) {
      console.warn("⚠️ Error clearing timers:", err);
    }

    // 💀 若是 Virtual Leader，還要清理 socket 和 BroadcastChannel
    if (ws.isVirtual) {
      if (ws.socket) {
        try {
          console.log("💀 Closing internal virtual socket...");
          ws.socket.close();
        } catch (err) {
          console.warn("close virtual socket error:", err);
        }
        ws.socket = null;
      }

      if (ws.bc) {
        try {
          console.log("🧹 Closing BroadcastChannel...");
          ws.bc.close();
        } catch (err) {
          console.warn("close BroadcastChannel error:", err);
        }
        ws.bc = null;
      }
    }

    // 💀 若為非 virtual 模式（傳統 WebSocket）
    if (!ws.isVirtual && ws.readyState !== WebSocket.CLOSED) {
      try {
        ws.close();
        console.log("💀 Closed plain WebSocket");
      } catch (err) {
        console.warn("close ws error:", err);
      }
    }

    // ✅ 更新狀態
    ws.readyState = WebSocket.CLOSED;

    // 📜 主連線（非 follower）才記錄
    if (!(ws.isVirtual && !ws.isLeader)) {
      try {
        recordWssDisconnect(event?.code, event?.reason || "Unknown reason");
        console.log("📜 Recorded disconnection");
      } catch (err) {
        console.warn("⚠️ recordWssDisconnect error:", err);
      }
    }

    // 🚀 在所有清理都完成後再發送事件
    try {
      eventBus.emit("wssDisconnected", {});
      console.log("📢 Emitted wssDisconnected event");
    } catch (err) {
      console.warn("⚠️ Failed to emit disconnection event:", err);
    }

    console.log("🧩 WSS onclose cleanup complete.");
  };

}
export function sendWssMessage(ws, action, payload = {}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("⚠️ WebSocket 尚未連線，無法發送訊息:", action, payload);
    return false;
  }

  try {
    const msg = JSON.stringify({ action, ...payload });
    ws.send(msg);
    console.log("send Wss message:", msg);
    return true;
  } catch (err) {
    console.error("❌ send Wss message error:", err);
    return false;
  }
}
