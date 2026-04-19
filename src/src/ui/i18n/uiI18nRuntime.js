let started = false;
let observer = null;

function detectLocale() {
  if (typeof navigator === "undefined") return "en";
  const lang = String(navigator.language || "").toLowerCase();
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

const TEXT_MAP_ZH = new Map([
  ["Loading...", "載入中..."],
  ["Unknown", "未知"],
  ["Potential Friend", "潛在好友"],
  ["Friend Request", "好友邀請"],
  ["Friend Requests", "好友邀請"],
  ["Friends List", "好友列表"],
  ["Potential Friends", "潛在好友"],
  ["Main Page", "主頁"],
  ["Your friends", "你的好友"],
  ["No friends", "沒有好友"],
  ["No potential friends", "沒有潛在好友"],
  ["No requests", "沒有邀請"],
  ["Messages", "訊息"],
  ["Online users", "在線用戶"],
  ["Online Users", "在線用戶"],
  ["No online users", "沒有在線用戶"],
  ["No messages yet.", "尚無訊息。"],
  ["Make Post", "發文"],
  ["No data", "無資料"],
  ["No posts", "沒有貼文"],
  ["No conversations", "沒有對話"],
  ["No users", "沒有用戶"],
  ["No blocked users in state", "目前沒有封鎖名單資料"],
  ["Blocked Users", "封鎖名單"],
  ["Blocked Friends", "被封鎖好友"],
  ["Blocked", "已封鎖"],
  ["🚫 Blocked", "已封鎖"],
  ["Modals", "彈窗"],
  ["open", "開啟"],
  ["close", "關閉"],
  ["closed", "已關閉"],
  ["reload", "重新載入"],
  ["submit", "送出"],
  ["submitting", "提交中"],
  ["idle", "閒置"],
  ["unblock", "解除封鎖"],
  ["Retry", "重試"],
  ["Accept", "接受"],
  ["Accepted", "已接受"],
  ["Sent", "已送出"],
  ["Friend", "好友"],
  ["✨ NEW", "新通知"],
  ["✨ NEW FRIEND", "新好友"],
  ["NEW", "新通知"],
  ["NEW FRIEND", "新好友"],
  ["Report Post", "檢舉貼文"],
  ["Report User", "檢舉使用者"],
  ["Report", "檢舉"],
  ["Delete Post", "刪除貼文"],
  ["Block User", "封鎖使用者"],
  ["Unblock User", "解除封鎖使用者"],
  ["Add Friend", "加好友"],
  ["Friends", "好友"],
  ["Requested", "已送出邀請"],
  ["Request received", "收到邀請"],
  ["Message", "訊息"],
  ["Back to Home", "返回主頁"],
  ["Posts", "貼文"],
  ["Register / Login", "註冊 / 登入"],
  ["Edit Language", "編輯語言"],
  ["Edit Profile Picture", "編輯頭像"],
  ["Edit Username", "編輯使用者名稱"],
  ["Select image", "選擇圖片"],
  ["Delete Avatar", "刪除頭像"],
  ["Cancel", "取消"],
  ["Save", "儲存"],
  ["Updated successfully ✅", "更新成功"],
  ["Update failed ❌", "更新失敗"],
  ["OK", "確定"],
  ["Select language", "選擇語言"],
  ["Native language", "母語"],
  ["Target language", "目標語言"],
  ["Enter username", "輸入使用者名稱"],
  ["At least 8 characters", "至少 8 個字元"],
  ["Type password again", "請再次輸入密碼"],
  ["Username", "使用者名稱"],
  ["Password", "密碼"],
  ["Confirm Password", "確認密碼"],
  ["Native Language", "母語"],
  ["Target Language", "目標語言"],
  ["Invitation Code (Optional)", "邀請碼（選填）"],
  ["Invitation code", "邀請碼"],
  ["Upload Profile Picture", "上傳頭像"],
  ["I agree to the Terms and Privacy Policy.", "我同意服務條款與隱私政策。"],
  ["Previous", "上一步"],
  ["Skip", "略過"],
  ["Checking...", "檢查中..."],
  ["Next", "下一步"],
  ["Submitting...", "送出中..."],
  ["Finish", "完成"],
  ["Create your account", "建立你的帳號"],
  ["Join Serendilang and start language exchange.", "加入 Serendilang，開始語言交換。"],
  ["Complete your account", "完成你的帳號設定"],
  ["Finish your profile to start language exchange.", "完成個人資料即可開始語言交換。"],
  ["Checking Google account...", "正在檢查 Google 帳號..."],
  ["Google Account", "Google 帳號"],
  ["No Google email found", "找不到 Google 電子郵件"],
  ["You must use a Google account to continue this flow.", "此流程必須使用 Google 帳號才能繼續。"],
  ["Use another Google account", "使用其他 Google 帳號"],
  ["You can skip this step and upload later.", "你可以略過這一步，稍後再上傳。"],
  ["Submitted successfully!", "送出成功！"],
  ["Done", "完成"],
  ["Create a post", "建立貼文"],
  ["Upload image (optional)", "上傳圖片（可略過）"],
  ["Upload image", "上傳圖片"],
  ["Reset crop", "重設裁切"],
  ["Edit crop", "編輯裁切"],
  ["Complete crop", "完成裁切"],
  ["Crop locked", "裁切已鎖定"],
  ["Drag frame or side handles", "拖曳框線或側邊控制點"],
  ["No image selected. You can skip this step.", "尚未選擇圖片，你可以略過這一步。"],
  ['Please click "Complete crop" before next step.', "前往下一步前請先點擊「完成裁切」。"],
  ["Write article", "撰寫內容"],
  ["Image attached", "已附圖片"],
  ["(crop done)", "（裁切完成）"],
  ["(crop pending)", "（尚未完成裁切）"],
  ["What's on your mind?", "你在想什麼？"],
  ["Image attached (crop done)", "已附圖片（裁切完成）"],
  ["Image attached (crop pending)", "已附圖片（尚未完成裁切）"],
  ["Back to image", "返回圖片步驟"],
  ["Back", "返回"],
  ["Post", "發佈"],
  ["Unblock User", "解除封鎖使用者"],
  ["Unblocked successfully ✅", "解除封鎖成功"],
  ["Unblock failed ❌", "解除封鎖失敗"],
  ["Confirm Unblock", "確認解除封鎖"],
  ["Are you sure you want to unblock", "你確定要解除封鎖"],
  ["Blocked successfully ✅", "封鎖成功"],
  ["Block failed ❌", "封鎖失敗"],
  ["Confirm Block", "確認封鎖"],
  ["Are you sure you want to block", "你確定要封鎖"],
  ["Please provide a reason for reporting this post:", "請提供檢舉此貼文的原因："],
  ["Please provide a reason:", "請提供原因："],
  [". Please provide a reason:", "，請提供原因："],
  ["Describe the issue...", "請描述問題..."],
  ["Reported successfully ✅", "檢舉成功"],
  ["Report failed ❌", "檢舉失敗"],
  ["Submit Report", "送出檢舉"],
  ["Post deleted ✅", "貼文已刪除"],
  ["Delete failed ❌", "刪除失敗"],
  ["Confirm Delete", "確認刪除"],
  ["Like", "讚"],
  ["Unlike", "收回讚"],
  ["You", "你"],
  ["Network Error", "網路錯誤"],
  ["Connection Lost", "連線中斷"],
  ["Connection Restored", "連線恢復"],
  ["Too Many Requests", "請求過多"],
  ["Cannot reach the server.", "無法連線到伺服器。"],
  ["You are offline. Please check your internet connection.", "你目前離線，請檢查網路連線。"],
  ["Unexpected network issue.", "發生未預期的網路問題。"],
  ["Realtime connection was disconnected. Trying to reconnect...", "即時連線已中斷，正在嘗試重連..."],
  ["Realtime connection has been restored.", "即時連線已恢復。"],
  ["Rate limit exceeded. Please try again later.", "操作過於頻繁，請稍後再試。"],
  ["sent", "已送出"],
  ["failed", "失敗"],
  ["Send", "傳送"],
  ["Send message", "傳送訊息"],
  ["Scroll left", "向左捲動"],
  ["Scroll right", "向右捲動"],
  ["Type a message...", "輸入訊息..."],
  ["Close", "關閉"],
  ["Close chat room", "關閉聊天室"],
  ["Dismiss error", "關閉錯誤訊息"],
  ["Dismiss notification", "關閉通知"],
  ["Dialing...", "撥號中..."],
  ["Accept (With Camera)", "接受（開啟鏡頭）"],
  ["Accept (Without Camera)", "接受（不開鏡頭）"],
  ["Reject", "拒絕"],
  ["is calling you...", "正在來電..."],
  ["Auto close in", "將自動關閉於"],
  ["blocked", "已封鎖"],
]);

function translatePatternZh(text) {
  if (!text) return text;
  let out = text;
  out = out.replace(/^Native Language:\s*/i, "母語：");
  out = out.replace(/^Target Language:\s*/i, "目標語言：");
  out = out.replace(/^Native:\s*/i, "母語：");
  out = out.replace(/^Target:\s*/i, "目標語言：");
  out = out.replace(/\s*\|\s*Target:\s*/i, " | 目標語言：");
  out = out.replace(/\s*→\s*Target:\s*/i, " → 目標語言：");
  out = out.replace(/^Search\.\.\.$/i, "搜尋...");
  out = out.replace(/\sis calling you\.\.\.$/i, " 正在來電...");
  out = out.replace(/^Auto close in\s*(\d+)\s*s$/i, "將於 $1 秒後自動關閉");
  out = out.replace(/^blocked-list loading$/i, "封鎖名單 載入中");
  out = out.replace(/^blocked-list idle$/i, "封鎖名單 閒置");
  out = out.replace(/^Are you sure you want to unblock\s+(.+)\?$/i, "你確定要解除封鎖 $1 嗎？");
  out = out.replace(/^Are you sure you want to block\s+(.+)\?$/i, "你確定要封鎖 $1 嗎？");
  out = out.replace(/^Are you sure you want to delete this post\?$/i, "你確定要刪除此貼文嗎？");
  out = out.replace(/^Report\s+(.+)\.\s*Please provide a reason:$/i, "檢舉 $1，請提供原因：");
  out = out.replace(/^I agree to the\s*Terms\s*and\s*Privacy\.$/i, "我同意條款與隱私政策。");
  out = out.replace(/^step\s*(\d+)\s*of\s*(\d+)$/i, "第 $1 步，共 $2 步");
  return out;
}

function translateText(text, locale) {
  const raw = String(text || "");
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  if (locale !== "zh") return raw;

  const mapped = TEXT_MAP_ZH.get(trimmed);
  if (mapped) {
    return raw.replace(trimmed, mapped);
  }

  const pattern = translatePatternZh(trimmed);
  if (pattern !== trimmed) {
    return raw.replace(trimmed, pattern);
  }

  return raw;
}

function shouldIgnoreNode(node) {
  const parent = node.parentElement;
  if (!parent) return true;
  const tag = parent.tagName;
  return tag === "SCRIPT" || tag === "STYLE" || tag === "CODE" || tag === "PRE";
}

function applyNodeTranslation(root, locale) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (!shouldIgnoreNode(node)) {
      const next = translateText(node.nodeValue, locale);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
    node = walker.nextNode();
  }

  const elements = root.querySelectorAll?.("*");
  if (!elements) return;
  elements.forEach((el) => {
    ["placeholder", "title", "aria-label"].forEach((attr) => {
      const prev = el.getAttribute(attr);
      if (!prev) return;
      const next = translateText(prev, locale);
      if (next !== prev) el.setAttribute(attr, next);
    });
  });
}

export function ensureUiI18nRuntime() {
  if (started || typeof document === "undefined") return;
  started = true;

  const locale = detectLocale();
  if (locale === "en") return;

  applyNodeTranslation(document.body, locale);

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        const el = mutation.target;
        if (!el?.getAttribute) continue;
        const attr = mutation.attributeName;
        if (!attr || !["placeholder", "title", "aria-label"].includes(attr)) continue;
        const prev = el.getAttribute(attr);
        if (!prev) continue;
        const next = translateText(prev, locale);
        if (next !== prev) el.setAttribute(attr, next);
        continue;
      }

      if (mutation.type === "characterData") {
        const node = mutation.target;
        if (node?.nodeType === Node.TEXT_NODE && !shouldIgnoreNode(node)) {
          const next = translateText(node.nodeValue, locale);
          if (next !== node.nodeValue) node.nodeValue = next;
        }
        continue;
      }

      mutation.addedNodes?.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const next = translateText(node.nodeValue, locale);
          if (next !== node.nodeValue) node.nodeValue = next;
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          applyNodeTranslation(node, locale);
        }
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "title", "aria-label"],
  });
}
