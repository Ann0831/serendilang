// pages/loginPostPage.js (重寫版 - 適配 { post_id, author_id } 格式)
import { getPostSuggestNormalized } from "../service/recommendPostsService.js";
import { renderPostCardWithLoading } from "../ui_controll/renderPostCard.js";
import {getCurrentUserBlockList_Global,getCurrentUserReportedPosts_Global} from "/user_identity/user_identity.js";
// ========================
// Module-level state (快取)
// ========================
let state = {
  /** @type {{post_id:string, author_id:string}[]} */
  recommendedPosts: [],
  renderedCount: 0,
  loading: false,
  initialized: false,
  scrollBound: false,
};

const PERSIST_TO_SESSION = false; // ← 想跨刷新保留就改成 true
const STORAGE_KEY = "postpage_cache_v1";

const postContainer = document.getElementById("postContainer");
const postListEl = document.getElementById("postpage-posts");

// ========================
// Utils
// ========================
function isValidPost(item) {
  return (
    item &&
    typeof item === "object" &&
    typeof item.post_id === "string" &&
    typeof item.author_id === "string"
  );
}

function saveToSession() {
  if (!PERSIST_TO_SESSION) return;
  try {
    const payload = {
      recommendedPosts: state.recommendedPosts,
      renderedCount: state.renderedCount,
      initialized: state.initialized,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("[postpage] persist failed:", e);
  }
}

function restoreFromSession() {
  if (!PERSIST_TO_SESSION) return false;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.recommendedPosts)) return false;

    // 僅保留合法的 {post_id, author_id}
    state.recommendedPosts = parsed.recommendedPosts.filter(isValidPost);
    state.renderedCount = Math.max(
      0,
      Math.min(Number(parsed.renderedCount) || 0, state.recommendedPosts.length)
    );
    state.initialized = !!parsed.initialized;
    return true;
  } catch (e) {
    console.warn("[postpage] restore failed:", e);
    return false;
  }
}

// ========================
// 核心：渲染控制
// ========================

/**
 * 將 state.recommendedPosts 中尚未渲染的項目，渲染到 postListEl
 * @param {number} amount 本次要補渲染幾筆
 */
function renderNext(amount = 1) {
  const { recommendedPosts, renderedCount } = state;
  const remain = recommendedPosts.length - renderedCount;
  const toRender = Math.min(remain, amount);

  for (let i = 0; i < toRender; i++) {
    const postObj = recommendedPosts[state.renderedCount]; // { post_id, author_id }
    // 直接將物件交給原本的渲染 API（若你的 API 需要其他鍵名，可在這裡轉換）
    renderPostCardWithLoading(postObj.post_id, postListEl);
    state.renderedCount += 1;
  }

  saveToSession();
}

/**
 * 容器重建時補渲染缺少的節點（不清資料）
 */
function hydrateFromCacheIfNeeded() {
  const domCount = postListEl.children.length;
  if (domCount < state.renderedCount) {
    for (let i = domCount; i < state.renderedCount; i++) {
      const postObj = state.recommendedPosts[i];
      renderPostCardWithLoading(postObj, postListEl);
    }
  }
}

// ========================
// 載入更多（含打 API）
// ========================


async function loadMorePosts({ isPreload = false } = {}) {
  if (state.loading) return;
  state.loading = true;

  try {
    // 情境 A：已把快取渲染完，需要打 API 拿一批新的
    if (state.renderedCount >= state.recommendedPosts.length) {
      const fetched = await getPostSuggestNormalized();
      const incoming = Array.isArray(fetched) ? fetched.filter(isValidPost) : [];

      const existing = new Set(state.recommendedPosts.map(p => p.post_id));
      const appended = [];
      const blockList = await getCurrentUserBlockList_Global();
      const reportPosts = await getCurrentUserReportedPosts_Global();

      for (const item of incoming) {
        const key = item.post_id;
        if (
          !existing.has(key) &&
          !blockList.includes(item.author_id) &&
          !reportPosts.includes(item.post_id)
        ) {
          existing.add(key);
          appended.push(item);
        }
      }

      console.log("[loginPostPage] fetched:", incoming);
      console.log("[loginPostPage] state.recommendedPosts(before):", state.recommendedPosts);
      console.log("[loginPostPage] appended:", appended);

      state.recommendedPosts = [...state.recommendedPosts, ...appended];
      saveToSession();

      if (appended.length < 1) {
        console.log("appended.length < 1");
        if (!isPreload) showEndOfPostsNotice();
      }
    } 
    // 情境 B：還有快取尚未渲染 → 不 return，直接讓流程往下 renderNext()
    renderNext(1);

  } catch (err) {
    console.error("[postpage] loadMorePosts error:", err);
  } finally {
    state.loading = false;
  }
}

