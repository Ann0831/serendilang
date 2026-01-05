import {postApiAnalyticsIceDisconnected, postAnalyticsFirstOnlineList,postAnalyticsWssDisconnect } from "/api/post_api.js";

export async function recordFirstOnlineList(onlineList,place) {
  try {
    const res = await postAnalyticsFirstOnlineList(onlineList,place);

    // 統一回傳格式
    if (res && res.status === "success") {
      console.log("✅ recordFirstOnlineList success:", res);
      return { result: "success", log_id: res.log_id || null };
    } else {
      console.warn("⚠️ recordFirstOnlineList failed:", res);
      return { result: "fail" };
    }
  } catch (err) {
    console.error("❌ Service recordFirstOnlineList error:", err);
    return { result: "fail" };
  }
}


export async function recordWssDisconnect(code, reason) {
  try {
    const res = await postAnalyticsWssDisconnect(code, reason);

    // 統一回傳格式
    if (res && res.status === "success") {
      console.log("✅ recordWssDisconnect success:", res);
      return { result: "success" };
    } else {
      console.warn("⚠️ recordWssDisconnect failed:", res);
      return { result: "fail" };
    }
  } catch (err) {
    console.error("❌ Service recordWssDisconnect error:", err);
    return { result: "fail" };
  }
}

export async function recordCallIceDisconnected(call_id) {
  try {
    const res = await postApiAnalyticsIceDisconnected(call_id);

    // 統一回傳格式
    if (res && res.status === "success") {
      console.log("✅ recordCallIceDisconnected success:", res);
      return { result: "success", message: res.message || null };
    } else {
      console.warn("⚠️ recordCallIceDisconnected failed:", res);
      return { result: "fail" };
    }
  } catch (err) {
    console.error("❌ Service recordCallIceDisconnected error:", err);
    return { result: "fail" };
  }
}

