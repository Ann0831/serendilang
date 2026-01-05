// --- File: ./call_wss/config.js
// WebSocket (WSS) configuration and small helpers only

export const SIGNALING_URL = (path = "/", queryString = "") => {
  const { protocol, host } = window.location;
  const wsProto ="wss:";
  console.log("/call_wss/config.js: SIGNALING_URL: path,queryString: ",path,queryString);
  let url = `${wsProto}//${host}:443${path}`;
  if (queryString&&typeof queryString === "string" && queryString.length > 0) {
    url += `?${queryString}`;
  }
  console.log("/call_wss/config.js: SIGNALING_URL: url: ",url);
  return url;
};

export function createSocket(baseUrl) {
  console.log("/call_wss/config.js: createSocket: baseUrl:", baseUrl);

  // 🔹 1. 判斷裝置類型
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  let deviceType = "desktop";
  if (/Mobi|Android/i.test(ua)) deviceType = "mobile";
  else if (/Tablet|iPad/i.test(ua)) deviceType = "tablet";

  // 🔹 2. 判斷平台
  let platform = "web";
  if (/iPhone|iPad|iOS/i.test(ua)) platform = "ios";
  else if (/Android/i.test(ua)) platform = "android";

  // 🔹 3. 加上查詢參數
  const url = new URL(baseUrl);
  url.searchParams.set("device", deviceType);
  url.searchParams.set("platform", platform);

  // ✅ 4. 若頁面有通話 ID，附加上去
  if (typeof window !== "undefined" && window.__CALL_EXTERNAL_ID__) {
    url.searchParams.set("call_id", window.__CALL_EXTERNAL_ID__);
  }

  // ✅ 5. 附加是否為撥號方（caller/callee）
  if (typeof window !== "undefined" && typeof window.__IS_CALLER__ === "boolean") {
    url.searchParams.set("role", window.__IS_CALLER__ ? "caller" : "callee");
  }

  // ✅ 6. 附加是否啟用相機
  if (typeof window !== "undefined" && typeof window.__ENABLE_CAMERA__ !== "undefined") {
    url.searchParams.set("enable_camera", window.__ENABLE_CAMERA__==="1" ? "1" : "0");
  }

  // 🔹 7. 建立連線
  const socket = new WebSocket(url.toString());
  return socket;
}


export function sendJSON(socket, payload) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  } else {
    console.warn("sendJSON: socket not open", payload);
  }
}

