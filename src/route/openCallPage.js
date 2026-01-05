/**
 * 打開通話頁面
 * @param {string|number} target_id - 要通話的對象 ID
 * @param {boolean} useCamera - 是否使用攝影機 (true=開鏡頭, false=只開麥克風)
 */
export function openCallPage(target_id, useCamera) {
  const url = new URL("/call", window.location.origin);
  url.searchParams.set("target_id", target_id);
  url.searchParams.set("useCamera", useCamera ? "1" : "0");

  window.open(url.toString(), "_blank", "noopener,noreferrer");
}
export function openAcceptCallPage(target_id, useCamera) {
  const url = new URL("/accept-call", window.location.origin);
  url.searchParams.set("target_id", target_id);
  url.searchParams.set("useCamera", useCamera ? "1" : "0");

  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

