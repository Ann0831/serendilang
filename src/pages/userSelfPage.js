// ./pages/userSelfPage.js
import { renderUserSelfPage } from "../ui_controll/renderUserSelfPage.js";
import { renderUserSelfPostCardWithLoading } from "../ui_controll/renderUserSelfPagePostCard.js";
import { getUserSelfAllPosts } from "../service/getUserSelfAllPosts.js";
import { validlanguage } from "/utils/language/validLanguage.js";
import { updateUsername,updateUserLanguage,updateUserProfilePicture,deleteUserProfilePicture } from "../service/uploadUserData.js"; 

// 全域狀態：使用者所有的 post_id
export let userSelfPostIds = [];
let loadedPostsAmount = 0;
let loadingUserSelfPostsLock = false; // lock
let already_initialize=false;
/**
 * 初始化使用者個人頁面
 */

function handleScroll() {
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  const fullHeight = document.documentElement.scrollHeight;

  if (scrollY + vh >= fullHeight - 50) {
    loadMoreUserSelfPosts();
  }
}


export async function userSelfPage_Enter(){
    const dot = document.getElementById("unread-profile-dot");

    if(!already_initialize){
	    initUserSelfPage();

    
    }
    if(dot && !dot.classList.contains("hidden")){
	    dot.classList.add("hidden");
	    

    }

    window.addEventListener("scroll", handleScroll);	

}

export async function userSelfPage_Leave(){
    

    window.removeEventListener("scroll", handleScroll);

}

export async function initUserSelfPage() {
  try {
    // 1. 拿所有貼文 ID
    userSelfPostIds = await getUserSelfAllPosts();
    //console.log("initUserSelfPage: 拿到 userSelfPostIds:", userSelfPostIds);

    // 2. 呼叫 UI 層渲染使用者基本資料
    await renderUserSelfPage();

    // 3. 預設先載入一批貼文
    await loadMoreUserSelfPosts();
    already_initialize=true;
    //console.log("initUserSelfPage: 初始化完成");
  } catch (err) {
    console.error("initUserSelfPage error:", err);
  }
}

export async function reInitUserSelfPosts() {
  if(!already_initialize){
    return;

  }

  try {
    // 1. 重設全域狀態
    userSelfPostIds = [];
    loadedPostsAmount = 0;
    loadingUserSelfPostsLock = false;
    already_initialize = false;

    // 2. 重新抓 postId 列表
    userSelfPostIds = await getUserSelfAllPosts();
    //console.log("reinitUserSelfPosts: 拿到 userSelfPostIds:", userSelfPostIds);

    // 3. 清空貼文容器
    const postsContainer = document.getElementById("userselfpage-posts-container");
    if (postsContainer) {
      postsContainer.innerHTML = "";
    }

    // 4. 顯示 loading
    const spinnerContainer = document.getElementById("userselfpage_loading_spinner_Container");
    if (spinnerContainer) {
      spinnerContainer.classList.remove("hidden");
    }

    // 5. 載入第一批貼文
    await loadMoreUserSelfPosts();
    already_initialize = true;

    // 6. 隱藏 loading
    if (spinnerContainer) {
      spinnerContainer.classList.add("hidden");
    }

    //console.log("reInitUserSelfPosts: 貼文重新初始化完成");
  } catch (err) {
    console.error("reInitUserSelfPosts error:", err);

    // 發生錯誤時也隱藏 spinner
    const spinnerContainer = document.getElementById("userselfpage_loading_spinner_Container");
    if (spinnerContainer) {
      spinnerContainer.classList.add("hidden");
    }
  }
}



/**
 * 載入更多使用者的貼文 (含 lock 機制)
 * @param {number} batchSize - 每次載入幾篇，預設 5
 */
