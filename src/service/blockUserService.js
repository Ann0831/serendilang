import { postUserBlock, postUserUnBlock } from "/api/post_api.js";

/**
 * Service 層：封鎖使用者
 * @param {string|number} targetId - 對方的 external user id
 * @returns {Promise<{result: "success"|"fail"}>}
 */
export async function blockUserService(targetId) {
  try {
    const res = await postUserBlock(targetId);
    console.log("service/userService.js: blockUserService res:", res);

    return res?.status === "success"
      ? { result: "success" }
      : { result: "fail" };
  } catch (error) {
    console.error("❌ Error in blockUserService:", error);
    return { result: "fail" };
  }
}

/**
 * Service 層：解除封鎖使用者
 * @param {string|number} targetId - 對方的 external user id
 * @returns {Promise<{result: "success"|"fail"}>}
 */
export async function unBlockUserService(targetId) {
  try {
    const res = await postUserUnBlock(targetId);
    console.log("service/userService.js: unBlockUserService res:", res);

    return res?.status === "success"
      ? { result: "success" }
      : { result: "fail" };
  } catch (error) {
    console.error("❌ Error in unBlockUserService:", error);
    return { result: "fail" };
  }
}

