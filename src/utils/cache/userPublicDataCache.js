/**
 * 快取使用者公開資料 (username, avatar, langInfo)
 * 存在 localStorage，同網域內所有頁面都能共用。
 */

const PREFIX = "userPublicData_";

/**
 * 儲存使用者公開資料
 * @param {string} userId - 使用者 ID (外部 ID)
 * @param {Object} data - { username, avatarUrl, nativelanguage, targetlanguage }
 */
export function saveUserPublicData(userId, data) {
  if (!userId || typeof data !== "object") return;

  const payload = {
    data,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(PREFIX + userId, JSON.stringify(payload));
  } catch (err) {
    console.warn("⚠️ saveUserPublicData: 無法寫入 localStorage", err);
  }
}

/**
 * 讀取使用者公開資料
 * @param {string} userId - 使用者 ID
 * @param {number} maxAgeMs - 最大有效時間（毫秒），超過則清除並回傳 null
 * @returns {Object|null}
 */
export function loadUserPublicData(userId, maxAgeMs = 10 * 60 * 1000) {
  if (!userId) return null;

  try {
    const raw = localStorage.getItem(PREFIX + userId);
    if (!raw) return null;

    const { data, timestamp } = JSON.parse(raw);
    if (!data || !timestamp) {
      localStorage.removeItem(PREFIX + userId);
      return null;
    }

    // 自動過期清理
    if (Date.now() - timestamp > maxAgeMs) {
      localStorage.removeItem(PREFIX + userId);
      return null;
    }

    return data;
  } catch (err) {
    console.warn("⚠️ loadUserPublicData: 快取解析錯誤", err);
    localStorage.removeItem(PREFIX + userId);
    return null;
  }
}

/**
 * 清除使用者公開資料快取
 * @param {string} userId
 */
export function clearUserPublicData(userId) {
  if (!userId) return;
  try {
    localStorage.removeItem(PREFIX + userId);
  } catch (err) {
    console.warn("⚠️ clearUserPublicData: 無法移除 localStorage", err);
  }
}

/**
 * 一次清除所有 userPublicData_ 開頭的快取
 */
export function clearAllUserPublicData() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key);
    });
  } catch (err) {
    console.warn("⚠️ clearAllUserPublicData: 執行錯誤", err);
  }
}

