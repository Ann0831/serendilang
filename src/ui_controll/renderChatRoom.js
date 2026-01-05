import { createChatRoomSkeleton, createChatRoom } from "../ui_create/createChatRoom.js";
import { getChatRoomData,getChatMessages } from "../service/getChatRoomData.js";
import {sendMessageData} from "../service/sendMessageData.js"
import { diffOps } from "../utils/diffOps.js";
import {markConversationAsRead} from "../service/markIsRead.js";




// 以 userId 為 key 的狀態表
const loadMoreState = Object.create(null);
// 形如：loadMoreState[userId] = { running: false, nextArgs: null }

/**
 * 只執行最新一次的 loadMoreMessages
 * @param {string|number} userId
 * @param {HTMLElement} wrapper
 * @param {any} extraParams
 */
export function scheduleLoadMore(userId, wrapper, extraParams) {
  //has little chance that last request is not executed

  if (!userId) return;

  // 初始化 per-chat 狀態
  const state =
    loadMoreState[userId] ||
    (loadMoreState[userId] = { running: false, nextArgs: null });

  // 不管現在是否在跑，都先「覆蓋」成最新一次的參數
  state.nextArgs = [userId, wrapper, extraParams];

  // 若已有執行中的 runner，就讓它在下一輪 while 取用最新參數
  if (state.running) return;

  // 啟動 runner（每個聊天室只會啟一次）
  state.running = true;
  (async () => {
    try {
      // 只要有更新過的參數，就持續處理
      while (state.nextArgs) {
        // 先取出 & 清空，讓等待期間的新請求能覆蓋成「最新的」
        const [uid, wrap, extras] = state.nextArgs;
        state.nextArgs = null;

        await loadMoreMessages( wrap, extras);
        // 在 await 期間若又有 scheduleLoadMore(...) 被呼叫，
        // state.nextArgs 會被更新，迴圈會再跑一次（只處理最後那個）
      }
    } catch (err) {
      console.error("scheduleLoadMore error:", err);
    } finally {
      state.running = false;
    }
  })();
}







/**
 * Render 一個聊天室
 * @param {HTMLElement} container - 聊天室容器 (例如 #chatbox-container)
 * @param {string|number} userId - 對方使用者 ID
 */
export async function renderChatRoom(container, userId,isBlockedInfo={}) {
  if (!container) {
    console.error("❌ renderChatRoom: container 不存在");
    return;
  }
  
  console.log("ui_controll/renderChatRoom.js: renderChatRoom: userId: ",userId);

  // Step 1: 插入骨架
  const skeleton = createChatRoomSkeleton({ userId });
  
  container.appendChild(skeleton);
  
  try {
    // Step 2: 從 service 取得聊天室資料
    const data = await getChatRoomData(userId);
    if (!data) throw new Error("getChatRoomData 回傳空資料");

    // Step 3: 建立完整聊天室 (直接把 data 丟給 UI)
    const chatRoom = createChatRoom({...data,isBlocked:isBlockedInfo.isBlocked});
    console.log("ui_controll/renderChatRoom.js: renderChatRoom: ",chatRoom);
    ;


    // Step 4: 替換骨架
    
    container.replaceChild(chatRoom, skeleton);
    scheduleLoadMore(userId,chatRoom,{"showSpinner":"true"});   
    

    console.log(`✅ renderChatRoom(${userId}) success`);
  } catch (err) {
    console.error(`❌ renderChatRoom(${userId}) error:`, err);
    skeleton.innerHTML = `<div class="text-red-500 p-2">Loading failed</div>`;
  }
}




