// /wss/wssCenter.js
import { setupWssHandlers, sendWssMessage } from "./wssControll.js";
import { createVirtualWss } from "/wss/createVirtualWss.js";

let globalWs = null;         
let reconnectTimer = null;   
let reconnectDelay = 1000;   // 起始延遲 1s
const maxDelay = 5000;      
let baseUrlCache = "wss://gotestapp.com/";     
let optionsCache = { type: "normal" };

/**
 * 初始化 Virtual WebSocket 連線（所有分頁共用一條真連線）
 * @param {string} baseUrl - 伺服器的 wss 入口 (e.g. "wss://yourdomain.com/ws")
 * @param {Object} options - 可選參數，例如 { token, type, friendId }
 * @returns {WebSocket} - virtual WebSocket 物件（介面與原生相同）
 */
export function initializeWss(baseUrl, { token, type = "normal", friendId } = {},options={}) {
  if (globalWs && globalWs.readyState === WebSocket.OPEN) {
    console.warn("⚠️ Virtual WSS 已經初始化過，直接回傳現有連線");
    return globalWs;
  }

  baseUrlCache = baseUrl;
  optionsCache = { token, type, friendId };

  // 🔹 1. 判斷裝置類型
  const ua = navigator.userAgent || "";
  let deviceType = "desktop";
  if (/Mobi|Android/i.test(ua)) deviceType = "mobile";
  else if (/Tablet|iPad/i.test(ua)) deviceType = "tablet";

  // 🔹 2. 判斷平台
  let platform = "web";
  if (/iPhone|iPad|iOS/i.test(ua)) platform = "ios";
  else if (/Android/i.test(ua)) platform = "android";

  // 🔹 3. 組合查詢參數
  const url = new URL(baseUrl);
  url.searchParams.set("type", type);
  if (friendId) url.searchParams.set("friendid", friendId);
  if (token) url.searchParams.set("token", token);
  url.searchParams.set("device", deviceType);
  url.searchParams.set("platform", platform);
  // 🔹 4. 檢查 BroadcastChannel 支援度
  const hasBC = typeof BroadcastChannel !== "undefined";
  console.log(`🔍 BroadcastChannel 支援: ${hasBC}`);

  if (hasBC) {
    // 使用 Virtual WSS
    console.log("🔌 初始化 virtual WSS:", url.toString());
    console.log("initializeWss: ",options);
    globalWs = createVirtualWss(url.toString(), "serendilang-virtual-wss",options);
  } else {
    // fallback: 直接建立真實 WebSocket
    console.warn("⚠️ BroadcastChannel 不支援，改用傳統 WebSocket");
    globalWs = new WebSocket(url.toString());
  }

  
  return globalWs;
}

/**
 * 取得目前的全域 virtual WebSocket
 */
export function getWss() {
  return globalWs;
}

/**
 * 檢查 virtual WebSocket 是否已開啟
 */
export function isWssReady() {
  return globalWs && globalWs.readyState === WebSocket.OPEN;
}

/**
 * 發送訊息（透過 virtual WSS）
 */
export function sendWssMessage_wssCenter(action, payload) {
  console.log("sendWssMessage_wssCenter", action, payload);
  sendWssMessage(globalWs, action, payload);
}


/**
 * 💥 強制重頭開始（清除現有連線、交由 scheduleReconnect() 處理重建）
 */
/**
 * 💥 強制重頭開始（清除現有連線、交由 scheduleReconnect() 處理重建）
 */
/**
 * 💥 強制重頭開始（清除現有連線、交由 scheduleReconnect() 處理重建）
 */
export function resetWssConnection(options={}) {
  console.log("🔄 [resetWssConnection] 強制重建 WebSocket 連線...");

  try {
    // 1️⃣ 若有現存連線 → 嘗試關閉底層 socket、BroadcastChannel、清除計時器
    if (globalWs) {
      // 🕒 清除所有計時器（無論是否 virtual）
      if (globalWs.heartbeatTimer) {
        clearInterval(globalWs.heartbeatTimer);
        console.log("🕒 已清除 heartbeatTimer");
      }
      if (globalWs.checkTimer) {
        clearInterval(globalWs.checkTimer);
        console.log("🕒 已清除 checkTimer");
      }

      // 💀 若為 virtual WebSocket
      if (globalWs.isVirtual) {
        if (globalWs.socket) {
          console.log("💀 嘗試關閉 virtual_wss.socket（不廣播、不觸發 close）");
          try {
            globalWs.socket.close();
          } catch (err) {
            console.warn("close virtual socket error:", err);
          }
        }

        if (globalWs.bc) {
          console.log("🧹 關閉 BroadcastChannel");
          try {
            globalWs.bc.close();
          } catch (err) {
            console.warn("close BroadcastChannel error:", err);
          }
        }
      } 
      // 💀 非 virtual（傳統）WebSocket
      else {
        if (globalWs.readyState !== WebSocket.CLOSED) {
          try {
            globalWs.close();
            console.log("💀 關閉傳統 WebSocket");
          } catch (err) {
            console.warn("close normal websocket error:", err);
          }
        }
      }

      // ✅ 完全清除 globalWs
      globalWs = null;
      console.log("🧩 已清除 globalWs 實例");
    }


    
  } catch (err) {
    console.error("❌ resetWssConnection 發生錯誤:", err);
  }
}

/**
 * 安排重連（仍可用，但對 virtual WSS 通常不需要）
 */
export function scheduleReconnect(options={}) {
  if (reconnectTimer) return; // 已在排程中
  console.log("scheduleReconnect: ",options);
  resetWssConnection();
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 2, maxDelay);
    initializeWss(baseUrlCache, optionsCache,options);
  }, reconnectDelay);

  console.log(`⏳ 將於 ${reconnectDelay / 1000}s 後嘗試重連...`);
}

