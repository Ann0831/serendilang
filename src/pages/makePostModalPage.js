// makePostModalPage.js

import{uploadPostData} from "../service/uploadPostData.js";

export function makePostModalPage() {
  // 背景遮罩
  const overlay = document.createElement("div");
  overlay.className =
    "post-modal-overlay fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";
  
  // Modal 容器
  const modal = document.createElement("div");
  modal.className = "bg-white rounded-2xl shadow-lg p-6 flex flex-col space-y-4";
  modal.style.width = "60vw";
  modal.style.height = "70vh";

  overlay.appendChild(modal);

  // 標題
  const title = document.createElement("h2");
  title.textContent = "Create a post";
  title.className = "text-xl font-semibold text-gray-800";
  modal.appendChild(title);

  // 文字輸入
  const textarea = document.createElement("textarea");
  textarea.placeholder = "What's on your mind?";
  textarea.className = "flex-1 min-h-0 w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder-gray-400";
 
  modal.appendChild(textarea);

  // 📸 自訂「上傳圖片」按鈕
  const uploadSection = document.createElement("div");
  uploadSection.className = "flex justify-center items-center";

  const uploadLabel = document.createElement("label");
  uploadLabel.className =
    "flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-100 transition border border-indigo-200 font-medium";
  uploadLabel.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" class="w-5 h-5" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
    </svg>

    <span>Upload image</span>
  `;

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.className = "hidden";
  uploadLabel.appendChild(fileInput);

  uploadSection.appendChild(uploadLabel);
  modal.appendChild(uploadSection);

  // 預覽區
  const previewContainer = document.createElement("div");
  previewContainer.className = "mt-3 flex justify-center";
  modal.appendChild(previewContainer);

  // 預覽與移除
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    previewContainer.innerHTML = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      fileInput.value = "";
      updateSubmitState();
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgWrapper = document.createElement("div");
      imgWrapper.className = "relative inline-block";

      const img = document.createElement("img");
      img.src = event.target.result;
      img.alt = file.name;
      img.className =
        "w-48 h-48 object-cover rounded-xl border border-gray-300 shadow-sm";

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.className =
        "absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-base flex items-center justify-center hover:bg-red-600 shadow";
      removeBtn.onclick = () => {
        fileInput.value = "";
        previewContainer.innerHTML = "";
        updateSubmitState();
      };

      imgWrapper.appendChild(img);
      imgWrapper.appendChild(removeBtn);
      previewContainer.appendChild(imgWrapper);
      updateSubmitState();
    };
    reader.readAsDataURL(file);
  });

  // 按鈕列
  const btnRow = document.createElement("div");
  btnRow.className = "flex justify-between items-center pt-3 border-t border-gray-200 mt-2";
  modal.appendChild(btnRow);

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className =
    "px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition";
  cancelBtn.dataset.actionList = JSON.stringify([
    { type: "click", action: "closePostModalPage", eventParameter: {} },
  ]);
  btnRow.appendChild(cancelBtn);

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Post";
  submitBtn.className =
    "px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed";
  submitBtn.dataset.actionList = JSON.stringify([
    { type: "click", action: "submitPostModalPage", eventParameter: {} },
  ]);
  submitBtn.disabled = true;
  btnRow.appendChild(submitBtn);

  // 更新提交狀態
  function updateSubmitState() {
    const hasText = textarea.value.trim().length > 0;
    const hasImage = fileInput.files.length > 0;
    submitBtn.disabled = !(hasText || hasImage);
  }

  textarea.addEventListener("input", updateSubmitState);

  document.body.appendChild(overlay);
  return overlay;
}

// 關閉表單
export function closePostModalPage() {
  const overlay = document.querySelector(".post-modal-overlay");
  if (overlay) overlay.remove();
}

export async function submitPostModalPage() {
  const overlay = document.querySelector(".post-modal-overlay");
  if (!overlay) return;

  const modal = overlay.querySelector("div");
  if (!modal) return;

  // 抓取表單欄位
  const textarea = modal.querySelector("textarea");
  const fileInput = modal.querySelector('input[type="file"]');

  const text = textarea?.value?.trim() || "";
  const file = fileInput?.files?.[0] || null;

  // 清空 modal → 顯示 loading
  modal.innerHTML = "";
  const loading = document.createElement("div");
  loading.className = "flex flex-col items-center justify-center space-y-2 p-6";
  loading.innerHTML = `
    <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-opacity-75"></div>
    <p class="text-gray-600">Submitting...</p>
  `;
  modal.appendChild(loading);

  try {
    // 呼叫 service 層
    const res = await uploadPostData.makePost(file, text);

    if (!res || res.result === "fail") {
      const errMsg = res?.message || "Post upload failed";
      throw new Error(errMsg);
    }

    // ✅ 成功畫面
    modal.innerHTML = "";
    modal.className = "bg-white rounded-2xl shadow-lg p-6 flex flex-col space-y-4 w-[60vw] max-w-lg";
    modal.style.removeProperty("width");
    modal.style.removeProperty("height");

    const successMsg = document.createElement("p");
    successMsg.textContent = "Submitted successfully!";
    successMsg.className = "text-center text-green-600 text-lg font-semibold";
    modal.appendChild(successMsg);

    const doneBtn = document.createElement("button");
    doneBtn.textContent = "Done";
    doneBtn.className =
      "mt-4 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition block mx-auto";
    doneBtn.dataset.actionList = JSON.stringify([
      { type: "click", action: "closePostModalPage", eventParameter: {} }
    ]);
    modal.appendChild(doneBtn);

  } catch (err) {
    modal.innerHTML = "";
    modal.className = "bg-white rounded-2xl shadow-lg p-6 flex flex-col space-y-4 w-[60vw] max-w-lg";
    modal.style.removeProperty("width");
    modal.style.removeProperty("height");

    let displayMsg = "Submission failed, please try again later.";

    // 嘗試解析 JSON 格式錯誤
    try {
      const parsed = JSON.parse(err.message);
      if (parsed?.error?.message) {
        displayMsg = `Submission failed: ${parsed.error.message}`;
      } else if (parsed?.message) {
        displayMsg = `Submission failed: ${parsed.message}`;
      }
    } catch {
      // 如果不是 JSON，就顯示原始文字
      if (err.message && err.message !== "Post upload failed") {
        displayMsg = `Submission failed: ${err.message}`;
      }
    }

    const errorMsg = document.createElement("p");
    errorMsg.textContent = displayMsg;
    errorMsg.className = "text-center text-red-600 text-lg font-semibold";
    modal.appendChild(errorMsg);

    const retryBtn = document.createElement("button");
    retryBtn.textContent = "Close";
    retryBtn.className =
      "mt-4 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition block mx-auto";
    retryBtn.dataset.actionList = JSON.stringify([
      { type: "click", action: "closePostModalPage", eventParameter: {} }
    ]);
    modal.appendChild(retryBtn);

  }
}