// ========================
// 初始化 + 進入 / 離開
// ========================

/** 第一次進入或 cache 為空時的初始化 */
async function initializeIfNeeded() {
  if (state.initialized && state.recommendedPosts.length > 0) {
    return;
  }

  const spinner = document.getElementById("main-overlay-spinner");
  spinner?.classList.remove("hidden");

  try {
    const batch1 = await getPostSuggestNormalized();
    console.log("[loginPostPage] batch1:", batch1);

    const firstBatch = Array.isArray(batch1) ? batch1.filter(isValidPost) : [];

    // 以 post_id 去重（即使第一批也做一下保險）
    const uniq = [];
    const seen = new Set();
    const blockList = await getCurrentUserBlockList_Global();  // ← 先抓封鎖清單
    const reportPosts= await getCurrentUserReportedPosts_Global();
    for (const it of firstBatch) {
      const k = it.post_id;
      // 過濾：如果作者在 blockList 就跳過
      if (!seen.has(k) && !blockList.includes(it.author_id)&&!reportPosts.includes(it.post_id)) {
        seen.add(k);
        uniq.push(it);
      }
    }

    state.recommendedPosts = uniq;


    state.renderedCount = 0;
    state.initialized = true;

    // 初次渲染 3 筆（維持你原本行為）
    renderNext(5);
  } catch (err) {
    console.error("[postpage] initialize error:", err);
  } finally {
    spinner?.classList.add("hidden");
    saveToSession();
  }
}

/** 滑動邏輯（保留你的判斷） */
function onScroll() {
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  const full = document.documentElement.scrollHeight;

  if (scrollY + vh >= full - 50) {
    loadMorePosts();
  }else if(scrollY + vh >= full - 1500){
    loadMorePosts({ "isPreload":true });
  }
}

/** 對外：進入貼文頁 */
export async function login_PostPage_Enter() {
  console.log("[postpage] enter");

  // 1) 嘗試從 session 恢復（可選）
  restoreFromSession();

  // 2) 如果容器是新建的，把 cache 渲染回來
  hydrateFromCacheIfNeeded();

  // 3) 若還沒初始化或沒有資料，進行初始化
  await initializeIfNeeded();

  // 4) 綁定 scroll（避免重複綁）
  if (!state.scrollBound) {
    window.addEventListener("scroll", onScroll, { passive: true });
    state.scrollBound = true;
  }
}

/** 對外：離開貼文頁 */
export function login_PostPage_Leave() {
  console.log("[postpage] leave");
  if (state.scrollBound) {
    window.removeEventListener("scroll", onScroll);
    state.scrollBound = false;
  }
  // 不清空 state/postList，保留快取
}

// ========================
//（可選）提供重置 API
// ========================
export function login_PostPage_ResetCache() {
  state = {
    recommendedPosts: [],
    renderedCount: 0,
    loading: false,
    initialized: false,
    scrollBound: state.scrollBound,
  };
  if (PERSIST_TO_SESSION) {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  if (postListEl) postListEl.innerHTML = "";
  console.log("[postpage] cache reset");
}

// === 已讀完提示 ===
function showEndOfPostsNotice() {
  console.log("showEndOfPostsNotice");
  let notice = document.getElementById("end-of-posts-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "end-of-posts-notice";
    notice.className = `
      fixed bottom-6 left-1/2 transform -translate-x-1/2
      bg-gray-800 text-white text-sm rounded-lg shadow-lg
      px-4 py-2 z-50 opacity-90 transition-opacity
    `;
    notice.textContent = "✅ You’ve reached the end of all recommended posts";
    document.body.appendChild(notice);
  } else {
    notice.classList.remove("hidden");
  }
  setTimeout(() => {
    notice.classList.add("opacity-0");
    setTimeout(() => notice.remove(), 500);
  }, 2000);
}

function hideEndOfPostsNotice() {
  const notice = document.getElementById("end-of-posts-notice");
  if (notice) {
    notice.classList.add("hidden");
  }
}