export async function loadMoreUserSelfPosts(batchSize = 5) {
  console.log("loadMoreUserSelfPosts");
  console.log("🧩 typeof userSelfPostIds:", typeof userSelfPostIds);
  console.log("🧩 userSelfPostIds:", userSelfPostIds);
  if (loadingUserSelfPostsLock) {
    console.log("⚠️ 正在載入中，請稍候");
    return;
  }
  console.log("🧩 typeof userSelfPostIds:", typeof userSelfPostIds);
  console.log("🧩 userSelfPostIds:", userSelfPostIds);
  try {
    if (!Array.isArray(userSelfPostIds) || userSelfPostIds.length === 0) {
      console.warn("⚠️ 尚無可載入的貼文");
      return;
    }

    if (loadedPostsAmount >= userSelfPostIds.length) {
      console.log("✅ 所有貼文已載入完畢");
      return;
    }

    loadingUserSelfPostsLock = true; // 🔒 加鎖

    const remaining = userSelfPostIds.length - loadedPostsAmount;
    const count = Math.min(batchSize, remaining);

    const postsToLoad = userSelfPostIds.slice(
      loadedPostsAmount,
      loadedPostsAmount + count
    );

    for (const postId of postsToLoad) {
      renderUserSelfPostCardWithLoading(postId);
    }

    loadedPostsAmount += count;
    console.log(
      `loadMoreUserSelfPosts: 已載入 ${loadedPostsAmount}/${userSelfPostIds.length} 篇`
    );
  } catch (err) {
    console.error("loadMoreUserSelfPosts error:", err);
  } finally {
    loadingUserSelfPostsLock = false; // 🔓 解鎖
  }
}



export function openEditLanguageModal(currentNative = "", currentTarget = "") {
  // 背景遮罩
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";

  // Modal 容器
  const modal = document.createElement("div");
  modal.className =
    "bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4";
  overlay.appendChild(modal);

  // 標題
  const title = document.createElement("h2");
  title.textContent = "Edit language";
  title.className = "text-lg font-semibold";
  modal.appendChild(title);

  

  // 取得語言清單
  const { languages } = validlanguage();

  // 目標語言群組
  const targetGroup = document.createElement("div");
  const targetSelect = document.createElement("select");
  targetSelect.id = "edit-targetlanguage";
  targetSelect.className = "w-full border rounded px-2 py-1";

  languages.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang.lowercase;
    option.textContent = lang.name;
    if (lang.lowercase === currentTarget) option.selected = true; // 預設選中
    targetSelect.appendChild(option);
  });

  targetGroup.innerHTML = `<label class="block text-sm font-medium mb-1">Target Language</label>`;
  targetGroup.appendChild(targetSelect);
 

  // 母語語言群組
  const nativeGroup = document.createElement("div");
  const nativeSelect = document.createElement("select");
  nativeSelect.id = "edit-nativelanguage";
  nativeSelect.className = "w-full border rounded px-2 py-1";

  languages.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang.lowercase;
    option.textContent = lang.name;
    if (lang.lowercase === currentNative) option.selected = true; // 預設選中
    nativeSelect.appendChild(option);
  });

  nativeGroup.innerHTML = `<label class="block text-sm font-medium mb-1">Native Language</label>`;
  nativeGroup.appendChild(nativeSelect);
  
  modal.appendChild(nativeGroup);
  modal.appendChild(targetGroup);
  // 按鈕區
  const btnRow = document.createElement("div");
  btnRow.className = "flex justify-end gap-2 mt-4";
  modal.appendChild(btnRow);

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className =
    "px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition";
  cancelBtn.dataset.actionList = JSON.stringify([
    { action: "closeEditLanguageModal", type: "click", eventParameter: {} }
  ]);
  btnRow.appendChild(cancelBtn);

  // 提交按鈕
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit";
  submitBtn.className =
    "px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition";
  submitBtn.dataset.actionList=JSON.stringify([
    { action: "submitEditLanguageModal", type: "click", eventParameter: {} }
  ]);

  btnRow.appendChild(submitBtn);


  // 插入頁面
  document.body.appendChild(overlay);
}


// 關閉表單 (modal)
export function closeEditLanguageModal() {
  const overlay = document.querySelector(".fixed.inset-0.bg-black.bg-opacity-40");
  if (overlay) {
    overlay.remove();
  }
}




