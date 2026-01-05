

export function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

// isSanitized：確認字串內是否還有未被 escape 的特殊字元
export function isSanitized(str) {
  // 有危險字元就不是安全的
  return !(/[&<>"'\/]/.test(str));
}


