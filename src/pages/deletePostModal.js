import {uploadPostData}from "/service/uploadPostData.js";
import {eventBus} from "/utils/eventBus.js";
export function openDeletePostModal(postId) {
  // 避免重複開啟
  if (document.getElementById("delete-post-modal-overlay")) return;

  // 背景遮罩
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";
  overlay.id = "delete-post-modal-overlay";
  overlay.dataset.postId = postId;

  // Modal 容器
  const modal = document.createElement("div");
  modal.className =
    "bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4";
  overlay.appendChild(modal);

  // 標題
  const title = document.createElement("h2");
  title.textContent = "Delete Post";
  title.className = "text-lg font-semibold text-red-600";
  modal.appendChild(title);

  // 提示文字
  const message = document.createElement("p");
  message.textContent = "Are you sure you want to delete this post? This action cannot be undone.";
  message.className = "text-gray-700";
  modal.appendChild(message);

  // 🔹 動態訊息區
  const feedback = document.createElement("div");
  feedback.id = "delete-post-feedback";
  feedback.className = "hidden text-sm font-medium text-center";
  modal.appendChild(feedback);

  // 按鈕列
  const btnRow = document.createElement("div");
  btnRow.className = "flex justify-end gap-2";

  // 取消按鈕
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className =
    "px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition";
  cancelBtn.dataset.actionList = JSON.stringify([
    { type: "click", action: "closeDeletePostModal", eventParameter: {} }
  ]);

  // 確定刪除按鈕
  const confirmBtn = document.createElement("button");
  confirmBtn.id = "delete-post-confirm-btn";
  confirmBtn.className =
    "px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center gap-2";
  confirmBtn.dataset.actionList = JSON.stringify([
    { type: "click", action: "confirmDeletePost", eventParameter: { post_id: postId } }
  ]);

  // Spinner (預設隱藏)
  const spinner = document.createElement("span");
  spinner.id = "delete-post-spinner";
  spinner.className =
    "hidden w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin";
  confirmBtn.appendChild(spinner);

  // 按鈕文字
  const btnText = document.createElement("span");
  btnText.id = "delete-post-btn-text";
  btnText.textContent = "Confirm deletion";
  confirmBtn.appendChild(btnText);

  // 插入到 btnRow
  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(confirmBtn);

  // 再把 btnRow 加到 modal
  modal.appendChild(btnRow);

  document.body.appendChild(overlay);
}

export function closeDeletePostModal() {
  const overlay = document.getElementById("delete-post-modal-overlay");
  if (overlay) overlay.remove();
}

export async function confirmDeletePost() {
  const overlay = document.getElementById("delete-post-modal-overlay");
  const postId = overlay?.dataset.postId ?? null;
  if (!postId) return;

  const modal = overlay.querySelector("div"); // modal 容器
  if (!modal) return;

  // 清空 modal 內容，準備顯示 spinner
  modal.innerHTML = `
    <div id="delete-post-status" class="flex flex-col items-center justify-center p-6">
      <span class="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></span>
      <p class="mt-4 text-gray-600">Deleting...</p>
    </div>
  `;

  const statusBox = document.getElementById("delete-post-status");
  const statusText = statusBox.querySelector("p");

  try {
    // 🔹 向伺服器請求刪除
    const res = await uploadPostData.deletePost(postId);
    if (res.result !== "success") {
      throw new Error("Deletion failed");
    }

    // 🔹 成功訊息
    statusBox.innerHTML = `<p class="text-green-600 text-lg font-medium">Deleted successfully ✅</p>`;

    // 2 秒後自動關閉 modal
    eventBus.emit("reInitUserSelfPosts",{});
    setTimeout(() => {
      closeDeletePostModal();
    }, 800);

  } catch (err) {
    console.error("刪除失敗:", err);

    // 🔹 失敗訊息
    statusBox.innerHTML = `<p class="text-red-600 text-lg font-medium">Deletion failed. ❌</p>`;

    // 3 秒後自動關閉 modal
    setTimeout(() => {
      closeDeletePostModal();
    }, 800);
  }
}

