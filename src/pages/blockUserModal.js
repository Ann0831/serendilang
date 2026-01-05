import { blockUserService } from "/service/blockUserService.js";
import { eventBus } from "/utils/eventBus.js";

export function openBlockUserModal(target_id, target_name) {
  // Prevent multiple openings
  if (document.getElementById("blockUser-modal-overlay")) return;

  // Background overlay
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";
  overlay.id = "blockUser-modal-overlay";
  overlay.dataset.userId = target_id;
  overlay.dataset.username = target_name;

  // Modal container
  const modal = document.createElement("div");
  modal.className =
    "bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4";
  overlay.appendChild(modal);

  // Title
  const title = document.createElement("h2");
  title.textContent = "Block User";
  title.className = "text-lg font-semibold text-red-600";
  modal.appendChild(title);

  // Message
  const message = document.createElement("p");
  message.textContent = `Are you sure you want to block ${target_name}?`;
  message.className = "text-sm text-gray-700";
  modal.appendChild(message);

  // Button row
  const btnRow = document.createElement("div");
  btnRow.className = "flex justify-end gap-2";

  const cancelBtn = document.createElement("button");
  cancelBtn.className =
    "px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition";
  cancelBtn.textContent = "Cancel";
  cancelBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "closeBlockUserModal",
      eventParameter: { target_id, target_name, from: "blockUserModal" },
    },
  ]);

  const submitBtn = document.createElement("button");
  submitBtn.className =
    "px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition";
  submitBtn.textContent = "Confirm Block";
  submitBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "submitBlockUserModal",
      eventParameter: { target_id, target_name, from: "blockUserModal" },
    },
  ]);

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(submitBtn);
  modal.appendChild(btnRow);

  document.body.appendChild(overlay);
}

export function closeBlockUserModal() {
  const overlay = document.getElementById("blockUser-modal-overlay");
  if (overlay) overlay.remove();
}

export async function submitBlockUserModal() {
  const overlay = document.getElementById("blockUser-modal-overlay");
  const target_id = overlay?.dataset.userId ?? null;
  const target_name = overlay?.dataset.username ?? "Unknown";

  if (!target_id) return;

  const modal = overlay.querySelector("div"); // modal container
  if (!modal) return;

  // Clear modal content and show spinner
  modal.innerHTML = `
    <div id="block-user-status" class="flex flex-col items-center justify-center p-6">
      <span class="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></span>
      <p class="mt-4 text-gray-600">Blocking...</p>
    </div>
  `;

  const statusBox = document.getElementById("block-user-status");

  try {
    // 🔹 Call service to block user
    const res = await blockUserService(target_id);
    if (!res || res.result !== "success") {
      throw new Error("Block failed");
    }

    // 🔹 Success message
    statusBox.innerHTML = `<p class="text-green-600 text-lg font-medium">Blocked successfully ✅</p>`;

    // 🔹 Notify UI updates
    eventBus.emit("reloadMessagesPage", { from: "BlockUserModal" });
    eventBus.emit("reloadFriendsListPage", { from: "BlockUserModal" });
    eventBus.emit("reloadBlockedUsersListModal", { from: "BlockUserModal" });
    eventBus.emit("reloadChatRoom", { from: "BlockUserModal", target_id: target_id });

    // Close modal after short delay
    setTimeout(() => {
      closeBlockUserModal();
    }, 800);

  } catch (err) {
    console.error("Block failed:", err);

    // 🔹 Failure message
    statusBox.innerHTML = `<p class="text-red-600 text-lg font-medium">Block failed ❌</p>`;

    setTimeout(() => {
      closeBlockUserModal();
    }, 800);
  }
}

