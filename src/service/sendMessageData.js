import { postMessage } from "../api/post_api.js";

export async function sendMessageData(targetId, text) {
  try {
    const response = await postMessage(targetId, text);

    if (response?.status === "success") {
      return { result: "success" };
    } else {
      return { result: "fail" };
    }
  } catch (error) {
    console.error("Error in sendMessageData:", error);
    return { result: "fail" };
  }
}