export async function submitEditLanguageModal() {
  const overlay = document.querySelector(".fixed.inset-0.bg-black.bg-opacity-40");
  if (!overlay) return;

  const modal = overlay.querySelector("div");
  if (!modal) return;

  // 抓取值
  const target = document.getElementById("edit-targetlanguage")?.value;
  const native = document.getElementById("edit-nativelanguage")?.value;

  // 清空並顯示 loading
  modal.innerHTML = `
    <div class="flex flex-col items-center justify-center space-y-2 p-6">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-opacity-75"></div>
      <p class="text-gray-600">Submitting...</p>
    </div>
  `;

  try {
    modal.innerHTML = "Submitting...";
    const success = await updateUserLanguage(target, native);
   
    modal.innerHTML = "";
    

    if (success&&success.result==="success") {
      // 成功訊息
      
      const msg = document.createElement("p");
      msg.textContent = "Language updated successfully!";
      msg.className = "text-center text-green-600 text-lg font-semibold";
      modal.appendChild(msg);

      const doneBtn = document.createElement("button");
      doneBtn.textContent = "Done";
      doneBtn.className =
        "mt-4 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition block mx-auto";
      doneBtn.dataset.actionList = JSON.stringify([
        { action: "closeEditLanguageModal", type: "click", eventParameter: {} }
      ]);
      renderUserSelfPage();

  
      modal.appendChild(doneBtn);
    } else {
      // 失敗訊息
      const msg = document.createElement("p");
      msg.textContent = "Submission failed, please try again later";
      msg.className = "text-center text-red-600 text-lg font-semibold";
      modal.appendChild(msg);

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Close";
      closeBtn.className =
        "mt-4 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition block mx-auto";
      closeBtn.dataset.actionList = JSON.stringify([
      { action: "closeEditLanguageModal", type: "click", eventParameter: {} }
      ]);
      modal.appendChild(closeBtn);
    }
  } catch (err) {
    console.error("submitEditLanguageModal error:", err);
    modal.innerHTML = `
      <p class="text-center text-red-600 text-lg font-semibold">An error occurred, please try again later</p>
      <button class="mt-4 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition block mx-auto">
        Close
      </button>
    `;
    modal.querySelector("button").addEventListener("click", () => overlay.remove());
  }
}





export function openEditAvatarModal() {
  // 背景遮罩
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";

  // Modal 容器
  const modal = document.createElement("div");
  modal.className =
    "bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4";
  overlay.appendChild(modal);

  // 標題
  const title = document.createElement("h2");
  title.textContent = "Update profile picture";
  title.className = "text-lg font-semibold";
  modal.appendChild(title);

  // 上傳區塊
  const avatarGroup = document.createElement("div");
  avatarGroup.innerHTML = `
    <label class="block text-sm font-medium mb-2">Choose a new profile picture</label>
    <label class="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-100 transition border border-indigo-200 font-medium w-fit">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" class="w-5 h-5" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15"></path>
      </svg>
      <span>Upload image</span>
      <input type="file" id="edit-avatar-file" accept="image/*" class="hidden">
    </label>
  `;
  modal.appendChild(avatarGroup);

  // 預覽區
  const preview = document.createElement("img");
  preview.id = "edit-avatar-preview";
  preview.className =
    "w-24 h-24 rounded-full object-cover border border-gray-300 mt-3 hidden";
  avatarGroup.appendChild(preview);

  // 綁定預覽事件
  avatarGroup.querySelector("#edit-avatar-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.classList.remove("hidden");
    } else {
      preview.src = "";
      preview.classList.add("hidden");
    }
  });

  // 上層按鈕區（Cancel / Submit）
  const btnRow = document.createElement("div");
  btnRow.className = "flex justify-between items-center gap-2 mt-4";
  modal.appendChild(btnRow);

  // Cancel 按鈕
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className =
    "px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition";
  cancelBtn.dataset.actionList = JSON.stringify([
    { action: "closeEditAvatarModal", type: "click", eventParameter: {} }
  ]);
  btnRow.appendChild(cancelBtn);

  // Submit 按鈕
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit";
  submitBtn.className =
    "px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition";
  submitBtn.dataset.actionList = JSON.stringify([
    { action: "submitEditAvatarModal", type: "click", eventParameter: {} }
  ]);
  btnRow.appendChild(submitBtn);

  // 分隔線
  const divider = document.createElement("hr");
  divider.className = "my-3 border-gray-200";
  modal.appendChild(divider);

  // 🟥 刪除按鈕（獨立放底部，語意更強）
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete the current existing profile picture";
  deleteBtn.className =
    "px-4 py-2 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition font-medium";
  deleteBtn.dataset.actionList = JSON.stringify([
    { action: "submitDeleteAvatarModal", type: "click", eventParameter: {} }
  ]);
  modal.appendChild(deleteBtn);

  // 插入頁面
  document.body.appendChild(overlay);
}



