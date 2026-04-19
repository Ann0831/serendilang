import { postApiCallsInit } from "../api/post_api.client.js";
import { handleServiceNetworkError } from "./networkErrorHandler.js";

function normalizeCallInitPayload(payload = {}) {
  return {
    isCaller: !!payload.is_caller,
    currentUserId: String(payload.current_user_id || ""),
    targetId: String(payload.target_id || ""),
    useCamera: String(payload.use_camera || "0") === "1",
    callId: String(payload.call_id || ""),
    rtcConfig: payload.rtc_config || { iceServers: [] },
    onlyStunRtcConfig: payload.only_stun_rtc_config || { iceServers: [] },
    onlyTurnRtcConfig: payload.only_turn_rtc_config || { iceServers: [] },
    onlyExternalRtcConfig: payload.only_external_rtc_config || { iceServers: [] },
  };
}

export async function initializeCallSession({ targetId, useCamera, isCaller }) {
  try {
    const res = await postApiCallsInit(targetId, useCamera ? "1" : "0", isCaller ? "1" : "0");
    if (!res || res.status !== "success" || !res.data) {
      return { result: "fail", reason: "init_api_failed" };
    }

    const payload = normalizeCallInitPayload(res.data);
    if (!payload.currentUserId || !payload.targetId) {
      return { result: "fail", reason: "invalid_init_payload" };
    }

    return { result: "success", payload };
  } catch (err) {
    handleServiceNetworkError(err, "callInitService.js");
    console.error("❌ initializeCallSession error:", err);
    return { result: "fail", reason: "network_or_runtime_error" };
  }
}
