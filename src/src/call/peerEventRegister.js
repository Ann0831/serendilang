import { eventBus } from "../utils/callEventBus.js";
import {callEngine} from "./controller.js";

/**
 * 註冊所有通話、WebRTC、socket、UI 等事件
 * 呼叫一次即可完成整體事件綁定
 */

export function registerPeerEvents() {
  console.log("📡 registerCallEvents (core-minimal)");

  // 🎥 收到遠端影音流
  eventBus.on("peerOntrack", ({ streams }) => {
    console.log("callEngine: ",callEngine);
    console.log("🎥 [Event] peerOntrack → call:receiveRemoteStream");
    callEngine?.peerOntrack({streams});
  });

  // ❄️ 本地 candidate 產生
  eventBus.on("peerOniceCandidate", ({ candidate }) => {
    console.log("callEngine: ",callEngine);
    console.log("🧊 [Event] peerOniceCandidate → call:sendCandidate");
    callEngine?.peerOnicecandidate({candidate});
  });

  // 💥 ICE candidate error
  eventBus.on("peerOnicecandidateerror", (err) => {
    console.log("callEngine: ",callEngine);

    console.error("💥 [Event] peerOnicecandidateerror:", err);
    callEngine?.peerOnicecandidateerror();
  });

  // 🔄 ICE 狀態改變
  eventBus.on("peerOniceconnectionstatechange", ({ state }) => {
    console.log(`🔄 [Event] ICE state → ${state}`);
    console.log("callEngine: ",callEngine);
    callEngine?.peerOniceconnectionstatechange(state);
  });

  // 🌐 整體連線狀態改變
  eventBus.on("peerOnconnectionstatechange", ({ state }) => {
    console.log(`🌐 [Event] Connection state → ${state}`);
    console.log("callEngine: ",callEngine);
    callEngine?.peerOnconnectionstatechange({state});
  });

  console.log("✅ 基礎 WebRTC 事件已註冊完成 (registerCallEvents)");
}

