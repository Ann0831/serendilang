


/**
 * 建立聊天室骨架
 * @param {Object} obj - 聊天室資料 (來自 getChatRoomData)
 * @param {string|number} obj.userId - 使用者 ID
 * @returns {HTMLElement}
 */
export function createChatRoomSkeleton(obj = {}) {
  const { userId } = obj;

  const wrapper = document.createElement("div");
  wrapper.className =
    "bg-white shadow-lg rounded-lg border flex flex-col animate-pulse";
  if (userId) wrapper.dataset.userId = userId;

  wrapper.style.width = "23rem";
  wrapper.style.height = "28rem";

  // header skeleton
  const header = document.createElement("div");
  header.className = "h-12 bg-gray-200 rounded-t-lg flex items-center px-3 gap-2";
  header.innerHTML = `
    <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
    <div class="w-24 h-4 bg-gray-300 rounded"></div>
  `;
  wrapper.appendChild(header);

  // messages skeleton
  const messages = document.createElement("div");
  messages.className = "flex-1 p-3 space-y-2 overflow-y-auto";
  for (let i = 0; i < 5; i++) {
    const bubble = document.createElement("div");
    bubble.className = "w-2/3 h-4 bg-gray-200 rounded";
    messages.appendChild(bubble);
  }
  wrapper.appendChild(messages);

  // input skeleton
  const inputBar = document.createElement("div");
  inputBar.className = "h-12 bg-gray-200 rounded-b-lg flex items-center px-3";
  inputBar.innerHTML = `<div class="w-full h-6 bg-gray-300 rounded"></div>`;
  wrapper.appendChild(inputBar);

  return wrapper;
}

/**
 * 建立完整聊天室 UI
 * @param {Object} obj - 聊天室資料 (來自 getChatRoomData)
 * @param {string|number} obj.userId - 使用者 ID
 * @param {string} obj.username - 對方名稱
 * @param {string} obj.profilePicUrl - 對方頭貼 URL
 * @param {Object} obj.language - 對方語言
 * @param {Array<{fromSelf: boolean, text: string}>} obj.messages - 訊息陣列
 * @returns {HTMLElement}
 */