export async function loadMoreMessages(wrapper,extraParams={}) {
  if (!wrapper) return;
  const messagesDiv = wrapper.querySelector(".messages-container");
  messagesDiv.scrollTop=wrapper._scrollCache?.top ?? 0;
  // lock 檢查
  if (wrapper.dataset.loadingMessages === "true") {
    console.log("⚠️ loadMoreMessages: 已有請求進行中");
    return;
  }
  const {showSpinner,toBottom,keepLoc,amount}=extraParams;

  wrapper.dataset.loadingMessages = "true";
  if(showSpinner){
    showChatSpinner(wrapper);
  }
  
  try {
    
    
    const prevScrollTop = wrapper._scrollCache?.top ?? 0;
    const prevHeight = wrapper._scrollCache?.height ?? 0;
   console.log("/ui_controll/renderChatRoom.js loadMoreMessages: prevScrollTop,prevHeight",prevScrollTop,prevHeight); 
    console.log("scrollTop at try begin: ",messagesDiv.scrollTop); 

    // 初始化 _messages
    if (!Array.isArray(wrapper._messages)) {
      console.log("/ui_create/createchatRoom.js: loadMoreMessages: initialize");
      wrapper._messages = [];
    }

    // 計算要載多少
    let fetchAmount = amount;
    if (!fetchAmount) {
      console.log("/ui_create/createchatRoom.js: loadMoreMessages: wrapper._messages: ",[...wrapper._messages]);
      const currentCount = wrapper._messages.length;
      if (currentCount < 15) fetchAmount = 20;
      else if (currentCount < 40) fetchAmount = 50;
      else fetchAmount = "all";
    }

    console.log("/ui_create/createChatRoom.js: loadMoreMessages: fetchAmount:", fetchAmount);
    const targetId = wrapper.dataset.userId;
    console.log("scrollTop Before getChatMessages: ",messagesDiv.scrollTop);

    const newMsgs = await getChatMessages(targetId, fetchAmount);

    if (!Array.isArray(newMsgs) || newMsgs.length === 0) {
      console.log("⚠️ loadMoreMessages: 沒有新資料");
      return;
    }

    // 目前訊息 id 範圍
    const currentIds = wrapper._messages.map(m => m.message_id);
    const oldest = wrapper._messages[0];
    const newest = wrapper._messages[wrapper._messages.length - 1];

    // 去掉重複
    const filtered = newMsgs.filter(msg => !currentIds.includes(msg.message_id));
    if (filtered.length === 0) return;

    if (wrapper._messages.length === 0) {
      // 完全沒訊息 → 直接初始化（從舊到新 append）
      filtered.forEach(msg => {
        
        wrapper._messages.push(msg);
      });
    } else {
      const olderBatch = [];
      const newerBatch = [];
      const middleBatch = [];

      for (const msg of filtered) {
        if (msg.timestamp_ms <= oldest.timestamp_ms) {
          olderBatch.unshift(msg); // 保持從舊到新
        } else if (msg.timestamp_ms >= newest.timestamp_ms) {
          newerBatch.push(msg);
        } else {
          middleBatch.push(msg);
        }
      }

      // 插入更舊的
      olderBatch.forEach(msg => {
        wrapper._messages.unshift(msg);
       
      });

      // 插入更新的
      newerBatch.forEach(msg => {
        
        wrapper._messages.push(msg);
      });
      
      // 插入中間的（極少發生）
      if (middleBatch.length) {
        console.warn("⚠️ loadMoreMessages: 發現中間訊息，暫時 放棄", middleBatch);
        
      }
      


    }
      
    console.log("/ui_controll/renderChatRoom: loadMoreMessages: wrapper._messages:",wrapper._messages);
    console.log("scrollTop Before syncMessages",messagesDiv.scrollTop); 
 
    syncMessages(wrapper);
    // 載入訊息並 syncMessages(wrapper) 後
    requestAnimationFrame(() => {
       const newHeight = messagesDiv.scrollHeight;
       const diff = newHeight - prevHeight;
       messagesDiv.scrollTop = prevScrollTop + diff;

       // 更新快取
       wrapper._scrollCache = {
       top: messagesDiv.scrollTop,
       height: newHeight,
       client: messagesDiv.clientHeight
    };
});
    console.log(`✅ loadMoreMessages(${fetchAmount}): 插入 ${filtered.length} 筆`);
  } catch (err) {
    console.error("❌ loadMoreMessages error:", err);
  } finally {
    // 確保 lock 會釋放
    wrapper.dataset.loadingMessages = "false";
    hideChatSpinner(wrapper);
    if (document.visibilityState === "visible" && document.hasFocus()) {
       markConversationAsRead(wrapper.dataset.userId);
    }
  }
}

