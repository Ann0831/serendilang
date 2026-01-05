import { renderChatRoom } from "../ui_controll/renderChatRoom.js";
import { scheduleLoadMore } from "../ui_controll/renderChatRoom.js";
import {getCurrentUserBlockList_Global} from "/user_identity/user_identity.js";

const MAX_CHATROOMS = 2;

// 統一 id 形態，避免 "123" 與 123 導致的 includes/filter 問題
const toKey = (id) => String(id);

// 全域狀態（都存字串化後的 userId）
let activeChatRooms = []; // 正在顯示的聊天室 userId 陣列 (FIFO)
let hiddenChatRooms = []; // 被隱藏的聊天室 userId 陣列 (queue)


// ---- 全域區域變數 ----
const chatRoomLocks = new Map(); // userId -> Promise or boolean

/**
 * 初始化聊天室容器
 */
export function initChatRoomsContainer() {
  let container = document.getElementById("chatRoomsContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "chatRoomsContainer";
    container.className =
      "fixed bottom-4 right-4 flex flex-row items-end space-x-2 z-50";
    document.body.appendChild(container);
  }
  return container;
}

/** 取得或建立 DOM：若不存在才 render，一律回傳元素 */
async function ensureChatDom(container, id) {
  let el = container.querySelector(`[data-user-id="${id}"]`);
  if (!el) {
    const userBlockList=await getCurrentUserBlockList_Global();
    if (userBlockList.includes(id)) {
      await renderChatRoom(container, id,{"isBlocked":true});
    }else{
      await renderChatRoom(container, id,{"isBlocked":false});
    }
    el = container.querySelector(`[data-user-id="${id}"]`);
  }
  return el;
}

/**
 * 開啟一個聊天室
 * @param {string|number} userId - 對方使用者 ID
 */
export async function openChatRoom(userId) {
  const id = toKey(userId);
  const container = initChatRoomsContainer();

  // 🔒 若已在開啟中，直接返回同一個 promise，避免重複開啟
  if (chatRoomLocks.has(id)) {
    console.log(`⏳ openChatRoom(${id}) already in progress`);
    return chatRoomLocks.get(id);
  }

  // 🔧 建立鎖定 promise
  let resolver;
  const lockPromise = new Promise((resolve) => (resolver = resolve));
  chatRoomLocks.set(id, lockPromise);

  try {
    console.log("/pages/chatRoomContainer.js openChatRoom: id:", id);

    if (activeChatRooms.includes(id)) {
      activeChatRooms = activeChatRooms.filter((x) => x !== id);
      activeChatRooms.push(id);

      const el = await ensureChatDom(container, id);
      el.classList.remove("hidden");
      reorderChatRooms(container);

      resolver(container);
      return container;
    }

    if (hiddenChatRooms.includes(id)) {
      hiddenChatRooms = hiddenChatRooms.filter((x) => x !== id);
      activeChatRooms.push(id);

      if (activeChatRooms.length > MAX_CHATROOMS) {
        const oldestId = activeChatRooms.shift();
        await hideChatRoom(oldestId);
      }

      const el = await ensureChatDom(container, id);
      el.classList.remove("hidden");
      reorderChatRooms(container);

      resolver(container);
      return container;
    }

    // 🆕 新聊天室
    if (activeChatRooms.length >= MAX_CHATROOMS) {
      const oldestId = activeChatRooms.shift();
      await hideChatRoom(oldestId);
    }

    activeChatRooms.push(id);
    const el = await ensureChatDom(container, id);
    el.classList.remove("hidden");
    reorderChatRooms(container);

    resolver(container);
    return container;

  } catch (err) {
    console.error("openChatRoom error:", err);
    resolver(null);
    throw err;
  } finally {
    // 🧹 解鎖
    chatRoomLocks.delete(id);
  }
}

/**
 * 重新排列聊天室 DOM (根據 activeChatRooms 順序)
 */
function reorderChatRooms(container) {
  const els = activeChatRooms.map((id) =>
    container.querySelector(`[data-user-id="${id}"]`)
  );
  els.forEach((el) => {
    if (el) {
      el.classList.remove("hidden");
      container.appendChild(el);
    }
  });
}

/**
 * 隱藏一個聊天室（不移除 DOM，不清事件）
 * @param {string|number} userId
 */
export async function hideChatRoom(userId) {
  const id = toKey(userId);
  const container = initChatRoomsContainer();

  // 從 active 移除，放進 hidden（避免重複）
  activeChatRooms = activeChatRooms.filter((x) => x !== id);
  if (!hiddenChatRooms.includes(id)) {
    hiddenChatRooms.push(id);
  }

  const el = container.querySelector(`[data-user-id="${id}"]`);
  if (el) el.classList.add("hidden");

  //console.log(`🙈 ChatRoom(${id}) 被隱藏`);
}

/**
 * 關閉一個聊天室（移除 DOM 與狀態）
 * @param {string|number} userId
 */
export async function closeChatRoom(userId) {
  const id = toKey(userId);
  const container = initChatRoomsContainer();
  const chatEl = container.querySelector(`[data-user-id="${id}"]`);

  if (chatEl) {
    chatEl.remove();
  }
  // 從兩個列表拿掉
  activeChatRooms = activeChatRooms.filter((x) => x !== id);
  hiddenChatRooms = hiddenChatRooms.filter((x) => x !== id);

  //console.log(`❌ ChatRoom(${id}) 已關閉`);

  // 若還有 hidden → 依序補進 active（用 await 避免 race）
  while (hiddenChatRooms.length > 0 && activeChatRooms.length < MAX_CHATROOMS) {
    const nextId = hiddenChatRooms.shift();
    await openChatRoom(nextId);
  }
}

/**
 * 關閉所有聊天室
 */
export function closeAllChatRooms() {
  const container = initChatRoomsContainer();
  const allEls = container.querySelectorAll("[data-user-id]");
  // 維持你原本「加 hidden 不移除」的語意，避免一次關掉丟失狀態
  allEls.forEach((el) => el.classList.add("hidden"));
  activeChatRooms = [];
  hiddenChatRooms = [];
  //console.log("❌ 已關閉所有聊天室 (hidden 處理)");
}

export function checkChatRoomStatus(userId) {
  const id = toKey(userId);

  if (activeChatRooms.includes(id)) {
    return "active";
  }
  if (hiddenChatRooms.includes(id)) {
    return "hidden";
  }
  return "none";
}


export async function handleLoadMoreMessages(wrapper,extraParams) {
  try {
    scheduleLoadMore(wrapper.dataset.userId,wrapper,extraParams);
  } catch (err) {
    //console.error("❌ 載入訊息失敗:", err);
  }
}
