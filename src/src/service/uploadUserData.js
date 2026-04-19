import { handleServiceNetworkError } from "./networkErrorHandler.js";
// ./service/updateUserData.js
import {
  modifyProfilePicture,
  updateUserLanguage as apiUpdateUserLanguage,
  postDeleteProfilePicture,
  postApiUsersUpdateUsername
} from "../api/post_api.client.js";
import { compressImage } from "../utils/compressImage.js";

/**
 * 更新使用者語言設定
 * @param {string} targetlanguage
 * @param {string} nativelanguage
 * @returns {Promise<{result: "success" | "fail"}>}
 */
export async function updateUserLanguage(targetlanguage, nativelanguage) {
  try {
    const res = await apiUpdateUserLanguage(targetlanguage, nativelanguage);

    // 統一判斷格式
    if (res && res.status === "success") {
      console.log("✅ updateUserLanguage success:", res);
      return { result: "success" };
    } else {
      console.warn("⚠️ updateUserLanguage failed:", res);
      return { result: "fail" };
    }
  } catch (err) {
    handleServiceNetworkError(err, "uploadUserData.js");
    console.error("❌ Service updateUserLanguage error:", err);
    return { result: "fail" };
  }
}

/**
 * 更新使用者頭貼
 * @param {File} file - 上傳的圖片檔案
 * @returns {Promise<{result: "success" | "fail"}>}
 */
export async function updateUserProfilePicture(file) {
  if (!file) {
    console.warn("⚠️ updateUserProfilePicture: no file provided");
    return { result: "fail" };
  }

  try {
    // Step 1️⃣ 壓縮圖片
    const compressedFile = await compressImage(file);
    console.log("🧩 Compressed file:", compressedFile);

    // Step 2️⃣ 呼叫 API
    const res = await modifyProfilePicture(compressedFile);

    // Step 3️⃣ 格式化回傳
    if (res && res.status === "success") {
      console.log("✅ updateUserProfilePicture success:", res);
      return { result: "success" };
    } else {
      console.warn("⚠️ updateUserProfilePicture failed:", res);
      return { result: "fail" };
    }
  } catch (err) {
    handleServiceNetworkError(err, "uploadUserData.js");
    console.error("❌ updateUserProfilePicture error:", err);
    return { result: "fail" };
  }
}

export async function deleteUserProfilePicture() {
  try {
    // Step 1️⃣ 呼叫 API
    const res = await postDeleteProfilePicture();

    // Step 2️⃣ 格式化回傳
    if (res && res.status === "success") {
      console.log("✅ deleteUserProfilePicture success:", res);
      return { result: "success" };
    } else {
      console.warn("⚠️ deleteUserProfilePicture failed:", res);
      return { result: "fail" };
    }
  } catch (err) {
    handleServiceNetworkError(err, "uploadUserData.js");
    console.error("❌ deleteUserProfilePicture error:", err);
    return { result: "fail" };
  }
}


export async function updateUsername(new_username) {
  try {
    const res = await postApiUsersUpdateUsername(new_username);

    // 統一判斷格式
    if (res && res.status === "success") {
      console.log("✅ updateUsername success:", res);
      return { result: "success",...res };
    } else {
      console.warn("⚠️ updateUsername failed:", res);
      return { result: "fail",...res };
    }
  } catch (err) {
    handleServiceNetworkError(err, "uploadUserData.js");
    console.error("❌ Service updateUsername error:", err);
    return { result: "fail" };
  }
}

