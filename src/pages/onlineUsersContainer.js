import { fetchOnlineUserData } from "../service/fetchOnlineUserData.js";
import {diffOps} from "../utils/diffOps.js";
import {calcOnlineUserScore} from "../utils/calcOnlineUserScore.js"
import {eventBus} from "/utils/eventBus.js";
import {isJsonEqual} from "/utils/checkEqual.js";
import { CoolDownScheduler } from "/utils/Scheduler.js";
import {getCurrentUserLanguage_Global,getCurrentUserIdentity_Global,getCurrentUserBlockList_Global} from "/user_identity/user_identity.js";
import { fetchRealtimeOnlineList } from "/service/realTimeService.js"; 
const syncState = { running: false, nextList: null };
export const sortOnlineUserScheduler = new CoolDownScheduler(sortOnlineUsersByLanguage);


export async function scheduleWriteAndSyncOnlineUsers() {
  const container = document.getElementById("onlineUsersContainer");
  const pageContainer = document.getElementById("onlineUsersPageContainer");
  if (!container) {
    console.error("scheduleWriteAndSyncOnlineUsers: container 不存在");
    return [];
  }

  try {
    // ✅ 向後端取最新線上清單（已在API層過濾封鎖名單）
    

    
    const data = await fetchRealtimeOnlineList(); // 否則才 fetch
    console.log("✅  取得最新線上清單:", data);
    

    if (Array.isArray(data)) {
        for (const item of data) {
            const userId = item?.user_id;
            const lang = item?.language;

            if (!userId || !lang){ 
		    continue;
	    }
	    if (!container.detailUserInfo){
		container.detailUserInfo={};
            }
            // 若不存在 detailUserInfo[userId]，自動初始化
            if (!container.detailUserInfo[userId]) {
                container.detailUserInfo[userId] = {};
            }

            container.detailUserInfo[userId].nativelanguage =
                lang.nativelanguage || null;

            container.detailUserInfo[userId].targetlanguage =
                lang.targetlanguage || null;
        }
    }  

    
    const list = Array.isArray(data) ? data : [];

    // 取得目前使用者語言（包 try/catch）
    let myNative = null;
    let myTarget = null;

    try {
        const myLanguage = await getCurrentUserLanguage_Global();
        console.log("sortOnlineUsersByLanguage: myLanguage ", myLanguage);

        myNative = myLanguage?.nativelanguage || null;
        myTarget = myLanguage?.targetlanguage || null;
    } catch (err) {
        console.warn("[sortOnlineUsersByLanguage] 取得語言失敗，使用空語言 fallback:", err);
        myNative = null;
        myTarget = null;
    }

    // 依照語言排序線上使用者
    const sortedList = [...list].sort((a, b) => {
        return (
            calcOnlineUserScore(b, container.detailUserInfo, myNative, myTarget) -
            calcOnlineUserScore(a, container.detailUserInfo, myNative, myTarget)
        );
    });    

    const selfIdentity = await getCurrentUserIdentity_Global();
    const selfId = selfIdentity?.user_id;
    const blockList = await getCurrentUserBlockList_Global();

    // 再次客端過濾（雙重保險）
    const filteredList = sortedList.filter(
      (u) => u.user_id !== selfId && !blockList.includes(u.user_id)
    );

    // 覆蓋成最新清單
    syncState.nextList = filteredList;
    console.log(
      "/pages/onlineUsersContainer.js: scheduleWriteAndSyncOnlineUsers: syncState.nextList=",
      syncState.nextList
    );

    // 若已經有 runner 在跑，就交由 while loop 自行處理
    if (syncState.running) return filteredList;

    syncState.running = true;
    try {
      while (syncState.nextList) {
        const currentList = syncState.nextList;
        syncState.nextList = null;

        writeAndSyncOnlineUsers(container, currentList);
        writeAndSyncOnlineUsers(pageContainer, currentList);

        // 如果在執行期間又被觸發，syncState.nextList 會被覆蓋，
        // 下一輪 while loop 再處理
      }
    } finally {
      syncState.running = false;
    }

    // ✅ 無論如何最後回傳「過濾後」的名單
    return filteredList;

  } catch (err) {
    console.error("scheduleWriteAndSyncOnlineUsers error:", err);
    return []; // 發生錯誤時回傳空陣列
  }
}

