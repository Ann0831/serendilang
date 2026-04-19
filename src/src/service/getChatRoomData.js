import { getUserLanguage, getProfilePictureUrl, fetchMessages, getUsernameById } from "../api/api.client.js";
import { handleServiceNetworkError } from "./networkErrorHandler.js";
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
    const [languageSettled, profilePicSettled, usernameSettled] = await Promise.allSettled([
      getUserLanguage(targetId),
      getProfilePictureUrl(targetId),
      getUsernameById(targetId),
    ]);
    if (languageSettled.status === "rejected") handleServiceNetworkError(languageSettled.reason, "getChatRoomData.js");
    if (profilePicSettled.status === "rejected") handleServiceNetworkError(profilePicSettled.reason, "getChatRoomData.js");
    if (usernameSettled.status === "rejected") handleServiceNetworkError(usernameSettled.reason, "getChatRoomData.js");
    const languageRes = languageSettled.status === "fulfilled" ? languageSettled.value : null;
    const profilePicRes = profilePicSettled.status === "fulfilled" ? profilePicSettled.value : null;
    const usernameRes = usernameSettled.status === "fulfilled" ? usernameSettled.value : null;

    // 根據 status 處理資料
    const language =
      languageRes?.status === "success" ? languageRes.data : {};
    const profilePicUrl =
      profilePicRes?.status === "success"
        ? profilePicRes.data
        : `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`;
    const username =
      usernameRes?.status === "success"
        ? (typeof usernameRes.data === "string"
          ? usernameRes.data
          : usernameRes.data?.username || "")
        : "";

    const data = {
      userId: String(targetId),
      username,
      profilePicUrl,
      language,
    };

    console.log("✅ getChatRoomData return:", data);
    return data;
  } catch (err) {
    handleServiceNetworkError(err, "getChatRoomData.js");
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
    handleServiceNetworkError(err, "getChatRoomData.js");
    console.error("❌ getChatMessages error:", err);
    return [];
  }
}
