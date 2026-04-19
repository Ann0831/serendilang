export function createFakeVideoTrack() {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");

  // 先畫黑色畫面
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 關鍵：一定要 captureStream(30)
  const stream = canvas.captureStream(30);
  const track = stream.getVideoTracks()[0];

  // ⭐⭐ 最關鍵：每 250ms 重新畫一次 frame，讓 WebRTC 真的收到有效 video frame
  const interval = setInterval(() => {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, 250);

  // 確保關閉時清理
  track.stop = new Proxy(track.stop, {
    apply(original) {
      clearInterval(interval);
      return original.apply(track, []);
    }
  });

  return track;
}


export function createSilentAudioTrack() {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  return dst.stream.getAudioTracks()[0];
}

