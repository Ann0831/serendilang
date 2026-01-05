
// --- File: ./rtc/domVideo.js
// Small helpers to wire streams to DOM elements by targetId


export function attachLocalStream(targetId, stream) {
  const el = document.getElementById(`localVideo-${targetId}`);
  if (!el) return;

  // 🧠 若現有 stream 相同，不重複 attach
  if (el.srcObject === stream) {
    console.log(`🎥 [${targetId}] 已經有相同 local stream，不重複 attach`);
    return;
  }

  try {
    // 🧹 停止舊的 stream（若存在且不同）
    if (el.srcObject && el.srcObject !== stream) {
      const oldStream = el.srcObject;
      oldStream.getTracks().forEach(t => t.stop?.());
    }

    el.srcObject = stream;
    el.style.display = "block";

    el.onloadedmetadata = () => safePlay(el);
  } catch (err) {
    console.warn("attachLocalStream error:", err);
  }
}


export function attachRemoteStream(targetId, stream) {
  const el = document.getElementById(`remoteVideo-${targetId}`);
  if (!el) return;

  // 🧠 若現有 stream 相同，不重複 attach
  if (el.srcObject === stream) {
    console.log(`🎥 [${targetId}] 已經有相同 stream，不重複 attach`);
    return;
  }

  try {
    // 🧹 停止舊的 stream（若存在且不同）
    if (el.srcObject && el.srcObject !== stream) {
      const oldStream = el.srcObject;
      oldStream.getTracks().forEach(t => t.stop?.());
    }

    el.srcObject = stream;
    el.style.display = "block";

    el.onloadedmetadata = () => safePlay(el);
  } catch (err) {
    console.warn("attachRemoteStream error:", err);
  }
}

export function hideVideos(targetId) {
  const local = document.getElementById(`localVideo-${targetId}`);
  const remote = document.getElementById(`remoteVideo-${targetId}`);
  if (local) local.style.display = "none";
  if (remote) remote.style.display = "none";
}

export async function resetStreams(targetId) {
  const local = document.getElementById(`localVideo-${targetId}`);
  const remote = document.getElementById(`remoteVideo-${targetId}`);

  try {
    if (local?.srcObject) {
      try {
        if (!local.paused) await local.pause();
      } catch {}
      local.srcObject.getTracks().forEach((t) => t.stop?.());
      local.srcObject = null;
    }

    if (remote?.srcObject) {
      try {
        if (!remote.paused) await remote.pause();
      } catch {}
      remote.srcObject.getTracks().forEach((t) => t.stop?.());
      remote.srcObject = null;
    }
  } catch (err) {
    console.warn("resetStreams error:", err);
  }
}



export function bindResizeAutoPlay(targetId) {
  window.addEventListener("resize", () => {
    const local = document.getElementById(`localVideo-${targetId}`);
    const remote = document.getElementById(`remoteVideo-${targetId}`);
    safePlay(local);
    safePlay(remote);
    if ((local && local.paused) || (remote && remote.paused)) {
      //alert("paused");
    }
  });
}

function safePlay(video) {
  try {
    if (video) video.play?.();
  } catch {}
}

