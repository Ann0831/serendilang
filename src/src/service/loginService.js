import { handleServiceNetworkError } from "./networkErrorHandler.js";
// /service/loginService.js
import { testlogin,postLogin } from "../api/post_api.client.js";

/**
 * ✅ loginService - 呼叫底層 postLogin API，統一處理登入流程
 * @param {string} username - 使用者名稱
 * @param {string} hashedPassword - 已雜湊密碼
 * @returns {Promise<{ status: string, data?: object }>}
 */
export async function loginService(username, hashedPassword) {
  try {
    console.log("[Service:loginService] 呼叫 postLogin...");
    const res = await postLogin(username, hashedPassword);

    console.log("[Service:loginService] 收到結果:", res);

    // ✅ 統一格式解析
    if (res?.status === "success" || res?.loginstate === "success") {
      console.log("[Service:loginService] ✅ 登入成功");
      sessionStorage.clear();
      localStorage.clear();


      return {
        status: "success",
        loginstate: "success",
      };
    }

    // ⚠️ 登入失敗
    console.warn("[Service:loginService] ⚠️ 登入失敗:", res);
    return {
      status: "error",
      data: res || res.data || { loginstate: res?.loginstate || "fail" },
    };
  } catch (err) {
    handleServiceNetworkError(err, "loginService.js");
    // ❌ 不再呼叫 handleNetworkError，API 層已處理
    console.error("[Service:loginService] ❌ 未預期錯誤:", err);
    return {
      status: "error",
      data: { loginstate: "fail", message: err.message || "Unexpected error" },
    };
  }
}

export async function testloginService() {
  try {
    console.log("[Service:testloginService] 呼叫 testlogin...");
    const res = await testlogin();

    console.log("[Service:testloginService] 收到結果:", res);

    // 🟢  已登入
    if (
      res?.status === "success" &&
      res?.data?.state === "login" &&
      res?.data?.identity?.user_id
    ) {
      console.log("[Service:testloginService] ✅  使用者已登入");

      return {
        status: "success",
        loginstate: "login",
        identity: {
          username: res.data.identity.username,
          user_id: res.data.identity.user_id,
        },
      };
    }

    // 🔴  未登入
    console.warn("[Service:testloginService] ⚠️ 使用者未登入:", res);
    return {
      status: "error",
      loginstate: "logout",
      data: res || { state: "logout" },
    };

  } catch (err) {
    handleServiceNetworkError(err, "loginService.js");
    console.error("[Service:testloginService] ❌  未預期錯誤:", err);
    return {
      status: "error",
      loginstate: "logout",
      data: { message: err.message || "Unexpected error" },
    };
  }
}