// 假設 diffOps(aIds, bIds) 可用
// aIds = 目前 DOM 的順序, bIds = 目標狀態(wrapper._messages)的順序

// 假設 diffOps(aIds, bIds) 可用
// aIds = 目前 DOM 的順序, bIds = 目標狀態(wrapper._messages)的順序
export function syncMessages(wrapper) {
  if (!wrapper) {
    console.error("syncMessages: wrapper 不存在");
    return;
  }
  const messagesDiv = wrapper.querySelector(".messages-container");
  if (!messagesDiv) {
    console.error("syncMessages: 找不到 .messages-container");
    return;
  }
const prevTop = wrapper._scrollCache?.top ?? 0;
const prevHeight = wrapper._scrollCache?.height ?? 0;

  if (!Array.isArray(wrapper._messages)) {
    console.error("syncMessages: wrapper._messages 尚未初始化");
    return;
  }

  // 套保險的容器樣式（與 appendChatMessage 一致）
  messagesDiv.classList.add("overflow-x-hidden", "min-w-0");

  const profilePicUrl = wrapper.dataset.profilePicUrl || "default.jpg";

  // === Step 1: 把所有 pending 移到最後 ===
  const pendings = Array.from(messagesDiv.querySelectorAll(".pending"));
  for (const el of pendings) {
    messagesDiv.appendChild(el); // appendChild 自帶移動效果
  }

  // === Step 2: 找 confirmed (非 pending) DOM ===
  let confirmedEls = Array.from(messagesDiv.children).filter(
    el => !el.classList.contains("pending")
  );

  // === Step 3: 移除沒有 data-message-id 的 DOM ===
  for (const el of [...confirmedEls]) {
    if (!el.dataset.messageId) {
      console.warn("syncMessages: 移除沒有 data-message-id 的 DOM 節點", el);
      messagesDiv.removeChild(el);
      confirmedEls = confirmedEls.filter(e => e !== el);
    }
  }

  // === Step 4: 計算 diff 並更新 ===
  const domIds = confirmedEls.map(el => el.dataset.messageId);
  const targetIds = wrapper._messages.map(m => m.message_id);

  const nearBottom =
    Math.abs(
      messagesDiv.scrollHeight -
        messagesDiv.clientHeight -
        messagesDiv.scrollTop
    ) < 8;

  const ops = diffOps(domIds, targetIds);
  const msgById = new Map(wrapper._messages.map(m => [m.message_id, m]));

  for (const op of ops) {
    if (op.type === "keep") {
      const msg = msgById.get(op.value);
      if (!msg) continue;
      const el = findChildById(messagesDiv, op.value);
      if (!el) continue;

      const bubble = el.querySelector('[data-role="bubble"]');
      if (bubble && bubble.textContent !== (msg.text ?? "")) {
        bubble.textContent = msg.text ?? "";
      }
      continue;
    }

    if (op.type === "delete") {
      const el = findChildByIndex(messagesDiv, op.index)||findChildById(messagesDiv, op.value);
      if (el) messagesDiv.removeChild(el);
      continue;
    }

    if (op.type === "insert") {
      const msg = msgById.get(op.value);
      if (!msg) continue;
      const row = buildMessageRow(msg, profilePicUrl);

      const idx = clampIndex(op.index, messagesDiv.children.length);
      const refNode = messagesDiv.children[idx] || null;
      messagesDiv.insertBefore(row, refNode);
      continue;
    }
  }
// 重新算 scrollHeight
const newHeight = messagesDiv.scrollHeight;
const diff = newHeight - prevHeight;

const targetTop = prevTop + diff;
messagesDiv.scrollTop = targetTop;

console.log("/ui_controll syncMessages: prevTop =", prevTop);
console.log("/ui_controll syncMessages: diff =", diff);
console.log("/ui_controll syncMessages: targetTop =", targetTop);

// 更新快取（以 reflow 後的最終值為準）
wrapper._scrollCache = {
  top: messagesDiv.scrollTop,
  height: newHeight,
  client: messagesDiv.clientHeight
};

  // === 小工具 ===
  function buildMessageRow(msg, profilePicUrl) {
    const msgRow = document.createElement("div");
    msgRow.dataset.messageId = msg.message_id;
    msgRow.className =
      "w-full min-w-0 flex items-end mb-2 " +
      (msg.fromSelf ? "justify-end" : "justify-start");

    if (!msg.fromSelf) {
      const avatar = document.createElement("img");
      avatar.src = profilePicUrl;
      avatar.alt = "avatar";
      avatar.className =
        "w-8 h-8 rounded-full object-cover border border-gray-300 mr-2 flex-shrink-0";
      msgRow.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.setAttribute("data-role", "bubble");
    bubble.className =
      "min-w-0 px-3 py-2 rounded-2xl max-w-[70%] text-sm leading-snug shadow break-words break-all whitespace-pre-wrap overflow-hidden " +
      (msg.fromSelf
        ? "bg-indigo-500 text-white rounded-br-none"
        : "bg-gray-200 text-gray-900 rounded-bl-none");
    bubble.textContent = msg.text ?? "";
    msgRow.appendChild(bubble);

    if (msg.fromSelf) {
      const spacer = document.createElement("div");
      spacer.className = "flex-shrink-0";
      msgRow.appendChild(spacer);
    }

    return msgRow;
  }

  function findChildById(container, id) {
    const children = container.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const el = children[i];
      if (el.dataset.messageId === id) return el;
    }
    return null;
  }

  function findChildByIndex(container, idx) {
    const children = container.children;
    if (typeof idx !== "number") return null;
    if (idx < 0 || idx >= children.length) return null;
    return children[idx];
  }

  function clampIndex(i, len) {
    if (typeof i !== "number" || !Number.isFinite(i)) return len;
    if (i < 0) return 0;
    if (i > len) return len;
    return i;
  }
}

