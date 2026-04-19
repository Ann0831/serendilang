import { handleServiceNetworkError } from "./networkErrorHandler.js";

import  {clearGoogleOauthCookie} from "../api/post_api.client.js";
import {getGoogleOauthStatus} from "../api/api.client.js";

export async function clearGoogleOauthCookieService() {
  try {
    const res = await clearGoogleOauthCookie(); // 🔹 呼叫 api 層

    if (res?.status !== "success") {
      console.warn("⚠️ clearGoogleOauthCookieService: 清除失敗");
      return false;
    }

    console.log("service: clearGoogleOauthCookieService: res:", res);
    return true;
  } catch (err) {
    handleServiceNetworkError(err, "OAuth.js");
    console.error("❌ clearGoogleOauthCookieService error:", err);
    return false;
  }
}


export async function getGoogleOauthStatusService() {
  try {
    const res = await getGoogleOauthStatus(); // 🔹 呼叫 api 層

    if (res?.status !== "success" || !res.data) {
      console.warn("⚠️ getGoogleOauthStatusService: 回傳失敗或資料格式錯誤 → null");
      return null;
    }

    console.log("service: getGoogleOauthStatusService: res.data:", res.data);

    // 🔄 轉換格式給前端 UI 使用
    const d = res.data;
    return {
      email: d.email || null,
      name: d.name || null,
      picture: d.picture || null,
      email_verified: !!d.email_verified,
      hasIdToken: !!d.hasIdToken,
      exp_readable: d.exp_readable || null,
    };
  } catch (err) {
    handleServiceNetworkError(err, "OAuth.js");
    console.error("❌ getGoogleOauthStatusService error:", err);
    return null;
  }
}

