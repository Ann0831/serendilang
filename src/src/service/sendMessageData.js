import { postMessage } from "../api/post_api.client.js";
import { handleServiceNetworkError } from "./networkErrorHandler.js";

export async function sendMessageData(targetId, text) {
  try {
    const response = await postMessage(targetId, text);

    if (response?.status === "success") {
      const payload = response?.data && typeof response.data === "object" ? response.data : response;
      return {
        result: "success",
        message_id: payload?.message_id || payload?.processed_message_id || null,
        timestamp: payload?.timestamp || null,
        timestamp_ms: payload?.timestamp_ms || null,
      };
    } else {
      return { result: "fail" };
    }
  } catch (error) {
    handleServiceNetworkError(error, "sendMessageData.js");
    console.error("Error in sendMessageData:", error);
    return { result: "fail" };
  }
}
