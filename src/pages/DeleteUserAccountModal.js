// DeleteUserAccountModal.js

import { deleteAccountService } from "/service/deleteAccountService.js";

export function openDeleteUserAccountModal() {
  // 避免重複開啟
  if (document.getElementById("deleteUserAccount-modal-overlay")) return;

  // 背景遮罩
  const overlay = document.createElement("div");
  overlay.id = "deleteUserAccount-modal-overlay";
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";

  // Modal 容器
  const modal = document.createElement("div");
  modal.className =
    "bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4";
  overlay.appendChild(modal);

  // 標題
  const title = document.createElement("h2");
  title.textContent = "Delete Account";
  title.className = "text-lg font-semibold text-red-600";
  modal.appendChild(title);

  // 警告文字
  const warning = document.createElement("p");
  warning.textContent =
    "Are you sure you want to delete your account? This action cannot be undone.";
  warning.className = "text-sm text-gray-700";
  modal.appendChild(warning);

  // 狀態區域（顯示 loading / success / fail）
  const statusEl = document.createElement("div");
  statusEl.id = "deleteUserAccount-status";
  statusEl.className = "text-sm text-center text-gray-600 hidden";
  modal.appendChild(statusEl);

  // 按鈕列
  const btnRow = document.createElement("div");
  btnRow.className = "flex justify-end gap-2";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className =
    "px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition";
  cancelBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "closeDeleteUserAccountModal",
      eventParameter: {},
    },
  ]);

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Delete";
  confirmBtn.id = "deleteUserAccount-confirm-btn";
  confirmBtn.className =
    "px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition";
  confirmBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "submitDeleteUserAccountModal",
      eventParameter: {},
    },
  ]);

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(confirmBtn);
  modal.appendChild(btnRow);

  document.body.appendChild(overlay);
}

export function closeDeleteUserAccountModal() {
  const overlay = document.getElementById("deleteUserAccount-modal-overlay");
  if (overlay) overlay.remove();
}

export async function submitDeleteUserAccountModal() {
  console.log("⚠️ Delete Account confirmed");

  const statusEl = document.getElementById("deleteUserAccount-status");
  const confirmBtn = document.getElementById("deleteUserAccount-confirm-btn");

  // 顯示 loading
  if (statusEl) {
    statusEl.textContent = "⏳ Deleting...";
    statusEl.className = "text-sm text-center text-gray-600";
    statusEl.classList.remove("hidden");
  }
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  // 呼叫 service
  const result = await deleteAccountService();

  if (result.success) {
    if (statusEl) {
      statusEl.textContent = "✅ Account deleted successfully!";
      statusEl.className = "text-sm text-center text-green-600";
    }
    setTimeout(() => {
      location.reload();
    }, 1000);
  } else {
    if (statusEl) {
      statusEl.textContent = "❌ Failed to delete account. Please try again.";
      statusEl.className = "text-sm text-center text-red-600";
    }
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }
}

