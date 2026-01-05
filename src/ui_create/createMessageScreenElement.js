
import { enrichMessageScreenItemData } from "../service/getMessagesScreenData.js";

/**
 * 創建對話骨架 DOM 元素
 * @param {Object} conv - 一筆 getAllMessagesScreen() 的對話物件
 * @returns {HTMLElement} - 可插入 DOM 的元素
 */
export function createMessageScreenSkeletonElement(conv) {
  const wrapper = document.createElement("div");
  wrapper.className =
    "flex items-center p-3 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer";
  wrapper.dataset.userId = conv.other_user.user_id; // 方便後續更新

  // 頭貼（骨架狀態: 灰色圓圈）
  const avatar = document.createElement("div");
  avatar.className = "w-10 h-10 rounded-full bg-gray-300 flex-shrink-0";
  wrapper.appendChild(avatar);

  // 中間：名稱 + 最後訊息
  const textWrapper = document.createElement("div");
  textWrapper.className = "ml-3 flex-1 overflow-hidden";

  const nameEl = document.createElement("div");
  nameEl.className = "font-medium text-gray-900 truncate";
  nameEl.textContent = conv.other_user.username;
  textWrapper.appendChild(nameEl);

  // 最後訊息
  const msgEl = document.createElement("div");

  // 判斷是否「對方傳來 & 未讀」
  if (conv.sender_id === conv.other_user.user_id && conv.is_read !== 1) {
    msgEl.className = "text-sm font-semibold text-gray-900 truncate"; // 未讀訊息 → 粗體黑字
  } else {
    msgEl.className = "text-sm text-gray-500 truncate"; // 其他 → 一般灰字
  }
  msgEl.textContent = conv.messageText;
  textWrapper.appendChild(msgEl);

  wrapper.appendChild(textWrapper);

  // 右邊：時間
  const timeEl = document.createElement("div");
  timeEl.className = "text-xs text-gray-400 ml-2 whitespace-nowrap";
  timeEl.textContent = formatTimestamp(conv.timestamp);
  wrapper.appendChild(timeEl);



  wrapper.dataset.actionList = JSON.stringify([{
    type: "click",
    action: "openChatRoom",
    eventParameter: {
      user_id: conv.other_user.user_id,
      from: "friendElement at FriendsPage"
    }
  }]);

  return wrapper;
}

export function createFullMessageScreenElement(conv) {
  console.log("./ui_create/createMessageScreenElement.js createFullMessageScreenElement : conv: ", conv);
  if (conv.isBlocked) {
    return createBlockedMessageScreenElement(conv);
  }
  const wrapper = document.createElement("div");
  wrapper.className =
    "flex items-center p-3 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer";
  wrapper.dataset.userId = conv.other_user.user_id;

  // 頭貼
  let avatar;
  if (conv.profilePicUrl) {
    avatar = document.createElement("div");
    avatar.className = "w-10 h-10 rounded-full overflow-hidden flex-shrink-0";
    avatar.innerHTML = `<img src="${conv.profilePicUrl}" alt="avatar" class="w-full h-full object-cover"/>`;
  } else {
    avatar = document.createElement("div");
    avatar.className = "w-10 h-10 rounded-full bg-gray-300 flex-shrink-0";
  }
  wrapper.appendChild(avatar);

  // 中間：名稱 + 語言 + 最後訊息
  const textWrapper = document.createElement("div");
  textWrapper.className = "ml-3 flex-1 overflow-hidden";

  // 名稱 + 語言（貼在一起）
  const headerRow = document.createElement("div");
  headerRow.className = "flex items-center space-x-2"; // 名稱和語言之間留一點間距

  const nameEl = document.createElement("div");
  nameEl.className = "font-medium text-gray-900 truncate";
  nameEl.textContent = conv.other_user.username;
  headerRow.appendChild(nameEl);

  if (conv.language) {
    const langEl = document.createElement("div");
    langEl.className = "text-xs text-gray-500 whitespace-nowrap";
    langEl.textContent = `🌐 ${conv.language.nativelanguage || "-"} → ${conv.language.targetlanguage || "-"}`;
    headerRow.appendChild(langEl);
  }

  textWrapper.appendChild(headerRow);

  // 最後訊息
  // 最後訊息
  const msgEl = document.createElement("div");
  if (conv.sender_id === conv.other_user.user_id && conv.is_read !== 1) {
    msgEl.className = "text-sm font-semibold text-gray-900 truncate"; // 未讀訊息 → 粗體黑字
  } else {
    msgEl.className = "text-sm text-gray-500 truncate";
  }

  if (conv.sender_id !== conv.other_user.user_id) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("fill", "none");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("stroke-width", "1.5");
    svg.setAttribute("stroke", "currentColor");
    svg.classList.add("inline-block", "w-4", "h-4", "text-gray-400", "mr-1", "relative", "-top-px");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("d", "m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3");
    svg.appendChild(path);

    msgEl.appendChild(svg);

    const textNode = document.createTextNode(conv.messageText);
    msgEl.appendChild(textNode);
  } else {
    msgEl.innerText = conv.messageText;
  }

  textWrapper.appendChild(msgEl);

  wrapper.appendChild(textWrapper);

  // 右邊：時間
  const timeEl = document.createElement("div");
  timeEl.className = "text-xs text-gray-400 ml-2 whitespace-nowrap";
  timeEl.textContent = formatTimestamp(conv.timestamp);


  wrapper.appendChild(timeEl);

  wrapper.dataset.actionList = JSON.stringify([{
    type: "click",
    action: "openChatRoom",
    eventParameter: {
      user_id: conv.other_user.user_id,
      from: "friendElement at FriendsPage"
    }
  }]);


  return wrapper;
}


