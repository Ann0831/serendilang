import { fetchUserProfileUsername, fetchUserProfileLanguage, fetchUserProfilePicUrl } from "/service/getUserProfile.js";

export async function showStopSign(reason = "error", target_id = null) {
  removeExistingStopSign();

  const messages = {
    offline: "❌ The user is currently offline and cannot receive the call.",
    busy: "📞 The user is already on another call. Please try again later.",
    error: "⚠️ The call was interrupted. Please try again.",
    peerLeft: "👋 The other participant has left the call.",
    iceFailed: "🌐 ICE connection lost. The call has been disconnected.",
    // ✅ 新增的訊息：
    ratelimit: "🚫 You are making calls too frequently. Please wait a moment before trying again.",
    replaced: "🔄 Your session was replaced by another device or tab.",
    meCancelCall: "🚫 You canceled the call.",
    timeout: "⏱️ The call request timed out. Please try again later.",
  };

  const message = messages[reason] || messages.error;

  // 取得對方資料（如果有傳入 target_id）
  let target_username = "";
  let target_langInfo = null;
  let target_avatar_url = "";

  if (target_id) {
    try {
      const [usernameRes, langRes, picRes] = await Promise.all([
        fetchUserProfileUsername(target_id),
        fetchUserProfileLanguage(target_id),
        fetchUserProfilePicUrl(target_id),
      ]);
      target_username = usernameRes || "Unknown";
      target_langInfo = langRes || null;
      target_avatar_url = picRes || "/assets/images/defaultAvatar.svg";
    } catch (err) {
      console.warn("⚠️ 無法取得使用者資料:", err);
    }
  }

  const langDisplay = target_langInfo
    ? `${target_langInfo.nativelanguage || ""} → ${target_langInfo.targetlanguage || ""}`
    : "";

  // 建立 overlay
  const overlay = document.createElement("div");
  overlay.id = "call-stop-sign";
  overlay.className = `
    fixed inset-0 flex items-center justify-center 
    bg-black/80 backdrop-blur-sm z-[9999]
    animate-fade-in
  `;

  // 建立內容框
  const box = document.createElement("div");
  box.className = `
    bg-white text-gray-800 rounded-2xl shadow-lg p-6 w-[90%] max-w-sm
    text-center animate-slide-up
  `;

  box.innerHTML = `
    <div class="flex flex-col items-center gap-3">
      ${
        target_id
          ? `
        <div class="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-gray-300">
          <img src="${target_avatar_url}" alt="avatar" class="w-full h-full object-cover" />
        </div>
        <div class="text-2xl font-semibold mt-1">${target_username}</div>
        <div class="text-gray-500 text-sm">${langDisplay}</div>
      `
          : ""
      }
      <div class="mt-4 text-lg text-gray-700 font-medium">Call Ended</div>
      <div class="mt-1 text-base leading-relaxed text-gray-600">${message}</div>

      <div class="flex flex-col items-center mt-6 space-y-3">
        ${
          target_id
            ? `
        <button id="viewProfileButton" 
          class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg w-40 transition-all">
          View Profile
        </button>
        `
            : ""
        }

        <button id="stopSignCloseBtn" 
          class="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-lg w-40 transition-all">
          Close
        </button>
      </div>
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // 關閉邏輯
  const close = () => {
    window.close();
  };

  document.getElementById("stopSignCloseBtn").onclick = close;

  // 若有 profile 按鈕
  const viewProfileBtn = document.getElementById("viewProfileButton");
  if (viewProfileBtn) {
    viewProfileBtn.onclick = () => {
      const safeId = encodeURIComponent(target_id);
      window.location.replace(`/user/${safeId}`);
    };
  }
}



/**
 * Remove existing stop sign to prevent overlap
 */
function removeExistingStopSign() {
  const existing = document.getElementById("call-stop-sign");
  if (existing) existing.remove();
}

/* 💫 Add these keyframes to your global CSS:
@keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes fade-out { from { opacity: 1 } to { opacity: 0 } }
@keyframes slide-up { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

.animate-fade-in { animation: fade-in 0.3s ease forwards; }
.animate-fade-out { animation: fade-out 0.3s ease forwards; }
.animate-slide-up { animation: slide-up 0.4s ease forwards; }
*/

