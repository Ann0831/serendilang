// ./service/reportService.js
import { postSendPostReport, postSendReportUser } from "/api/post_api.js";
import { getMyPostReports } from "/api/api.js";

/**
 * ✅ Service：檢舉貼文
 * @param {string|number} postId - 被檢舉的貼文 ID
 * @param {string} reason - 檢舉原因
 * @returns {Promise<{ result: string, [key: string]: any }>}
 */
export async function reportPostService(postId, reason) {
  if (!postId || !reason.trim()) {
    console.warn("[Service:reportPostService] ⚠️ 缺少 postId 或 reason");
    return { result: "fail", message: "Invalid parameters" };
  }

  try {
    const res = await postSendPostReport(postId, reason);

    if (res && res.status === "success") {
      console.log("[Service:reportPostService] ✅ 檢舉成功:", res);
      return { result: "success", data: res.data ?? {} };
    }

    console.warn("[Service:reportPostService] ⚠️ 檢舉失敗:", res);
    return {
      result: "fail",
      message: res?.message || "Report failed",
    };
  } catch (err) {
    console.error("[Service:reportPostService] ❌ 例外:", err);
    return { result: "fail", message: err.message || "Service error" };
  }
}

/**
 * ✅ Service：檢舉使用者
 * @param {string|number} targetId
 * @param {string} reason
 * @param {File|null} evidenceFile
 */
export async function sendReportUserService(targetId, reason, evidenceFile = null) {
  if (!targetId || !reason.trim()) {
    console.warn("[Service:sendReportUserService] ⚠️ 缺少必要參數");
    return { result: "fail", message: "Invalid parameters" };
  }

  try {
    const res = await postSendReportUser(targetId, reason, evidenceFile);

    if (res && res.status === "success") {
      console.log("[Service:sendReportUserService] ✅ 檢舉成功:", res);
      return { result: "success", data: res.data ?? {} };
    }

    console.warn("[Service:sendReportUserService] ⚠️ 檢舉失敗:", res);
    return {
      result: "fail",
      message: res?.message || "Report failed",
    };
  } catch (err) {
    console.error("[Service:sendReportUserService] ❌ 例外:", err);
    return { result: "fail", message: err.message || "Service error" };
  }
}

/**
 * ✅ Service：取得自己送出的貼文檢舉列表
 * @returns {Promise<Array>}
 */
export async function fetchMyPostReportsService() {
  try {
    const res = await getMyPostReports();

    if (res && res.status === "success" && Array.isArray(res.data)) {
      console.log("[Service:fetchMyPostReportsService] ✅ 成功:", res.data);
      return res.data;
    }

    console.warn("[Service:fetchMyPostReportsService] ⚠️ 回傳格式異常:", res);
    return [];
  } catch (err) {
    console.error("[Service:fetchMyPostReportsService] ❌ 例外:", err);
    return [];
  }
}