export function createBlockedMessageScreenElement(conv) {
  const wrapper = document.createElement("div");
  wrapper.className =
    "flex items-center p-3 border-b border-gray-200 bg-gray-50 opacity-70 hover:bg-gray-100 transition cursor-pointer";
  wrapper.dataset.userId = conv.other_user.user_id;
  wrapper.dataset.isBlocked = "true";

  // 頭貼
  let avatar;
  if (conv.profilePicUrl) {
    avatar = document.createElement("div");
    avatar.className = "w-10 h-10 rounded-full overflow-hidden flex-shrink-0";
    avatar.innerHTML = `<img src="${conv.profilePicUrl}" alt="avatar" class="w-full h-full object-cover"/>`;
  } else {
    avatar = document.createElement("div");
    avatar.className = "w-10 h-10 rounded-full bg-gray-300 flex-shrink-0";
  }
  wrapper.appendChild(avatar);

  // 中間：名稱 + 語言 + 🚫Blocked
  const textWrapper = document.createElement("div");
  textWrapper.className = "ml-3 flex-1 overflow-hidden";

  // 名稱 + 語言
  const headerRow = document.createElement("div");
  headerRow.className = "flex items-center space-x-2";

  const nameEl = document.createElement("div");
  nameEl.className = "font-medium text-gray-900 truncate";
  nameEl.textContent = conv.other_user.username;
  headerRow.appendChild(nameEl);

  if (conv.language) {
    const langEl = document.createElement("div");
    langEl.className = "text-xs text-gray-500 whitespace-nowrap";
    langEl.textContent = `🌐 ${conv.language.nativelanguage || "-"} → ${conv.language.targetlanguage || "-"}`;
    headerRow.appendChild(langEl);
  }

  textWrapper.appendChild(headerRow);

  // 🚫 Blocked 取代訊息
  const blockedEl = document.createElement("div");
  blockedEl.className = "text-sm text-red-600 font-semibold truncate";
  blockedEl.textContent = "🚫 Blocked";
  textWrapper.appendChild(blockedEl);

  wrapper.appendChild(textWrapper);

  // 右邊：時間
  const timeEl = document.createElement("div");
  timeEl.className = "text-xs text-gray-400 ml-2 whitespace-nowrap";
  timeEl.textContent = formatTimestamp(conv.timestamp);
  wrapper.appendChild(timeEl);

  // ✅ 點擊還是能開聊天室
  wrapper.dataset.actionList = JSON.stringify([{
    type: "click",
    action: "openChatRoom",
    eventParameter: {
      user_id: conv.other_user.user_id,
      from: "blockedMessageScreenItem"
    }
  }]);

  return wrapper;
}



/**
 * 格式化時間（簡單版，可再優化）
 * @param {string} ts - ISO 字串
 */
function formatTimestamp(ts) {
  if (!ts) return "";
  try {
    const date = new Date(ts);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  } catch {
    return "";
  }
}

