// UnBlockUserModal.js

import { unBlockUserService } from "/service/blockUserService.js";
import { eventBus } from "/utils/eventBus.js";

export function openUnblockUserModal(target_id, target_name) {
  if (document.getElementById("unBlockUser-modal-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";
  overlay.id = "unBlockUser-modal-overlay";
  overlay.dataset.userId = target_id;
  overlay.dataset.username = target_name;

  const modal = document.createElement("div");
  modal.className =
    "bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4";
  overlay.appendChild(modal);

  const title = document.createElement("h2");
  title.textContent = "Unblock User";
  title.className = "text-lg font-semibold text-green-600";
  modal.appendChild(title);

  const message = document.createElement("p");
  message.textContent = `Are you sure you want to unblock ${target_name}?`;
  message.className = "text-sm text-gray-700";
  modal.appendChild(message);

  const btnRow = document.createElement("div");
  btnRow.className = "flex justify-end gap-2";

  const cancelBtn = document.createElement("button");
  cancelBtn.className =
    "px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition";
  cancelBtn.textContent = "Cancel";
  cancelBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "closeUnblockUserModal",
      eventParameter: { target_id, target_name, from: "unBlockUserModal" },
    },
  ]);

  const submitBtn = document.createElement("button");
  submitBtn.className =
    "px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition";
  submitBtn.textContent = "Confirm Unblock";
  submitBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "submitUnblockUserModal",
      eventParameter: { target_id, target_name, from: "unBlockUserModal" },
    },
  ]);

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(submitBtn);
  modal.appendChild(btnRow);

  document.body.appendChild(overlay);
}

export function closeUnblockUserModal() {
  const overlay = document.getElementById("unBlockUser-modal-overlay");
  if (overlay) overlay.remove();
}

export async function submitUnblockUserModal() {
  const overlay = document.getElementById("unBlockUser-modal-overlay");
  const target_id = overlay?.dataset.userId ?? null;
  const target_name = overlay?.dataset.username ?? "Unknown";

  if (!target_id) return;

  const modal = overlay.querySelector("div");
  if (!modal) return;

  modal.innerHTML = `
    <div id="unblock-user-status" class="flex flex-col items-center justify-center p-6">
      <span class="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></span>
      <p class="mt-4 text-gray-600">Unblocking...</p>
    </div>
  `;

  const statusBox = document.getElementById("unblock-user-status");

  try {
    console.log("/pages/UnblockUserModal.js: submitUnblockUserModal: target_id: ", target_id);
    const res = await unBlockUserService(target_id);
    if (!res || res.result !== "success") {
      throw new Error("Unblock failed");
    }

    statusBox.innerHTML = `<p class="text-green-600 text-lg font-medium">Unblocked successfully ✅</p>`;
    eventBus.emit("reloadMessagesPage", { from: "UnblockUserModal" });
    eventBus.emit("reloadFriendsListPage", { from: "UnblockUserModal" });
    eventBus.emit("reloadBlockedUsersListModal", { from: "UnblockUserModal" });
    eventBus.emit("reloadChatRoom", { from: "BlockUserModal", target_id: target_id });

    setTimeout(() => {
      closeUnblockUserModal();
    }, 800);

  } catch (err) {
    console.error("Unblock failed:", err);
    statusBox.innerHTML = `<p class="text-red-600 text-lg font-medium">Unblock failed ❌</p>`;

    setTimeout(() => {
      closeUnblockUserModal();
    }, 800);
  }
}