/** 寫入新的線上使用者清單並同步 UI */
export function writeAndSyncOnlineUsers(container, list) {
  console.log("writeAndSyncOnlineUsers: list= ",list);

  if (!container) {
    console.error("writeAndSyncOnlineUsers: container 不存在");
    return list;
  }
  if (!Array.isArray(list)) {
    console.error("writeAndSyncOnlineUsers: 輸入必須是陣列");
    return;
  }

  // 寫入新的 onlineUsersList
  container._onlineUsersList = list.map((u) => ({
    userId: u.user_id || u.userId,
    username: u.username,
  }));
  console.log("writeAndSyncOnlineUsers: container._onlineUsersList= ",container._onlineUsersList);
  // 呼叫同步 UI
  syncOnlineUsers(container);
}


export function syncOnlineUsers(container) {
  if (!container) {
    console.error("syncOnlineUsers: container 不存在");
    return;
  }
  if (!Array.isArray(container._onlineUsersList)) {
    console.error("syncOnlineUsers: container._onlineUsersList 尚未初始化");
    return;
  }

  const domIds = Array.from(container.children).map(el => el.dataset.userId);
  const targetIds = container._onlineUsersList.map(u => u.userId);

  const ops = diffOps(domIds, targetIds);
  const infoById = new Map(container._onlineUsersList.map(u => [u.userId, u]));

  for (const op of ops) {
    if (op.type === "keep") {
      const user = infoById.get(op.value);
      if (!user) continue;
      const el = findChildById(container, op.value);
      if (!el) continue;

      // 更新名稱顯示
      const nameSpan = el.querySelector(".username");
      if (nameSpan && nameSpan.textContent !== (user.username ?? "")) {
        nameSpan.textContent = user.username ?? "";
      }

      // 如果 detailUserInfo 有完整資料，補齊
      const detail = container.detailUserInfo?.[user.userId];
      if (detail && !detail.isSkeleton) {
        updateOnlineUserDetail(container, user.userId, detail);
      }
      continue;
    }

    if (op.type === "delete") {
      const el = findChildByIndex(container, op.index)||findChildById(container, op.value);
      if (el){ 
	      console.log("syncOnlineUsers: container.removeChild(el): ",el);
	      container.removeChild(el);
      }
      continue;
    }

    if (op.type === "insert") {
      const user = infoById.get(op.value);
      if (!user) continue;

      // 直接用 addOnlineUser，保持一致性
      addOnlineUser(container,user.userId, user.username, op.index);
      continue;
    }
  }

  // === 小工具 ===
  function findChildById(container, id) {
    const children = container.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const el = children[i];
      if (el.dataset.userId === id) return el;
    }
    return null;
  }

  function findChildByIndex(container, idx) {
    const children = container.children;
    if (typeof idx !== "number") return null;
    if (idx < 0 || idx >= children.length) return null;
    return children[idx];
  }


}





// 建立骨架 + 嘗試補充詳細資訊
export async function addOnlineUser(container,userId, username, index) {
  console.log("/pages/onlineUsersContainer/js: addOnlineUserL (userId, username, index): ",userId, username, index);
  
  if(!container){
	  console.error("OnlineUsersContainer: no container");
	  return ;

  };
  // Step1: 建立骨架
  const userDiv = addOnlineUserSkeleton(container, userId, username, index);
  userDiv.dataset.actionList = JSON.stringify([{
    type: "click",
    action: "openChatRoom",
    eventParameter: {
      user_id: userId,
      from: "OnlineUsersContaienr"
    }
  }]);
  

  // Step3: 沒有詳細資料 → 下載
  try {
    const detail = await fetchOnlineUserData(userId);
    if (detail) {
      if (!container.detailUserInfo) container.detailUserInfo = {};
      container.detailUserInfo[userId] = { ...detail, isSkeleton: false };

      await updateOnlineUserDetail(container, userId, detail);
      //eventBus.emit("sortOnlineUsers",{});
    }
  } catch (err) {
    console.error("下載使用者資料失敗", err);
  }

  return userDiv;
}

