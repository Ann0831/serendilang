import { getUserLanguage, getProfilePictureUrl, fetchMessages, getUsernameById } from "../api/api.js";
/**
 * Service: 取得聊天室完整資料
 * @param {string|number} targetId - 聊天對象的 userId
 * @param {number} [amount=20] - 要抓取的訊息數量
 * @returns {Promise<{userId:string, username:string, profilePicUrl:string, language:Object, messages:Array}>}
 */
export async function getChatRoomData(targetId, amount = 20) {
  if (!targetId) {
    console.error("getChatRoomData: targetId 不可為空");
    return null;
  }

  try {
    const [languageRes, profilePicRes, usernameRes] = await Promise.all([
      getUserLanguage(targetId),
      getProfilePictureUrl(targetId),
      getUsernameById(targetId),
    ]);

    // 根據 status 處理資料
    const language =
      languageRes?.status === "success" ? languageRes.data : {};
    const profilePicUrl =
      profilePicRes?.status === "success"
        ? profilePicRes.data
        : "/assets/images/defaultAvatar.svg";
    const username =
      usernameRes?.status === "success" ? usernameRes.data?.username || "" : "";

    const data = {
      userId: String(targetId),
      username,
      profilePicUrl,
      language,
    };

    console.log("✅ getChatRoomData return:", data);
    return data;
  } catch (err) {
    console.error("❌ getChatRoomData error:", err);
    return null;
  }
}

/**
 * Service: 取得聊天室訊息列表
 * @param {string|number} targetId
 * @param {number} [amount=20]
 * @returns {Promise<Array>}
 */
export async function getChatMessages(targetId, amount = 20) {
  if (!targetId) {
    console.error("❌ getChatMessages: targetId 不可為空");
    return [];
  }

  try {
    const res = await fetchMessages(targetId, amount);

    if (res?.status !== "success" || !Array.isArray(res.data)) {
      console.warn("⚠️ getChatMessages: 回傳失敗或資料格式錯誤 → []");
      return [];
    }
    
    console.log("service: getChatMessages: res.data:",res.data);
    // 轉換格式給 UI 層
    return res.data.map((msg) => ({
      fromSelf: msg.sender_id !== String(targetId),
      text: msg.messageText || "",
      message_id: msg.processed_message_id,
      timestamp: msg.timestamp || "",
      timestamp_ms: msg.timestamp_ms,
    }));
  } catch (err) {
    console.error("❌ getChatMessages error:", err);
    return [];
  }
}

