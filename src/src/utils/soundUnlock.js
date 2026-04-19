import { soundPlayer } from "./soundPlayer.js";

const unlockAudio = () => {
  const silentWav = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
  soundPlayer.play(silentWav, 0);
};

window.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
window.addEventListener("keydown", unlockAudio, { once: true });
