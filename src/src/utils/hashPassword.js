import CryptoJS from "https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/+esm";

/**
 * 將明文密碼轉為 SHA256 雜湊字串
 * @param {string} password - 使用者輸入的明文密碼
 * @returns {string} 雜湊後的字串（Hex 編碼）
 */
export function hashPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Invalid password");
  }
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

