import { eventBus } from "../../utils/eventBus.js";
import { soundPlayer } from "../../utils/soundPlayer.js";
import { getWss } from "../../wss/wssCenter.js";

const RECEIVE_MESSAGE_SOUND_URL = `${import.meta.env.BASE_URL}assets/sounds/receive_message_sound.mp3`;

let __realtimeSoundHandlersRegistered = false;

function canPlayRealtimeSound() {
  const ws = getWss?.();
  if (!ws) return true;
  return ws?.isVirtual ? !!ws?.isLeader : true;
}

export function registerRealtimeSoundHandlers() {
  if (__realtimeSoundHandlersRegistered) return;

  eventBus.on("receiveChatRoomMessage:wss", () => {
    if (!canPlayRealtimeSound()) return;
    try {
      soundPlayer.play(RECEIVE_MESSAGE_SOUND_URL, 1);
    } catch (err) {
      console.warn("[realtimeSound] receive message sound failed:", err);
    }
  });

  __realtimeSoundHandlersRegistered = true;
}

export default registerRealtimeSoundHandlers;