export function createChatRoom(obj = {}) {
  const { userId, username, profilePicUrl, language, messages = [],isBlocked = false  } = obj;
  console.log("/ui_create: createChatRoom: obj: ", obj);
  if (isBlocked) {
    return createBlockedChatRoomUI({ userId, username, profilePicUrl, language }
);
  
  }
  // 外層
  const wrapper = document.createElement("div");
  wrapper.className = "bg-white shadow-lg rounded-lg border flex flex-col relative";
  wrapper.style.width = "23rem";
  wrapper.style.height = "28rem";


  wrapper.dataset.chatroomRoot = "true";
  // 基本資料
  wrapper.dataset.userId = userId || "";
  wrapper.dataset.username = username || "Unknown";
  wrapper.dataset.profilePicUrl = profilePicUrl || "/assets/images/defaultAvatar.svg";
  wrapper.dataset.nativelanguage = language?.nativelanguage || "?";
  wrapper.dataset.targetlanguage = language?.targetlanguage || "?";
  wrapper.dataset.userdataHash = "" //to be done

  const call_eventParameter = {
  target_id: wrapper.dataset.userId || "",
  target_avatar_url: wrapper.dataset.profilePicUrl || "/assets/images/defaultAvatar.svg",
  target_username: wrapper.dataset.username || "Unknown",
  target_langInfo: {
    nativelanguage: wrapper.dataset.nativelanguage || "?",
    targetlanguage: wrapper.dataset.targetlanguage || "?"
  },
  target_userdataHash: wrapper.dataset.userdataHash || "", // 預留簽章驗證
  from: "chatRoom",
};





  // ===== Header（加厚 + 左側上下排）=====
  const header = document.createElement("div");
  header.className =
    "h-16 bg-white text-indigo-900 flex items-center justify-between px-3 rounded-t-lg";

  // 左側：頭像 +（名稱/語言上下排）
  const leftWrap = document.createElement("div");
  leftWrap.className = "flex items-center gap-3 truncate";

  const avatar = document.createElement("img");
  avatar.src = profilePicUrl || "/assets/images/defaultAvatar.svg";
  avatar.alt = `${username || "Unknown"} avatar`;
  avatar.className = "w-10 h-10 rounded-full object-cover bg-white cursor-pointer";
  avatar.dataset.actionList=JSON.stringify([{"type":"click","action":"openUserPage","eventParameter":{"author_id":userId,"from":"/service/createPostCard.js"}}]);
  const nameLangWrap = document.createElement("div");
  nameLangWrap.className = "flex flex-col leading-tight min-w-0";

  const nameEl = document.createElement("span");
  nameEl.className = "font-semibold truncate cursor-pointer";
  nameEl.textContent = username || "Unknown";
  nameEl.dataset.actionList=JSON.stringify([{"type":"click","action":"openUserPage","eventParameter":{"author_id":userId,"from":"/service/createPostCard.js"}}]);
  nameLangWrap.appendChild(nameEl);

  if (language?.nativelanguage || language?.targetlanguage) {
    const langEl = document.createElement("span");
    langEl.className = "text-xs text-black truncate";
    langEl.textContent = `${language?.nativelanguage || "?"} → ${language?.targetlanguage || "?"}`;
    nameLangWrap.appendChild(langEl);
  }

  leftWrap.appendChild(avatar);
  leftWrap.appendChild(nameLangWrap);

  // 右側：📞 🎥 ⋯ ✕
  const rightWrap = document.createElement("div");
  rightWrap.className = "flex items-center gap-2";

  // 📞
  const callBtn = document.createElement("button");
  callBtn.className = "p-1 rounded hover:bg-gray-200 transition text-gray-600";
  callBtn.dataset.action = "start-voice-call";
  callBtn.dataset.userId = userId;
  callBtn.dataset.actionList = JSON.stringify([{
    type: "click",
    action: "start-voice-call",
    eventParameter: call_eventParameter
  }]);
  callBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         fill="currentColor"
         class="w-6 h-6">
      <path fill-rule="evenodd"
            d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
            clip-rule="evenodd" />
    </svg>
  `;

  // 🎥
  const videoBtn = document.createElement("button");
  videoBtn.className = "p-1 rounded hover:bg-gray-200 transition text-gray-600";
  videoBtn.dataset.action = "start-video-call";
  videoBtn.dataset.userId = userId;
  videoBtn.dataset.actionList = JSON.stringify([{
    type: "click",
    action: "start-video-call",
    eventParameter: call_eventParameter
  }]);
  videoBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         fill="currentColor"
         class="w-6 h-6">
      <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
    </svg>
  `;

  // ⋯ 三點 + dropdown
  const moreBtnWrapper = document.createElement("div");
  moreBtnWrapper.className = "relative";

  const moreBtn = document.createElement("button");
  moreBtn.className = "p-1 rounded hover:bg-gray-200 transition text-gray-600";
  moreBtn.dataset.action = "chatroom-options";
  moreBtn.dataset.userId = userId;
  moreBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         fill="currentColor"
         class="w-6 h-6">
      <path d="M6.75 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM13.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM21.75 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>
    </svg>
  `;

const dropdown = document.createElement("div");
dropdown.id="ChatRoom_Menu-"+userId;
dropdown.className =
  "absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg hidden flex-col text-sm z-50";




// 建立 Report 按鈕
const reportBtn = document.createElement("button");
reportBtn.className =
  "w-full px-4 py-2 text-left hover:bg-gray-200 focus:outline-none";
reportBtn.textContent = "⚠️ Report";

// 設定 dataset
reportBtn.dataset.actionList = JSON.stringify([{
  type: "click",
  action: "openReportUserModal",
  eventParameter: { target_id: userId, target_name:username,"from": "chatRoom" }
}]);

// 建立 Block 按鈕
const blockBtn = document.createElement("button");
blockBtn.className =
  "w-full px-4 py-2 text-left text-red-600 hover:bg-gray-200 focus:outline-none";
blockBtn.textContent = "⛔ Block";

// 設定 dataset
blockBtn.dataset.actionList = JSON.stringify([{
  type: "click",
  action: "openBlockUserModal",
  eventParameter: { target_id: userId, target_name: username, from: "chatRoom" }
}]);
// 插入 dropdown
dropdown.appendChild(reportBtn);
dropdown.appendChild(blockBtn);

  

  moreBtnWrapper.appendChild(moreBtn);
  moreBtnWrapper.appendChild(dropdown);

moreBtn.dataset.actionList = JSON.stringify([{
  type: "click",
  action: "Toggle_ChatRoom_Menu",
  eventParameter: { target_id: userId, target_name:username,"from": "chatRoom" }
}]);






  // ✕
  const closeBtn = document.createElement("button");
  closeBtn.className = "p-1 rounded hover:bg-gray-200 transition text-gray-600";
  closeBtn.dataset.userId = userId;
  closeBtn.dataset.actionList = JSON.stringify([{
    type: "click",
    action: "closeChatRoom",
    eventParameter: { user_id: userId, from: "chatRoom" }
  }]);
  closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         fill="currentColor"
         class="w-6 h-6">
      <path fill-rule="evenodd"
            d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
            clip-rule="evenodd" />
    </svg>
  `;

  // 右側加入順序：📞 🎥 ⋯ ✕
  rightWrap.appendChild(callBtn);
  rightWrap.appendChild(videoBtn);
  rightWrap.appendChild(moreBtnWrapper);
  rightWrap.appendChild(closeBtn);

  header.appendChild(leftWrap);
  header.appendChild(rightWrap);
  wrapper.appendChild(header);

  // ===== Messages =====
  const messagesDiv = document.createElement("div");
  messagesDiv.className =
    "messages-container relative flex-1 min-h-0 p-3 space-y-2 overflow-y-auto overflow-x-hidden bg-gray-50 min-w-0";
  messagesDiv.style.overflowAnchor = "none";
  messagesDiv.dataset.actionList = JSON.stringify([
    { type: "scroll", action: "ChatRoomScroll", eventParameter: { user_id: userId } }
  ]);
  wrapper.appendChild(messagesDiv);

  // 🔄 Spinner（header 加厚後 top 改為 16）
  const spinner = document.createElement("div");
  spinner.id = `chat-spinner-${userId}`;
  spinner.className =
    "absolute top-16 left-1/2 transform -translate-x-1/2 z-40 hidden pointer-events-none";
  spinner.setAttribute("role", "status");
  spinner.setAttribute("aria-live", "polite");
  spinner.innerHTML = `
    <div class="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow">
      <span class="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></span>
      <span class="text-xs text-gray-700">Loading messages…</span>
    </div>
  `;
  wrapper.appendChild(spinner);


  // ===== Input Bar =====
  const inputBar = document.createElement("div");
  inputBar.className = "border-t flex items-end px-2 gap-2 bg-white py-2 relative";
  inputBar.style.minHeight = "3rem";
  inputBar.dataset.inputbarRoot = "true";


  // ✅ textarea
  const input = document.createElement("textarea");
  input.placeholder = "Type a message...";
  input.className =
    "flex-1 border rounded px-2 py-1 text-sm resize-none overflow-y-auto focus:ring-2 focus:ring-indigo-400";
  input.rows = 1;

  input.dataset.action = "chat-input";
  input.dataset.userId = userId;
  input.style.height = "28px";
  input.style.minHeight = "28px";
  input.style.maxHeight = "160px";
  input.style.lineHeight = "1.4";
  input.style.overflowY = "auto";
  input.style.webkitOverflowScrolling = "touch";

  input.addEventListener("input", () => {
    input.style.height = "28px";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  });
  input.dataset.actionList = JSON.stringify([
    {
      type: "keydown",
      action: "sendMessage",
      eventParameter: { user_id: userId, from: "chatRoom" },
    },
  ]);

  // ✅ emoji 按鈕
  const emojiBtn = document.createElement("button");
  emojiBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
       stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
    <path stroke-linecap="round" stroke-linejoin="round"
          d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0
             9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75
             9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625
             0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375
             0h.008v.015h-.008V9.75Z" />
  </svg>
`;
  emojiBtn.className =
    "text-2xl px-1 hover:bg-gray-100 rounded transition select-none relative";
  emojiBtn.title = "Insert emoji";

  // ✅ 隱藏 input (for native picker)
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "text";
  hiddenInput.className = "absolute opacity-0 pointer-events-none";
  inputBar.appendChild(hiddenInput);

  // ✅ fallback emoji 選單
  const emojiMenu = document.createElement("div");
  emojiMenu.id="EmojiMenu-"+userId;
  emojiMenu.className =
    "absolute bottom-12 right-12 bg-white border rounded shadow-lg p-2 grid grid-cols-5 gap-1 hidden z-50";
  const emojis = ["😀", "😂", "😍", "😎", "🤔", "😭", "😡", "👍", "🔥", "🎉"];
  emojis.forEach(e => {
    const btn = document.createElement("button");
    btn.textContent = e;
    btn.className = "text-2xl hover:bg-gray-100 rounded p-1";
    btn.addEventListener("click", () => {
      const cursorPos = input.selectionStart;
      const text = input.value;
      input.value = text.slice(0, cursorPos) + e + text.slice(cursorPos);
      input.dispatchEvent(new Event("input"));
      input.focus();
      input.selectionStart = input.selectionEnd = cursorPos + e.length;
      emojiMenu.classList.add("hidden");
    });
    emojiMenu.appendChild(btn);
  });
  inputBar.appendChild(emojiMenu);
  emojiBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "toggleEmojiMenu",
      eventParameter: { user_id: userId, from: "chatRoom" },
    },
  ]);

  // ✅ emoji 按鈕行為：優先用原生 picker，不支援才 fallback

  // ✅ send 鍵
  const sendBtn = document.createElement("button");
  sendBtn.textContent = "Send";
  sendBtn.className =
    "px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition";
  sendBtn.dataset.action = "chat-send";
  sendBtn.dataset.userId = userId;
  sendBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "sendMessage",
      eventParameter: { user_id: userId, from: "chatRoom" },
    },
  ]);

  // ✅ 組合順序
  inputBar.appendChild(input);
  inputBar.appendChild(emojiBtn);
  inputBar.appendChild(sendBtn);
  wrapper.appendChild(inputBar);

  

  return wrapper;
}




export function createIncomingCallOverlay(username, userId, duration = 10) {
  // 📞 overlay
  const overlay = document.createElement("div");
  overlay.className = "incoming-call-overlay absolute inset-0 bg-black/60 flex flex-col items-center justify-center space-y-4 z-50 overflow-hidden";

  // 🌊 波浪背景
  const waveCanvas = document.createElement("canvas");
  waveCanvas.width = 300;
  waveCanvas.height = 160;
  waveCanvas.className = "absolute top-1/3 opacity-30";
  overlay.appendChild(waveCanvas);
  const wctx = waveCanvas.getContext("2d");
  let waveTime = 0;

  function drawWave() {
    const width = waveCanvas.width;
    const height = waveCanvas.height;
    const amplitude = 10;
    const wavelength = 60;
    const speed = 0.02;

    wctx.clearRect(0, 0, width, height);
    wctx.beginPath();
    for (let x = 0; x < width; x++) {
      const y =
        height / 2 +
        Math.sin((x / wavelength + waveTime) * 2 * Math.PI) * amplitude;
      wctx.lineTo(x, y);
    }
    wctx.strokeStyle = "rgba(255,255,255,0.4)";
    wctx.lineWidth = 2;
    wctx.stroke();
    waveTime += speed;
    requestAnimationFrame(drawWave);
  }
  drawWave();

  // 📞 倒數弧度圈（不論頁面是否可見都繼續）
  const ring = document.createElement("canvas");
  ring.width = 90;
  ring.height = 90;
  ring.className = "fixed-circle relative z-10";
  overlay.appendChild(ring);

  const ctx = ring.getContext("2d");
  const radius = 36;
  const center = ring.width / 2;
  const startAngle = -Math.PI / 2;
  const startTime = Date.now();

  function drawArc(progress) {
    ctx.clearRect(0, 0, ring.width, ring.height);
    // 背景圈
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 5;
    ctx.stroke();

    // 前景弧
    ctx.beginPath();
    ctx.arc(
      center,
      center,
      radius,
      startAngle,
      startAngle + 2 * Math.PI * (1 - progress)
    );
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function animateArc() {
    const elapsedSec = (Date.now() - startTime) / 1000;
    const progress = Math.min(elapsedSec / duration, 1);
    drawArc(progress);
    if (progress < 1) requestAnimationFrame(animateArc);
    else overlay.remove(); // ✅ 不論分頁是否可見都會在實際時間結束時移除
  }
  requestAnimationFrame(animateArc);

  // 📞 呼叫者文字（微光動態）
  const callerInfo = document.createElement("div");
  callerInfo.className =
    "caller-info-text text-white text-lg font-semibold animate-pulse relative z-10";
  callerInfo.textContent = `${username || "Unknown"} is calling you...`;

  // 📞 按鈕容器
  const btnWrap = document.createElement("div");
  btnWrap.className =
    "flex flex-col items-center space-y-3 w-full max-w-xs relative z-10";

  const acceptGroup = document.createElement("div");
  acceptGroup.className = "flex gap-3 w-full justify-center";

  // 接聽（開鏡頭）
  const acceptCameraBtn = document.createElement("button");
  acceptCameraBtn.className = "btn btn-accept-camera flex-1 text-sm py-1.5";
  acceptCameraBtn.textContent = "Accept (With Camera)";
  acceptCameraBtn.dataset.action = "accept-call-camera";
  acceptCameraBtn.dataset.userId = userId;
  acceptCameraBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "accept-video-call",
      eventParameter: { user_id: userId, from: "chatRoom" },
    },
  ]);

  // 接聽（僅語音）
  const acceptNoCameraBtn = document.createElement("button");
  acceptNoCameraBtn.className = "btn btn-accept-nocamera flex-1 text-sm py-1.5";
  acceptNoCameraBtn.textContent = "Accept (Without Camera)";
  acceptNoCameraBtn.dataset.action = "accept-call-nocamera";
  acceptNoCameraBtn.dataset.userId = userId;
  acceptNoCameraBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "accept-voice-call",
      eventParameter: { user_id: userId, from: "chatRoom" },
    },
  ]);

  // 拒接
  const rejectBtn = document.createElement("button");
  rejectBtn.className = "btn btn-reject text-sm py-1.5";
  rejectBtn.textContent = "❌ Reject";
  rejectBtn.dataset.action = "reject-call";
  rejectBtn.dataset.userId = userId;
  rejectBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "reject-call",
      eventParameter: { user_id: userId, from: "chatRoom" },
    },
  ]);

  acceptGroup.appendChild(acceptCameraBtn);
  acceptGroup.appendChild(acceptNoCameraBtn);
  btnWrap.appendChild(acceptGroup);
  btnWrap.appendChild(rejectBtn);

  overlay.appendChild(callerInfo);
  overlay.appendChild(btnWrap);

  return overlay;
}


function createBlockedChatRoomUI({ userId, username, profilePicUrl, language }) {
  // 外層
  const wrapper = document.createElement("div");
  wrapper.className = "bg-white shadow-lg rounded-lg border flex flex-col relative";
  wrapper.style.width = "23rem";
  wrapper.style.height = "28rem";

  // 🔧 與未封鎖版對齊的 dataset
  wrapper.dataset.userId = userId || "";
  wrapper.dataset.username = username || "Unknown";
  wrapper.dataset.profilePicUrl = profilePicUrl || "/assets/images/defaultAvatar.svg";
  wrapper.dataset.nativelanguage = language?.nativelanguage || "?";
  wrapper.dataset.targetlanguage = language?.targetlanguage || "?";

  // ===== Header =====
  const header = document.createElement("div");
  header.className = "h-16 bg-white text-indigo-900 flex items-center justify-between px-3 rounded-t-lg";

  // 左側：頭像 + 名稱/語言
  const leftWrap = document.createElement("div");
  leftWrap.className = "flex items-center gap-3 truncate";

  const avatar = document.createElement("img");
  avatar.src = profilePicUrl || "/assets/images/defaultAvatar.svg";
  avatar.alt = `${username || "Unknown"} avatar`;
  avatar.className = "w-10 h-10 rounded-full object-cover bg-white cursor-pointer";
  avatar.dataset.actionList = JSON.stringify([
    { type: "click", action: "openUserPage", eventParameter: { author_id: userId, from: "chatRoom" } }
  ]);

  const nameLangWrap = document.createElement("div");
  nameLangWrap.className = "flex flex-col leading-tight min-w-0";

  const nameEl = document.createElement("span");
  nameEl.className = "font-semibold truncate cursor-pointer";
  nameEl.textContent = username || "Unknown";
  nameEl.dataset.actionList = JSON.stringify([
    { type: "click", action: "openUserPage", eventParameter: { author_id: userId, from: "chatRoom" } }
  ]);
  nameLangWrap.appendChild(nameEl);

  if (language?.nativelanguage || language?.targetlanguage) {
    const langEl = document.createElement("span");
    langEl.className = "text-xs text-black truncate";
    langEl.textContent = `${language?.nativelanguage || "?"} → ${language?.targetlanguage || "?"}`;
    nameLangWrap.appendChild(langEl);
  }

  leftWrap.appendChild(avatar);
  leftWrap.appendChild(nameLangWrap);

  // 右側：⋯ + ✕ （保留你要的兩個）
  const rightWrap = document.createElement("div");
  rightWrap.className = "flex items-center gap-2";

  // ⋯ 三點選單
  const moreBtnWrapper = document.createElement("div");
  moreBtnWrapper.className = "relative";

  const moreBtn = document.createElement("button");
  moreBtn.className = "p-1 rounded hover:bg-gray-200 transition text-gray-600";
  moreBtn.dataset.action = "chatroom-options";
  moreBtn.dataset.userId = userId;
  moreBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
      <path d="M6.75 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM13.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM21.75 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>
    </svg>
  `;
  moreBtn.dataset.actionList = JSON.stringify([{
    type: "click",
    action: "Toggle_ChatRoom_Menu",
    eventParameter: { target_id: userId, target_name:username,"from": "chatRoom" }
  }]);

  const dropdown = document.createElement("div");
  dropdown.id = "ChatRoom_Menu-" + userId;
  dropdown.className = "absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg hidden flex-col text-sm z-50";

  const reportBtn = document.createElement("button");
  reportBtn.className = "w-full px-4 py-2 text-left hover:bg-gray-200 focus:outline-none";
  reportBtn.textContent = "⚠️ Report";
  reportBtn.dataset.actionList = JSON.stringify([
    { type: "click", action: "openReportUserModal", eventParameter: { target_id: userId, target_name: username, from: "chatRoom" } }
  ]);

  const unblockBtn = document.createElement("button");
  unblockBtn.className = "w-full px-4 py-2 text-left text-green-600 hover:bg-gray-200 focus:outline-none";
  unblockBtn.textContent = "✅ Unblock";
  unblockBtn.dataset.actionList = JSON.stringify([
    { type: "click", action: "openUnblockUserModal", eventParameter: { target_id: userId, target_name: username, from: "chatRoom" } }
  ]);

  dropdown.appendChild(reportBtn);
  dropdown.appendChild(unblockBtn);


  moreBtnWrapper.appendChild(moreBtn);
  moreBtnWrapper.appendChild(dropdown);

  // ✕ close
  const closeBtn = document.createElement("button");
  closeBtn.className = "p-1 rounded hover:bg-gray-200 transition text-gray-600";
  closeBtn.dataset.userId = userId;
  closeBtn.dataset.actionList = JSON.stringify([
    { type: "click", action: "closeChatRoom", eventParameter: { user_id: userId, from: "chatRoom" } }
  ]);
  closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
      <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
    </svg>
  `;

  rightWrap.appendChild(moreBtnWrapper);
  rightWrap.appendChild(closeBtn);

  header.appendChild(leftWrap);
  header.appendChild(rightWrap);
  wrapper.appendChild(header);

  // ===== Blocked 提示區（占滿內容區）=====
  const blockedDiv = document.createElement("div");
  blockedDiv.className = "flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50";

  blockedDiv.innerHTML = `
    <div class="border-2 border-red-500 bg-red-50 rounded-lg p-4 max-w-sm">
      <p class="text-red-600 font-semibold mb-2">This conversation is blocked.</p>
      <p class="text-sm text-gray-600">You won’t receive new messages from this user.</p>
    </div>
  `;
  wrapper.appendChild(blockedDiv);

  // =====（可選）保留輸入列但禁用，維持高度一致感 =====
  const inputBar = document.createElement("div");
  inputBar.className = "h-12 border-t flex items-center px-2 gap-2 bg-white";
  inputBar.dataset.inputbarRoot = "true";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "You’ve blocked this user.";
  input.className = "flex-1 border rounded px-2 py-1 text-sm bg-gray-100 text-gray-500";
  input.disabled = true;
  


  const sendBtn = document.createElement("button");
  sendBtn.textContent = "Send";
  sendBtn.disabled = true;
  sendBtn.className = "px-3 py-1 bg-gray-300 text-white rounded cursor-not-allowed";

  inputBar.appendChild(input);
  inputBar.appendChild(sendBtn);
  wrapper.appendChild(inputBar);

  return wrapper;
}

