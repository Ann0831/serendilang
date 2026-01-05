import { getUserRealtimeStatus, getRealtimeOnlineList } from "/api/api.js";

/**
 * 查詢指定使用者的即時狀態
 * @param {string} targetId - 外部 userId
 * @returns {Promise<{ online: boolean, inCall: boolean } | null>}
 */
export async function fetchUserRealtimeStatus(targetId) {
  try {
    const res = await getUserRealtimeStatus(targetId);

    if (res?.status !== "success" || typeof res.data?.online !== "boolean") {
      console.warn("⚠️ fetchUserRealtimeStatus: 回傳格式不符:", res);
      return null;
    }

    return res.data;
  } catch (err) {
    console.error("❌ fetchUserRealtimeStatus error:", err);
    return null;
  }
}

/**
 * 取得所有上線使用者列表
 * @returns {Promise<Array<{ user_id: string, username: string, language: any }> | []>}
 */
export async function fetchRealtimeOnlineList() {
  try {
    const res = await getRealtimeOnlineList();

    if (res?.status !== "success" || !Array.isArray(res.data)) {
      console.warn("⚠️ fetchRealtimeOnlineList: 回傳格式不符:", res);
      return [];
    }

    return res.data;
  } catch (err) {
    console.error("❌ fetchRealtimeOnlineList error:", err);
    return [];
  }
}

