import { reportPostService } from "../service/reportService.js";

export function openReportPostModal(postId) {
  // 避免重複開啟
  if (document.getElementById("reportPost-modal-overlay")) return;

  // 背景遮罩
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";
  overlay.id = "reportPost-modal-overlay";
  overlay.dataset.postId = postId; // 保留被檢舉的 postId

  // Modal 容器
  const modal = document.createElement("div");
  modal.className =
    "bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4";
  overlay.appendChild(modal);

  // 標題
  const title = document.createElement("h2");
  title.textContent = "Report Post";
  title.className = "text-lg font-semibold";
  modal.appendChild(title);

  // 下拉選單標籤
  const label = document.createElement("label");
  label.textContent = "Please select a reason";
  label.className = "text-sm font-medium text-gray-700";
  modal.appendChild(label);

  // 下拉選單
  const select = document.createElement("select");
  select.id = "reportPost-modal-reason";
  select.className =
    "w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-indigo-400";

  const reasons = [
    { value: "", text: "Please choose a reason" },
    { value: "spam", text: "Spam / Advertising" },
    { value: "harassment", text: "Harassment or Bullying" },
    { value: "hate", text: "Hate or Discriminatory Speech" },
    { value: "violence", text: "Violence or Gore" },
    { value: "other", text: "Other" }
  ];

  reasons.forEach(r => {
    const option = document.createElement("option");
    option.value = r.value;
    option.textContent = r.text;
    select.appendChild(option);
  });

  modal.appendChild(select);

  // 按鈕列
  const btnRow = document.createElement("div");
  btnRow.className = "flex justify-end gap-2";

  // 取消按鈕
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className =
    "px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition";
  cancelBtn.dataset.actionList = JSON.stringify([
    { type: "click", action: "closeReportPostModal", eventParameter: {} }
  ]);

  // 送出按鈕
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit";
  submitBtn.className =
    "px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition";
  submitBtn.dataset.actionList = JSON.stringify([
    { type: "click", action: "submitReportPostModal", eventParameter: {} }
  ]);

  // 插入到 btnRow
  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(submitBtn);

  // 加到 modal
  modal.appendChild(btnRow);

  document.body.appendChild(overlay);
}



export function closeReportPostModal() {
  const overlay = document.getElementById("reportPost-modal-overlay");
  if (overlay) overlay.remove();
}


export async function submitReportPostModal() {
  const overlay = document.getElementById("reportPost-modal-overlay");
  const select = document.getElementById("reportPost-modal-reason");
  const reason = select?.value ?? "";
  const postId = overlay?.dataset.postId ?? null;

  if (!postId || !reason) {
    console.warn("submitReportPostModal: invalid postId or reason.");
    return;
  }

  // 找到 modal 本體
  const modal = overlay.querySelector("div");
  if (!modal) return;

  // 清空 modal 內容，顯示 loading 狀態
  modal.innerHTML = `
    <div class="flex flex-col items-center justify-center gap-4 py-6">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      <p class="text-gray-600 text-sm">Submitting report...</p>
    </div>
  `;

  // 呼叫 service
  const res = await reportPostService(postId, reason);

  // 清空 modal，顯示結果
  modal.innerHTML = "";

  const resultBox = document.createElement("div");
  resultBox.className = "flex flex-col items-center justify-center gap-4 py-6";

  const message = document.createElement("p");
  message.className = "text-lg font-semibold";

  if (res?.result === "success") {
    message.textContent = "Report submitted successfully!";
    message.classList.add("text-green-600");
  } else {
    message.textContent = "Report failed. Please try again later.";
    message.classList.add("text-red-600");
  }

  const okBtn = document.createElement("button");
  okBtn.textContent = "OK";
  okBtn.className =
    "px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition";
  okBtn.dataset.actionList = JSON.stringify([
    { type: "click", action: "closeReportPostModal" }
  ]);

  resultBox.appendChild(message);
  resultBox.appendChild(okBtn);

  modal.appendChild(resultBox);
}