export async function submitEditAvatarModal() {
  const overlay = document.querySelector(".fixed.inset-0.bg-black.bg-opacity-40");
  if (!overlay) return;

  const modal = overlay.querySelector("div");
  if (!modal) return;

  // 抓取檔案
  const file = document.getElementById("edit-avatar-file")?.files?.[0];
  if (!file) {
    alert("Please select an image.");
    return;
  }

  // 清空並顯示 loading
  modal.innerHTML = `
    <div class="flex flex-col items-center justify-center space-y-2 p-6">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600 border-opacity-75"></div>
      <p class="text-gray-600">Uploading...</p>
    </div>
  `;

  try {
    const res = await updateUserProfilePicture(file);

    // 清空 modal
    modal.innerHTML = "";

    if (res.result === "success") {
      // 成功訊息
      const msg = document.createElement("p");
      msg.textContent = "Profile picture updated successfully!";
      msg.className = "text-center text-green-600 text-lg font-semibold";
      modal.appendChild(msg);

      const doneBtn = document.createElement("button");
      doneBtn.textContent = "Done";
      doneBtn.className =
        "mt-4 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition block mx-auto";
      doneBtn.dataset.actionList = JSON.stringify([
        { action: "closeEditAvatarModal", type: "click", eventParameter: {} }
      ]);
      renderUserSelfPage(); // 更新頁面 (依照你語言的流程仿造)

      modal.appendChild(doneBtn);
    } else {
      // 失敗訊息
      const msg = document.createElement("p");
      msg.textContent = "Profile picture update failed, please try again later";
      msg.className = "text-center text-red-600 text-lg font-semibold";
      modal.appendChild(msg);

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Close";
      closeBtn.className =
        "mt-4 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition block mx-auto";
      closeBtn.dataset.actionList = JSON.stringify([
        { action: "closeEditAvatarModal", type: "click", eventParameter: {} }
      ]);
      modal.appendChild(closeBtn);
    }
  } catch (err) {
    console.error("submitEditAvatarModal error:", err);
    modal.innerHTML = `
      <p class="text-center text-red-600 text-lg font-semibold">An error occurred, please try again later</p>
      <button class="mt-4 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition block mx-auto">
        Close
      </button>
    `;
    modal.querySelector("button").addEventListener("click", () => overlay.remove());
  }
}


export async function submitDeleteAvatarModal() {
  const overlay = document.querySelector(".fixed.inset-0.bg-black.bg-opacity-40");
  if (!overlay) return;

  const modal = overlay.querySelector("div");
  if (!modal) return;

  // 清空並顯示 loading
  modal.innerHTML = `
    <div class="flex flex-col items-center justify-center space-y-2 p-6">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600 border-opacity-75"></div>
      <p class="text-gray-600">Deleting...</p>
    </div>
  `;

  try {
    const res = await deleteUserProfilePicture();

    // 清空 modal
    modal.innerHTML = "";

    if (res.result === "success") {
      // ✅ 成功訊息
      const msg = document.createElement("p");
      msg.textContent = "Profile picture deleted successfully!";
      msg.className = "text-center text-green-600 text-lg font-semibold";
      modal.appendChild(msg);

      const doneBtn = document.createElement("button");
      doneBtn.textContent = "Done";
      doneBtn.className =
        "mt-4 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition block mx-auto";
      doneBtn.dataset.actionList = JSON.stringify([
        { action: "closeEditAvatarModal", type: "click", eventParameter: {} }
      ]);

      renderUserSelfPage(); // 🔄 更新使用者頁面
      modal.appendChild(doneBtn);
    } else {
      // ❌ 失敗訊息
      const msg = document.createElement("p");
      msg.textContent = "Profile picture deletion failed, please try again later";
      msg.className = "text-center text-red-600 text-lg font-semibold";
      modal.appendChild(msg);

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Close";
      closeBtn.className =
        "mt-4 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition block mx-auto";
      closeBtn.dataset.actionList = JSON.stringify([
        { action: "closeEditAvatarModal", type: "click", eventParameter: {} }
      ]);
      modal.appendChild(closeBtn);
    }
  } catch (err) {
    console.error("submitDeleteAvatarModal error:", err);
    modal.innerHTML = `
      <p class="text-center text-red-600 text-lg font-semibold">An error occurred while deleting, please try again later</p>
      <button class="mt-4 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition block mx-auto">
        Close
      </button>
    `;
    modal.querySelector("button").addEventListener("click", () => overlay.remove());
  }
}

/**
 * 🔄 重新整理使用者自己的貼文（僅在 UI 已初始化的情況下執行）
 */


