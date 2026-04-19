import "../css/index.css";
// 例如在 App 啟動時
import { initializeWss } from "../wss/wssCenter.js";

const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsBaseUrl = `${wsProto}//${window.location.host}/`;

initializeWss(wsBaseUrl, {
  type: "normal"
});
