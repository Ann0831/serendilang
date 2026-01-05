import { checkUsernameAvailability } from "/api/api.js";
import { compressImage } from "/utils/compressImage.js";
import { postRegister } from "/api/post_api.js";

/**
 * 驗證使用者名稱是否合法與可用
 * @param {string} username - 使用者輸入的名稱
 * @returns {"available" | "used" | "illegal" | "error"}
 */
export async function verifyUsernameBeforeRegister(username) {
  try {
    const res = await checkUsernameAvailability(username);
    console.log("/service/registerService.js: verifyUsernameBeforeRegister:", res);

    // 若 API 採 {status, data} 結構，直接取 data；否則維持舊格式
    if (res?.status === "success") {
      return res.data; // 例如 "available" / "used" / "illegal"
    }

    

    console.warn("⚠️ verifyUsernameBeforeRegister: 回傳格式不符:", res);
    return "error";
  } catch (error) {
    console.error("❌ verifyUsernameBeforeRegister error:", error);
    return "error";
  }
}

/**
 * 註冊流程 Service
 * @param {Object} params - 註冊資訊
 * @param {string} params.username
 * @param {string} params.hashed_password
 * @param {string} params.nativelanguage
 * @param {string} params.targetlanguage
 * @param {File} params.profilePicFile
 * @param {string} params.inviteCode
 * @returns {Promise<{result: "success"|"fail"}>}
 */
export async function registerService({
  username,
  hashed_password,
  nativelanguage,
  targetlanguage,
  profilePicFile,
  inviteCode,
  agree_terms,
  agree_privacy
}) {
  try {
    let compressedFile = profilePicFile;

    // 🔹 若使用者有上傳圖片 → 壓縮
    if (profilePicFile) {
      compressedFile = await compressImage(profilePicFile, 1024, 1024, 0.8, "image/jpeg");
    }

    // 🔹 呼叫 API
    const res = await postRegister(
      username,
      hashed_password,
      nativelanguage,
      targetlanguage,
      compressedFile,
      inviteCode,
      agree_terms,
      agree_privacy
    );

    // 統一轉換為 {result:"success"|"fail"}
    return res?.status === "success"
      ? { result: "success",res }
      : { result: "fail",res };
  } catch (error) {
    console.error("❌ registerService failed:", error);
    return { result: "fail" };
  }
}

