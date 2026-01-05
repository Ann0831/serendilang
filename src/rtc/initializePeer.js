import {eventBus} from "/utils/callEventBus.js";


export function initializePeer({
  peer,
  localStream,
}) {
  if (!peer) {
    console.warn("bindPeerHandlers: no peer provided");
    return;
  }

  // 🎥 當遠端媒體流出現時
  peer.ontrack = (event) => {
    console.log("peerOnTrack in initializePeer: ",event);
    eventBus.emit("peerOntrack", event);
  };


  // ❄️ 當 ICE candidate 產生時
  peer.onicecandidate = (event) => {
    if (event.candidate) {
      eventBus.emit("peerOniceCandidate", { candidate: event.candidate });
    }
  };

  peer.onicecandidateerror=(event)=>{
    const { url, errorCode, errorText, hostCandidate } = event;
    console.error("💥 ICE candidate error:", {
      url,
      errorCode,
      errorText,
      hostCandidate
    });


  }

  // 🔗 當 ICE 連線狀態改變時
  peer.oniceconnectionstatechange = () => {
    const state = peer.iceConnectionState;
    console.log(`🔄 [Peer] ICE state: ${state}`);
    eventBus.emit("peerOniceconnectionstatechange",{state});
  };

  // ⚙️ 監聽 general connection 狀態變化
  peer.onconnectionstatechange = () => {
    const state = peer.connectionState;
    console.log(`🌐 [Peer] Connection state: ${state}`);
    eventBus.emit("peerOnonnectionstatechange",{state});
  };

  // 🧊 ICE gathering 狀態變化
  peer.onicegatheringstatechange = () => {
    console.log(`[Peer] ICE gathering: ${peer.iceGatheringState}`);
  };

  // 🔄 signaling 狀態（offer/answer 過程）
  peer.onsignalingstatechange = () => {
    console.log(`[Peer] Signaling state: ${peer.signalingState}`);
  };

  console.log("✅ 已綁定 WebRTC → eventBus 事件");
}

