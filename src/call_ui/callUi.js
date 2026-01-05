import { fetchUserProfileUsername,fetchUserProfileLanguage,fetchUserProfilePicUrl } from "/service/getUserProfile.js";

// --- File: ./call_ui/callUi.js
// UI helpers referenced by controller

export async function loadTargetLanguageInfo(targetId, elementId = "target_language") {
  try {
    const langInfo = await fetchUserProfileLanguage(targetId);
    if (langInfo) {
      const { nativelanguage, targetlanguage } = langInfo;
      const targetLangDiv = document.getElementById(elementId);
      if (targetLangDiv) {
        targetLangDiv.textContent = `${nativelanguage || "?"} → ${targetlanguage || "?"}`;
      }
    }
    return langInfo;
  } catch (err) {
    console.error("❌ 無法取得對方語言資訊:", err);
  }
}


export function showDialing() {
  const el = document.getElementById("dialingOverlay");
  if (el) el.style.display = "flex";
}

export function hideDialing() {
  const el = document.getElementById("dialingOverlay");
  if (el) el.style.display = "none";
}

export function showEndCallButton() {
  console.log("/call_ui/callUi.js :showEndCallButton");
  const btn = document.getElementById("endCallButton");
  if (btn){ 
   btn.classList.remove("hidden");
   btn.style.display = "block"

   console.log("/call_ui/callUi.js :showEndCallButton remove hidden");

  }
}

export function showTimeoutAndHideDialing() {
  const timeoutEl = document.getElementById("TimeoutOverlay");
  const dialingEl = document.getElementById("dialingOverlay");
  if (timeoutEl) timeoutEl.style.display = "flex";
  if (dialingEl) dialingEl.style.display = "none";
}

export function setDialingBusyCopy() {
  const text = document.getElementById("dialingOverlay-text");
  const btnText = document.getElementById("dialingOverlay-Buttontext");
  if (text) text.textContent = "The person you are calling is on another call";
  if (btnText) btnText.textContent = "quit";
}

export async function set_target_username(targetId){
  const target_username=await fetchUserProfileUsername(targetId);
  const el=document.getElementById("target_name");
  el.innerText=target_username;
  return target_username;

}

export async function set_target_avatar(targetId){
  const target_avatar=await fetchUserProfilePicUrl(targetId);
  const el=document.getElementById("target_avatar");
  el.src=target_avatar;
  return target_avatar;
}


/**
 * 顯示通話結束畫面，10 秒後自動關閉
 * @param {Object} options
 * @param {string} options.target_avatar_url - 對方頭像URL
 * @param {string} options.target_language - 對方語言
 * @param {string} options.target_username - 對方名稱
 */
export function showCallEndOverlay(target_avatar_url, target_langInfo, target_username, target_id) {
  console.log("showCallEndOverlay");

  // 移除舊 overlay（若存在）
  const existing = document.getElementById("CallEndOverlay");
  if (existing) existing.remove();

  // 建立 overlay
  const overlay = document.createElement("div");
  overlay.id = "CallEndOverlay";
  overlay.className =
    "fixed inset-0 z-[3000] bg-black/85 flex flex-col justify-center items-center text-white text-center animate-fadein";

  // 倒數秒數
  let countdown = 10;

  // 處理語言顯示文字
  const langDisplay = target_langInfo
    ? `${target_langInfo.nativelanguage || ''} → ${target_langInfo.targetlanguage || ''}`
    : "";

  overlay.innerHTML = `
    <div class="flex flex-col items-center gap-3">
      <div class="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-white/30">
        <img src="${target_avatar_url || '/assets/defaultAvatar.svg'}" alt="avatar" class="w-full h-full object-cover" />
      </div>
      <div class="text-2xl font-semibold mt-1">${target_username || 'Unknown'}</div>
      <div class="text-gray-300 text-sm">${langDisplay}</div>
      <div class="mt-4 text-lg text-gray-200">Call Ended</div>
      <div id="countdownText" class="mt-2 text-sm text-gray-400">Closing in ${countdown}s...</div>

      <div class="flex flex-col items-center mt-6 space-y-3">
        <button id="closeCallEndOverlay" class="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-lg w-40">
          Close Now
        </button>
        <button id="viewProfileButton" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg w-40">
          View Profile
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const countdownEl = overlay.querySelector("#countdownText");
  const closeBtn = overlay.querySelector("#closeCallEndOverlay");
  const viewProfileBtn = overlay.querySelector("#viewProfileButton");

  // 更新倒數
  const interval = setInterval(() => {
    countdown--;
    countdownEl.textContent = `Closing in ${countdown}s...`;
    if (countdown <= 0) {
      clearInterval(interval);
      fadeOutAndClose();
    }
  }, 1000);

  // 關閉事件
  function fadeOutAndClose() {
    overlay.classList.add("opacity-0", "transition", "duration-700");
    setTimeout(() => {
      overlay.remove();
      // ✅ 自動關閉頁面
      window.close();
      // 若瀏覽器不允許自動關閉，可改導向首頁：
      // window.location.href = "/";
    }, 700);
  }

  closeBtn.onclick = () => {
    clearInterval(interval);
    fadeOutAndClose();
  };

  // 前往使用者頁面事件
  viewProfileBtn.onclick = () => {
    clearInterval(interval);
    overlay.classList.add("opacity-0", "transition", "duration-500");
    setTimeout(() => {
      const safeId = encodeURIComponent(target_id);
      window.location.replace(`/user/${safeId}`);
    }, 500);
  };
}
 
