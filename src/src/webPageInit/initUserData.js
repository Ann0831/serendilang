import "../css/index.css";
// Initialize_User_Identity.js
import { initUserData } from "../userSelfData/userSelfData.js";
import { eventBus } from "../utils/eventBus.js"; // 如果你有 eventBus

/**
 * 初始化使用者身份
 * - 呼叫後端 API
 * - 存入全域變數 (userSelfData.js)
 * - 發出事件讓其他模組知道
 */

initUserData();



