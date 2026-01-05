// /service/deleteAccountService.js
import { postDeleteAccount } from "/api/post_api.js";

/**
 * 刪除目前登入的使用者帳號
 */
export async function deleteAccountService() {
  console.log("[Service:deleteAccountService] deleting account...");

  try {
    const res = await postDeleteAccount();
    console.log("[Service:deleteAccountService] API response:", res);

    // ✅ 判斷符合你統一後 API 格式：非 error 且伺服器標示 success
    if (res && res.status !== "error" && (res.result === "success" || res.status === "success")) {
      console.log("[Service:deleteAccountService] success:", res);
      return { success: true, data: res };
    }

    // ❌ API 層返回錯誤
    console.warn("[Service:deleteAccountService] failed:", res);
    return { success: false, error: res };

  } catch (err) {
    // ⚠️ 捕捉非預期錯誤（網路 / JSON parse / throw）
    console.error("[Service:deleteAccountService] exception:", err);
    return { success: false, error: err };
  }
}

