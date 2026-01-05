import { enrichFriendItemData } from "../service/getFriendsListPageData.js";

/**
 * 建立好友骨架 DOM 元素
 * @param {Object} friend - { friend_id, friend_name }
 * @returns {HTMLElement}
 */
export function createFriendSkeletonElement(friend) {
  const wrapper = document.createElement("div");
  wrapper.className =
    "flex items-center p-3 border-b border-gray-200 hover:bg-gray-50 transition";
  wrapper.dataset.userId = friend.friend_id;

  // 頭貼骨架
  const avatar = document.createElement("div");
  avatar.className = "w-10 h-10 rounded-full bg-gray-300 flex-shrink-0";
  wrapper.appendChild(avatar);

  // 名稱骨架
  const nameSk = document.createElement("div");
  nameSk.className = "ml-3 h-4 bg-gray-200 rounded w-1/3";
  wrapper.appendChild(nameSk);

  return wrapper;
}

/**
 * 建立完整好友 DOM 元素
 * @param {Object} friend - { friend_id, friend_name, profilePicUrl, language }
 * @returns {HTMLElement}
 */
export function createFullFriendElement(friend) {
  if (friend.isBlocked) {
    return createBlockedFriendElement(friend);
  }

  const wrapper = document.createElement("div");
  wrapper.className =
    "relative flex items-center p-3 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer";
  wrapper.dataset.userId = friend.friend_id;

  // 頭貼
  let avatar;
  if (friend.profilePicUrl) {
    avatar = document.createElement("div");
    avatar.className = "w-10 h-10 rounded-full overflow-hidden flex-shrink-0";
    avatar.innerHTML = `<img src="${friend.profilePicUrl}" alt="avatar" class="w-full h-full object-cover"/>`;
  } else {
    avatar = document.createElement("div");
    avatar.className = "w-10 h-10 rounded-full bg-gray-300 flex-shrink-0";
  }
  wrapper.appendChild(avatar);

  // 中間：名稱 + 語言
  const textWrapper = document.createElement("div");
  textWrapper.className = "ml-3 flex-1 overflow-hidden";

  const nameEl = document.createElement("div");
  nameEl.className = "font-medium text-gray-900 truncate";
  nameEl.textContent = friend.friend_name || "Unknown";
  textWrapper.appendChild(nameEl);

  if (friend.language) {
    const langEl = document.createElement("div");
    langEl.className = "text-xs text-gray-500 whitespace-nowrap";
    langEl.textContent = `🌐 ${friend.language.nativelanguage || "-"} → ${friend.language.targetlanguage || "-"}`;
    textWrapper.appendChild(langEl);
  }

  wrapper.appendChild(textWrapper);

  // ✨ 如果未讀，顯示 New 標籤
  if (friend.is_read === false) {
    const newTag = document.createElement("div");
    newTag.className =
      "absolute top-1 right-2 bg-yellow-300 text-yellow-800 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow animate-pulse";
    newTag.textContent = "✨ NEW";
    wrapper.appendChild(newTag);
  }

  wrapper.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "openChatRoom",
      eventParameter: {
        user_id: friend.friend_id,
        from: "friendElement at FriendsPage",
      },
    },
  ]);

  return wrapper;
}

export function createBlockedFriendElement(friend) {
  const wrapper = document.createElement("div");
  wrapper.className =
    "flex items-center p-3 border-b border-gray-200 bg-gray-50 opacity-70 hover:bg-gray-100 transition cursor-pointer";
  wrapper.dataset.userId = friend.friend_id;
  wrapper.dataset.isBlocked = "true";

  // 頭貼
  let avatar;
  if (friend.profilePicUrl) {
    avatar = document.createElement("div");
    avatar.className = "w-10 h-10 rounded-full overflow-hidden flex-shrink-0";
    avatar.innerHTML = `<img src="${friend.profilePicUrl}" alt="avatar" class="w-full h-full object-cover"/>`;
  } else {
    avatar = document.createElement("div");
    avatar.className = "w-10 h-10 rounded-full bg-gray-300 flex-shrink-0";
  }
  wrapper.appendChild(avatar);

  // 中間：名稱 + 語言
  const textWrapper = document.createElement("div");
  textWrapper.className = "ml-3 flex-1 overflow-hidden";

  // 名稱 + Blocked 標籤（同一行）
  const nameRow = document.createElement("div");
  nameRow.className = "flex items-center gap-2 min-w-0";

  const nameEl = document.createElement("span");
  nameEl.className = "font-medium text-gray-900 truncate";
  nameEl.textContent = friend.friend_name || "Unknown";
  nameRow.appendChild(nameEl);

  const blockedTag = document.createElement("span");
  blockedTag.className = "text-xs text-red-600 font-semibold flex-shrink-0";
  blockedTag.textContent = "🚫 Blocked";
  nameRow.appendChild(blockedTag);

  textWrapper.appendChild(nameRow);

  if (friend.language) {
    const langEl = document.createElement("div");
    langEl.className = "text-xs text-gray-500 whitespace-nowrap";
    langEl.textContent = `🌐 ${friend.language.nativelanguage || "-"} → ${friend.language.targetlanguage || "-"}`;
    textWrapper.appendChild(langEl);
  }

  wrapper.appendChild(textWrapper);

  // 右側：Unblock 按鈕
  const rightWrap = document.createElement("div");
  rightWrap.className = "ml-auto flex items-center";

  const unblockBtn = document.createElement("button");
  unblockBtn.textContent = "✅ Unblock";
  unblockBtn.className =
    "px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition";
  unblockBtn.dataset.actionList = JSON.stringify([{
    type: "click",
    action: "openUnblockUserModal", // 注意大小寫保持一致
    eventParameter: {
      target_id: friend.friend_id,
      target_name: friend.friend_name,
      from: "blockedFriendElement"
    }
  }]);

  rightWrap.appendChild(unblockBtn);
  wrapper.appendChild(rightWrap);

  // 👉 讓整個 blocked wrapper 也能開聊天室
  wrapper.dataset.actionList = JSON.stringify([{
    type: "click",
    action: "openChatRoom",
    eventParameter: {
      user_id: friend.friend_id,
      from: "blockedFriendElement"
    }
  }]);

  return wrapper;
}