export async function sendMessage(wrapper,inputEl,target_id){
    console.log("sendMessage: ",wrapper,inputEl,target_id);

    const msgTxt=inputEl.value;
    const sendMsgRow=sendPendingMessage(wrapper, msgTxt);
    inputEl.value="";
    inputEl.style.height = "28px";
    const messagesDiv = wrapper.querySelector(".messages-container");
    const sendMessageResult=await sendMessageData(target_id,msgTxt);
    if(sendMessageResult.result==="success"){
      confirmPendingMessage(sendMsgRow, sendMessageResult.message_id);
    }else{
	sendMsgRow.remove();
    }
    console.log("/ui_controll/renderChatRoom.js:  sendMessage: sendMessageResult: ",sendMessageResult);
    scheduleLoadMore(target_id,wrapper,{"amount":20});
    
}


export function sendPendingMessage(wrapper, text) {
  if (!wrapper) {
    console.error("sendPendingMessage: wrapper 不存在");
    return;
  }

  const messagesDiv = wrapper.querySelector(".messages-container");
  if (!messagesDiv) {
    console.error("sendPendingMessage: 找不到 .messages-container");
    return;
  }

  // 建立一個 pending 訊息行（靠右）
  const msgRow = document.createElement("div");
  msgRow.className =
    "w-full min-w-0 flex items-end mb-2 justify-end message pending";
  msgRow.dataset.status = "pending";

  // 訊息泡泡
  const bubble = document.createElement("div");
  bubble.className =
    "min-w-0 px-3 py-2 rounded-2xl max-w-[70%] text-sm leading-snug shadow " +
    "break-words break-all whitespace-pre-wrap overflow-hidden " +
    "bg-indigo-300 text-white rounded-br-none opacity-70"; // 淡一點，表示 pending
  bubble.textContent = text ?? "";

  msgRow.appendChild(bubble);

  // 插入到底部
  messagesDiv.appendChild(msgRow);

  // 自動捲到底
  requestAnimationFrame(() => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  return msgRow; // 回傳這個 pending 節點，之後可以刪除或替換
}


export function confirmPendingMessage(msgEl, message_id) {
  if (!msgEl) {
    console.error("confirmPendingMessage: 傳入的訊息 DOM 不存在");
    return;
  }

  // 設定正確的外層屬性
  msgEl.dataset.messageId = message_id;
  msgEl.classList.remove("pending");
  if ("status" in msgEl.dataset) delete msgEl.dataset.status;
  msgEl.className = "w-full min-w-0 flex items-end mb-2 justify-end";

  // 取得/建立 bubble：優先找 data-role="bubble"，否則抓第一個非 tail 的 DIV
  let bubble = msgEl.querySelector('[data-role="bubble"]');
  if (!bubble) {
    bubble = Array.from(msgEl.children).find(
      el => el.tagName === "DIV" && !el.classList.contains("flex-shrink-0")
    );
    if (!bubble) {
      bubble = document.createElement("div");
      msgEl.insertBefore(bubble, msgEl.firstChild);
    }
  }

  // 套用正確的泡泡樣式與屬性
  bubble.setAttribute("data-role", "bubble");
  bubble.className =
    "min-w-0 px-3 py-2 rounded-2xl max-w-[70%] text-sm leading-snug shadow " +
    "break-words break-all whitespace-pre-wrap overflow-hidden " +
    "bg-indigo-500 text-white rounded-br-none";

  // 確保尾巴存在
  let tail = msgEl.querySelector(".flex-shrink-0");
  if (!tail) {
    tail = document.createElement("div");
    tail.className = "flex-shrink-0";
    msgEl.appendChild(tail);
  }

  return msgEl;
}


export function cleanPendingMessages(messagesContainer) {
  if (!messagesContainer) return;

  // 找出所有標記為 pending 的訊息
  const pendingNodes = messagesContainer.querySelectorAll(
    ".pending, [data-status='pending']"
  );

  pendingNodes.forEach(node => node.remove());
}


// 取得聊天室 wrapper（允許傳入 wrapper 本身或其任一子元素）
function resolveChatWrapper(el) {
  if (!el) return null;
  if (el.matches?.('[data-user-id][data-username]')) return el;
  return el.closest?.('[data-user-id][data-username]') || null;
}

// 在指定 wrapper 裡找到對應的 spinner
function findSpinner(wrapper) {
  if (!wrapper) return null;
  const uid = wrapper.dataset.userId || '';
  // 在 wrapper 範圍內找，避免抓到別的聊天室的 spinner
  return wrapper.querySelector(`#chat-spinner-${uid}`);
}

export function showChatSpinner(rootEl) {
  const wrapper = resolveChatWrapper(rootEl);
  if (!wrapper) return;

  const spinner = findSpinner(wrapper);
  if (!spinner) return;

  console.log("ui-controll/renderChatRoom.js: showChatSpinner");
  spinner.classList.remove("hidden");

  // 可選：同步語意狀態
  wrapper.dataset.loadingMessages = "true";
  const messages = wrapper.querySelector(".messages-container");
  if (messages) messages.setAttribute("aria-busy", "true");
}

export function hideChatSpinner(rootEl) {
  const wrapper = resolveChatWrapper(rootEl);
  if (!wrapper) return;

  const spinner = findSpinner(wrapper);
  if (!spinner) return;

  console.log("ui-controll/renderChatRoom.js: hideChatSpinner");
  spinner.classList.add("hidden");

  // 可選：同步語意狀態
  wrapper.dataset.loadingMessages = "false";
  const messages = wrapper.querySelector(".messages-container");
  if (messages) messages.setAttribute("aria-busy", "false");
}

