// ./ui_create/createFriendRequestCard.js

/**
 * FriendRequest 卡片骨架 (Skeleton)
 */
export function createFriendRequestCardSkeleton(requestUserData) {
  const card = document.createElement("div");
  card.className = `
    inline-block
    bg-white rounded-2xl shadow
    m-4 snap-center
    flex flex-col items-center justify-between
    border border-gray-200
    animate-pulse
  `;

  // 頭像骨架
  const avatarSkeleton = document.createElement("div");
  avatarSkeleton.className = "w-24 h-24 rounded-full bg-gray-300 mt-6";

  // 使用者名稱（改成 sender_name）
  const name = document.createElement("h2");
  name.textContent = requestUserData?.sender_name || "Loading...";
  name.className = "text-lg font-semibold mt-4 text-gray-700";

  // 語言資訊骨架
  const languageSkeleton = document.createElement("div");
  languageSkeleton.className = "h-4 w-40 bg-gray-200 rounded mt-2";

  // 按鈕骨架
  const buttonRow = document.createElement("div");
  buttonRow.className = "flex gap-4 my-6";
  const acceptBtnSkeleton = document.createElement("div");
  acceptBtnSkeleton.className = "h-10 w-20 bg-gray-300 rounded-xl";
  const rejectBtnSkeleton = document.createElement("div");
  rejectBtnSkeleton.className = "h-10 w-20 bg-gray-300 rounded-xl";
  buttonRow.appendChild(acceptBtnSkeleton);
  buttonRow.appendChild(rejectBtnSkeleton);

  // 組合
  card.appendChild(avatarSkeleton);
  card.appendChild(name);
  card.appendChild(languageSkeleton);
  card.appendChild(buttonRow);

  return card;
}

/**
 * FriendRequest 卡片 (真實資料)
 */
export function createFriendRequestCard(requestUserData) {
  console.log("createFriendRequestCard: ", requestUserData);

  // 建立卡片 wrapper
  const card = document.createElement("div");
  card.className = `
    relative inline-block p-6
    bg-white rounded-2xl shadow
    m-4 snap-center
    flex flex-col items-center justify-between
    border border-gray-200
  `;

  // 頭像
  const avatarWrapper = document.createElement("div");
  avatarWrapper.className = "w-24 h-24 rounded-full overflow-hidden mt-6 ring-2 ring-indigo-500";

  const avatarImg = document.createElement("img");
  avatarImg.src = requestUserData.profilePicUrl || "default.jpg";
  avatarImg.alt = `${requestUserData.sender_name || "Unknown"} avatar`;
  avatarImg.className = "w-full h-full object-cover";
  avatarWrapper.appendChild(avatarImg);

  // 名字
  const name = document.createElement("h2");
  name.textContent = requestUserData.sender_name || "Unknown";
  name.className = "text-lg font-semibold mt-4 cursor-pointer";
  name.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "openUserPage",
      eventParameter: { author_id: requestUserData.sender_id },
    },
  ]);

  // 語言資訊
  const languages = document.createElement("div");
  languages.className = "text-sm text-gray-500";
  languages.textContent = `Native: ${requestUserData.language?.nativelanguage || "?"} → Target: ${requestUserData.language?.targetlanguage || "?"}`;

  // 按鈕列
  const buttonRow = document.createElement("div");
  buttonRow.className = "flex gap-4 my-6";

  // 接受按鈕
  const acceptBtn = document.createElement("button");
  acceptBtn.textContent = "Accept";
  acceptBtn.className = `
    px-4 py-2 rounded-xl
    bg-green-600 text-white font-medium
    hover:bg-green-700 transition
  `;
  acceptBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "acceptFriendRequest",
      eventParameter: { target_id: requestUserData.sender_id },
    },
  ]);

  buttonRow.appendChild(acceptBtn);

  // ✨ 如果未讀，顯示 New 標籤
  if (requestUserData.is_read === false) {
    const newTag = document.createElement("div");
    newTag.className =
      "absolute top-2 right-3 bg-yellow-300 text-yellow-800 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow animate-pulse";
    newTag.textContent = "✨ NEW";
    card.appendChild(newTag);
  }

  // 組合
  card.appendChild(avatarWrapper);
  card.appendChild(name);
  card.appendChild(languages);
  card.appendChild(buttonRow);

  return card;
}