export function closeEditAvatarModal() {
  const overlay = document.querySelector(
    ".fixed.inset-0.bg-black.bg-opacity-40.z-50"
  );
  if (overlay) {
    overlay.remove();
  }
}

/** 開啟「更名」Modal */
export function openEditUsernameModal(currentUsername = "") {
  // 背景遮罩
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";

  // Modal 容器
  const modal = document.createElement("div");
  modal.className =
    "bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4";
  overlay.appendChild(modal);

  // 標題
  const title = document.createElement("h2");
  title.textContent = "Edit username";
  title.className = "text-lg font-semibold";
  modal.appendChild(title);

  // 使用者名稱輸入框
  const inputGroup = document.createElement("div");
  inputGroup.innerHTML = `<label class="block text-sm font-medium mb-1">Username</label>`;
  const input = document.createElement("input");
  input.id = "edit-username";
  input.type = "text";
  input.value = currentUsername;
  input.className = "w-full border rounded px-2 py-1";
  input.placeholder = "Enter your new username";
  inputGroup.appendChild(input);
  modal.appendChild(inputGroup);

  // 按鈕區
  const btnRow = document.createElement("div");
  btnRow.className = "flex justify-end gap-2 mt-4";
  modal.appendChild(btnRow);

  // Cancel 按鈕
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className =
    "px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition";
  cancelBtn.dataset.actionList = JSON.stringify([
    { action: "closeEditUsernameModal", type: "click", eventParameter: {} }
  ]);
  btnRow.appendChild(cancelBtn);

  // Submit 按鈕
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit";
  submitBtn.className =
    "px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition";
  submitBtn.dataset.actionList = JSON.stringify([
    { action: "submitEditUsernameModal", type: "click", eventParameter: {} }
  ]);
  btnRow.appendChild(submitBtn);

  // 插入頁面
  document.body.appendChild(overlay);
}

/** 關閉「更名」Modal */
export function closeEditUsernameModal() {
  const overlay = document.querySelector(".fixed.inset-0.bg-black.bg-opacity-40");
  if (overlay) overlay.remove();
}

/** 提交「更名」Modal */
export async function submitEditUsernameModal() {
  const overlay = document.querySelector(".fixed.inset-0.bg-black.bg-opacity-40");
  if (!overlay) return;

  const modal = overlay.querySelector("div");
  if (!modal) return;

  const username = document.getElementById("edit-username")?.value?.trim();
  if (!username) {
    alert("Username cannot be empty.");
    return;
  }

  // 清空並顯示 loading
  modal.innerHTML = `
    <div class="flex flex-col items-center justify-center space-y-2 p-6">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-opacity-75"></div>
      <p class="text-gray-600">Submitting...</p>
    </div>
  `;

  try {
    const res = await updateUsername(username); // 🧩 呼叫 service
    modal.innerHTML = "";

    if (res && res.result === "success") {
      // ✅ 成功訊息
      const msg = document.createElement("p");
      msg.textContent = res.message || "Username updated successfully!";
      msg.className = "text-center text-green-600 text-lg font-semibold";
      modal.appendChild(msg);

      const doneBtn = document.createElement("button");
      doneBtn.textContent = "Done";
      doneBtn.className =
        "mt-4 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition block mx-auto";
      doneBtn.dataset.actionList = JSON.stringify([
        { action: "closeEditUsernameModal", type: "click", eventParameter: {} }
      ]);

      renderUserSelfPage(); // ✅ 重新載入使用者頁面
      modal.appendChild(doneBtn);

    } else {
      // ❌ 失敗訊息
      const msg = document.createElement("p");
      msg.textContent = "Error: " + ((res && res.message) || "Submission failed, please try again later.");

      msg.className = "text-center text-red-600 text-lg font-semibold";
      modal.appendChild(msg);

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Close";
      closeBtn.className =
        "mt-4 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition block mx-auto";
      closeBtn.dataset.actionList = JSON.stringify([
        { action: "closeEditUsernameModal", type: "click", eventParameter: {} }
      ]);
      modal.appendChild(closeBtn);
    }
  } catch (err) {
    console.error("submitEditUsernameModal error:", err);
    modal.innerHTML = `
      <p class="text-center text-red-600 text-lg font-semibold">
        ${err?.message || "An unexpected error occurred, please try again later."}
      </p>
      <button class="mt-4 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition block mx-auto">
        Close
      </button>
    `;
    modal.querySelector("button").addEventListener("click", () => overlay.remove());
  }


}


