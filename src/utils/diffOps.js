/**
 * diffOps(a, b)
 * 以最小編輯序列（insert/delete/keep）將陣列 a 轉成 b。
 * - key 比對使用嚴格相等（===）
 * - insert 的 index：表示「把元素插到該位置」
 * 複雜度：O(n*m)
 *
 * @param {any[]} a - 原始陣列
 * @param {any[]} b - 目標陣列
 * @returns {{type:'keep'|'delete'|'insert', value:any, index?:number}[]} ops
 */
export function diffOps(a, b) {
  console.log("/utils/diffOps.js: diffOps: a: ",a);
  console.log("/utils/diffOps.js: diffOps: b: ",b);
  const n = Array.isArray(a) ? a.length : 0;
  const m = Array.isArray(b) ? b.length : 0;

  // 特例：任一邊不是陣列
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new TypeError("diffOps: both inputs must be arrays");
  }

  // DP: LCS 長度表
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const ai = a[i - 1];
    for (let j = 1; j <= m; j++) {
      dp[i][j] = ai === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // 回溯：建立反向操作序列
  let i = n, j = m;
  const revOps = [];
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      revOps.push({ type: "keep", value: a[i - 1], index: j-1 });
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      revOps.push({ type: "delete", value: a[i - 1], index: j });
      i--;
    } else {
      
      revOps.push({ type: "insert", value: b[j - 1], index: j-1 });
      j--;
    }
  }
  // 補尾端殘餘
  while (i > 0) {
    revOps.push({ type: "delete", value: a[i - 1],index:0 });
    i--;
  }
  while (j > 0) {
    // 此時 i===0，所以 index=0（插到最前）
    revOps.push({ type: "insert", value: b[j - 1], index: j-1 });
    j--;
  }

  // 反轉成由左到右的實際執行順序
  revOps.reverse();
  console.log("/utils/diffOps.js: diffOps: return revOps: ",revOps);

  return revOps;
}

export default diffOps;

