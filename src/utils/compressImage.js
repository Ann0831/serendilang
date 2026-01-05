/**
 * 壓縮圖片
 * @param {File} file - 上傳的圖片 File 物件
 * @param {number} maxWidth - 最大寬度 (px)
 * @param {number} maxHeight - 最大高度 (px)
 * @param {number} quality - 壓縮品質 (0~1)
 * @param {string} outputType - 輸出格式 (image/jpeg, image/png, image/webp)
 * @returns {Promise<Blob>} 壓縮後的圖片 Blob
 */
export async function compressImage(
  file,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.8,
  outputType = "image/jpeg"
) {
  // 讀檔
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // 載入圖片
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  let { width, height } = img;

  // 等比縮放
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = width * ratio;
    height = height * ratio;
  }

  // 繪製到 canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  // 轉成 Blob
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error("圖片壓縮失敗"))),
      outputType,
      quality
    );
  });

  return blob;
}