function addOnlineUserSkeleton(container, userId, username, index) {
  const userDiv = document.createElement("div");
  userDiv.className =
    "online-user flex items-center space-x-2 border border-gray-300 rounded-md p-2 hover:bg-gray-100 transition cursor-pointer";
  userDiv.dataset.userId = userId;

  // 綠點點
  const greenDot = document.createElement("span");
  greenDot.className = "w-3 h-3 bg-green-500 rounded-full";
  userDiv.appendChild(greenDot);

  // 包裹名稱和語言的容器
  const nameLangWrapper = document.createElement("div");
  nameLangWrapper.className = "flex flex-col";

  const nameSpan = document.createElement("span");
  nameSpan.textContent = username || "Loading...";
  nameSpan.className = "username";
  nameLangWrapper.appendChild(nameSpan);

  // 語言先留空，之後 updateOnlineUserDetail 再補
  userDiv.appendChild(nameLangWrapper);

  // 插在 index 位置（若超出範圍就 append）
  if (typeof index === "number" && index >= 0 && index < container.children.length) {
    container.insertBefore(userDiv, container.children[index]);
    console.log("addOnlineUserSkeleton: insertBefore: ",container.children[index]);
  } else {
    console.log("addOnlineUserSkeleton: appendChild: ",userDiv);
    container.appendChild(userDiv);
  }

  // 更新 container.onlineUsers
  if (!Array.isArray(container.onlineUsers)) container.onlineUsers = [];
  container.onlineUsers.splice(index ?? container.onlineUsers.length, 0, { userId, username });

  // 確保 container.detailUserInfo 有個空位
  if (!container.detailUserInfo) container.detailUserInfo = {};
  if (!container.detailUserInfo[userId]) {
    container.detailUserInfo[userId] = { userId, username, isSkeleton: true };
  }

  return userDiv;
}

function updateOnlineUserDetail(container, userId, detail) {
  const userDiv = container.querySelector(`.online-user[data-user-id="${userId}"]`);
  if (!userDiv) return;
  let toSort=false;
  

  // 更新 detailUserInfo
  if (!container.detailUserInfo) container.detailUserInfo = {};

  


  container.detailUserInfo[userId] = {
    ...(container.detailUserInfo[userId] || {}),
    ...detail,
    isSkeleton: false
  };

  
  
  const info = container.detailUserInfo[userId];
  console.log("/pages/onlineUsersContainer.js: info: ", info);

  // 頭像（插在 greenDot 後面）
  if (info.profilePicture) {
    let img = userDiv.querySelector("img");
    if (!img) {
      img = document.createElement("img");
      img.className = "w-8 h-8 rounded-full object-cover";
      userDiv.insertBefore(img, userDiv.children[1]); // 綠點後面
    }
    img.src = info.profilePicture;
  }

  // 找名稱+語言容器
  let nameLangWrapper = userDiv.querySelector(".flex.flex-col");
  if (!nameLangWrapper) {
    nameLangWrapper = document.createElement("div");
    nameLangWrapper.className = "flex flex-col";
    userDiv.appendChild(nameLangWrapper);
  }

  // 語言資訊
  if (info.nativelanguage || info.targetlanguage) {
    let langSpan = nameLangWrapper.querySelector(".languages");
    if (!langSpan) {
      langSpan = document.createElement("span");
      langSpan.className = "languages text-xs text-gray-500 mt-0.5"; // 加點間距
      nameLangWrapper.appendChild(langSpan);
    }
    const native = info.nativelanguage ? `🌐 ${info.nativelanguage}` : "";
    const target = info.targetlanguage ? `→ ${info.targetlanguage}` : "";
    langSpan.textContent = [native, target].filter(Boolean).join(" ");
  }
}


export async function sortOnlineUsersByLanguage() {
  return;
}
