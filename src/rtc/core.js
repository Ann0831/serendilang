
// --- File: ./rtc/core.js
// WebRTC core (no DOM IDs, parameterized)
import {eventBus} from  "/utils/callEventBus.js";


let disconnectTimer = null;

export function newPeerConnection(rtcConfig) {
  return new RTCPeerConnection(rtcConfig);
}

export async function getLocalStream({ video = true, audio = true } = {}) {
  const v = typeof video === "boolean" ? video : !!video;
  const a = typeof audio === "boolean" ? audio : !!audio;
  return await navigator.mediaDevices.getUserMedia({ video: v, audio: a });
}


export async function createAndSetLocalOffer(peer) {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  return offer;
}

export async function createAndSetLocalAnswer(peer) {
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  return answer;
}

export async function setRemote(peer, description) {
  await peer.setRemoteDescription(description);
}

export async function addRemoteCandidate(peer, candidate) {
  try {
    await peer.addIceCandidate(candidate);
  } catch (err) {
    console.error("addRemoteCandidate error", err);
  }
}

export function teardownPeer(peer) {
  try {
    peer?.getSenders?.().forEach((s) => s.track && s.track.stop());
    peer?.close?.();
  } catch {}
}

