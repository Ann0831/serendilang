import {sendReportUserService} from "/service/reportService.js";

export function openReportUserModal(target_id, target_name) {
  // 避免重複開啟
  if (document.getElementById("reportUser-modal-overlay")) return;

  // 背景遮罩
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";
  overlay.id = "reportUser-modal-overlay";
  overlay.dataset.userId = target_id; // 被檢舉的使用者 ID
  overlay.dataset.username = target_name; // 被檢舉的使用者名稱

  // Modal 容器
  const modal = document.createElement("div");
  modal.className =
    "bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4";
  overlay.appendChild(modal);

  // 標題
  const title = document.createElement("h2");
  title.textContent = "Report User";

  title.className = "text-lg font-semibold";
  modal.appendChild(title);

  // 被檢舉對象顯示
  const targetLabel = document.createElement("p");
  targetLabel.textContent = `Reporting: ${target_name}`;

  targetLabel.className = "text-sm text-gray-700";
  modal.appendChild(targetLabel);

  // 下拉理由選單
  const select = document.createElement("select");
  select.className =
    "w-full border rounded p-2 focus:outline-none focus:ring focus:border-indigo-400";
  select.id = "reportUser-modal-reason";

  const reasons = [
    { value: "spam", label: "Spam / Advertising" },
    { value: "abuse", label: "Abusive / Harassment" },
    { value: "inappropriate", label: "Inappropriate Content" },
    { value: "fake", label: "Fake Account / Impersonation" },
    { value: "other", label: "Other" },
  ];

  reasons.forEach(r => {
    const option = document.createElement("option");
    option.value = r.value;
    option.textContent = r.label;
    select.appendChild(option);
  });

  modal.appendChild(select);

  // 其他原因輸入框（只有選「其他」才顯示）
  const otherInput = document.createElement("input");
  otherInput.placeholder = "Please enter a reason...";
  otherInput.type = "text";
  otherInput.className =
    "w-full border rounded p-2 hidden focus:outline-none focus:ring focus:border-indigo-400";
  otherInput.id = "reportUser-modal-other";
  modal.appendChild(otherInput);

  select.addEventListener("change", () => {
    if (select.value === "other") {
      otherInput.classList.remove("hidden");
    } else {
      otherInput.classList.add("hidden");
    }
  });

  // 按鈕列
  const btnRow = document.createElement("div");
  btnRow.className = "flex justify-end gap-2";

  const cancelBtn = document.createElement("button");
  cancelBtn.className =
    "px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition";
  cancelBtn.textContent = "Cancel";
  cancelBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "closeReportUserModal",
      eventParameter: { target_id, target_name, from: "reportUserModal" },
    },
  ]);

  const submitBtn = document.createElement("button");
  submitBtn.className =
    "px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition";
  submitBtn.textContent = "Submit";
  submitBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "submitReportUserModal",
      eventParameter: { target_id, target_name, from: "reportUserModal" },
    },
  ]);

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(submitBtn);
  modal.appendChild(btnRow);

  document.body.appendChild(overlay);
}

export function closeReportUserModal() {
  const overlay = document.getElementById("reportUser-modal-overlay");
  if (overlay) overlay.remove();
}


export async function submitReportUserModal() {
  const overlay = document.getElementById("reportUser-modal-overlay");
  const select = document.getElementById("reportUser-modal-reason");
  const otherInput = document.getElementById("reportUser-modal-other");

  const target_id = overlay?.dataset.userId ?? null;
  const target_name = overlay?.dataset.username ?? "Unknown";

  let reason = select?.value ?? "";
  if (reason === "other") {
    reason = otherInput?.value.trim() ?? "";
  }

  if (!target_id || !reason) {
    console.warn("submitReportUserModal: target_id or reason is invalid");
    return;
  }

  const modal = overlay.querySelector("div"); // modal container
  if (!modal) return;

  // 🔄 Reset modal to spinner
  modal.innerHTML = `
    <div id="report-user-status" class="flex flex-col items-center justify-center p-6">
      <span class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
      <p class="mt-4 text-gray-600">Submitting report...</p>
    </div>
  `;

  // ❗ 必須重新抓元素，因為 innerHTML 重設後舊的元素消失了
  const statusBox = modal.querySelector("#report-user-status");

  try {
    // 🔹 send report
    const res = await sendReportUserService(target_id, reason);

    if (!res || res.result !== "success") {
      throw new Error("Report failed");
    }

    // 🔹 Success UI
    if (statusBox) {
      statusBox.innerHTML = `
        <p class="text-green-600 text-lg font-medium">
          Report submitted successfully ✅
        </p>
      `;
    }

    setTimeout(() => {
      closeReportUserModal();
    }, 800);

  } catch (err) {
    console.error("Report failed:", err);

    // 🔹 Error UI
    if (statusBox) {
      statusBox.innerHTML = `
        <p class="text-red-600 text-lg font-medium">
          Report failed ❌
        </p>
      `;
    }

    setTimeout(() => {
      closeReportUserModal();
    }, 800);
  }
}

