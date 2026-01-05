


export function createPotentialFriendCardSkeleton(targetUserData) {
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

  // 使用者名稱（直接顯示文字，不用骨架）
  const name = document.createElement("h2");
  name.textContent = targetUserData?.username || "Loading...";
  name.className = "text-lg font-semibold mt-4 text-gray-700";

  // 語言資訊骨架
  const languageSkeleton = document.createElement("div");
  languageSkeleton.className = "h-4 w-40 bg-gray-200 rounded mt-2";

  // 按鈕骨架
  const buttonSkeleton = document.createElement("div");
  buttonSkeleton.className = "h-10 w-28 bg-gray-300 rounded-xl my-6";
  buttonSkeleton.dataset.actionList=JSON.stringify([{"type":"click","action":"sendFriendRequest","eventParameter":{"target_id":targetUserData?.user_id}}]);


  // 塞進卡片
  card.appendChild(avatarSkeleton);
  card.appendChild(name);
  card.appendChild(languageSkeleton);
  card.appendChild(buttonSkeleton);

  return card;
}



export function createPotentialFriendCard(targetUserData) {
  console.log("createPotentialFriendCard: ", targetUserData);

  // 建立卡片 wrapper
  const card = document.createElement("div");
  card.className = `
    inline-block
    bg-white rounded-2xl shadow p-6
    m-4 snap-center
    flex flex-col items-center justify-between
    border border-gray-200
  `;

  // 頭像
  const avatarWrapper = document.createElement("div");
  avatarWrapper.className = "w-24 h-24 rounded-full overflow-hidden mt-6 ring-2 ring-indigo-500";

  const avatarImg = document.createElement("img");
  avatarImg.src = targetUserData.profilePicUrl || "/assets/.svg";
  avatarImg.alt = `${targetUserData.username || "Unknown"} avatar`;
  avatarImg.className = "w-full h-full object-cover";

  avatarWrapper.appendChild(avatarImg);

  // 名字
  const name = document.createElement("h2");
  name.textContent = targetUserData.username || "Unknown";
  name.className = "text-lg font-semibold mt-4 cursor-pointer";
  name.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "openUserPage",
      eventParameter: { author_id: targetUserData?.user_id },
    },
  ]);

  // 語言資訊
  const languages = document.createElement("div");
  languages.className = "text-sm text-gray-500";
  languages.textContent = `Native: ${targetUserData.nativelanguage || "?"} → Target: ${targetUserData.targetlanguage || "?"}`;

  // 加好友按鈕
  const button = document.createElement("button");
  button.textContent = "Add Friend";
  button.className = `
    my-6 px-4 py-2 rounded-xl
    bg-indigo-600 text-white font-medium
    hover:bg-indigo-700 transition
  `;
  button.dataset.actionList=JSON.stringify([{"type":"click","action":"sendFriendRequest","eventParameter":{"target_id":targetUserData?.user_id}}]);

  // 塞進卡片
  card.appendChild(avatarWrapper);
  card.appendChild(name);
  card.appendChild(languages);
  card.appendChild(button);

  return card;
}

