// postsPage.js — 完整重寫版（整頁滾動載入）
// 期待後端格式: [{ post_id, author_id }]
import { getGlobalPostSuggestNormalized } from '/service/recommendPostsService.js';
import { renderPostCardWithLoading } from '/ui_controll/renderPostCard.js';

// ===== DOM 參照 =====
const postsContainer = document.getElementById('postsContainer');
if (!postsContainer) {
  console.warn('[postsPage] #postsContainer not found. Rendering will be no-op.');
}

// ===== 參數設定 =====
const INITIAL_RENDER_COUNT = 5;     // 首次渲染數量
const BOTTOM_THRESHOLD_PX = 24;     // 距底多少像素內視為到底
const SAFETY_AUTOLOAD_STEPS = 10;   // 初始化後為填滿一屏最多補載幾次

// ===== 模組內部狀態 =====
let state = {
  /** @type {{post_id:string, author_id:string}[]} */
  recommended: [],
  renderedCount: 0,
  loading: false,   // 控「渲染/流程」的鎖
  fetching: false,  // 控實際打 API 的鎖
};

// ===== 小工具 =====
function isValidPost(x) {
  return x && typeof x === 'object'
    && typeof x.post_id === 'string'
    && typeof x.author_id === 'string';
}

function atWindowBottom(threshold = BOTTOM_THRESHOLD_PX) {
  const scrolled = window.scrollY + window.innerHeight;
  const full = document.documentElement.scrollHeight;
  return scrolled >= full - threshold;
}

// ===== 抓批次（必要時）+ 去重 =====
async function fetchMoreIfNeeded() {
  if (state.fetching) return;
  // 僅當「已渲染數量 >= 已取得數量」才需要再抓一批
  if (state.renderedCount < state.recommended.length) return;

  state.fetching = true;
  try {
    const fetched = await getGlobalPostSuggestNormalized(); // 期待 [{post_id, author_id}]
    const incoming = Array.isArray(fetched) ? fetched.filter(isValidPost) : [];
    if (incoming.length === 0) return;

    const seen = new Set(state.recommended.map(p => p.post_id));
    const appended = [];
    for (const item of incoming) {
      if (!seen.has(item.post_id)) {
        seen.add(item.post_id);
        appended.push(item);
      }
    }
    if (appended.length > 0) {
      state.recommended = state.recommended.concat(appended);
      // console.debug('[postsPage] appended:', appended);
    }
  } catch (err) {
    console.error('[postsPage] fetchMoreIfNeeded error:', err);
  } finally {
    state.fetching = false;
  }
}

// ===== 渲染一筆（只傳 post_id） =====
function renderNextOne() {
  if (state.renderedCount >= state.recommended.length) return false;
  const item = state.recommended[state.renderedCount];
  if (!postsContainer) return false;

  // ✅ 需求重點：渲染時 post 參數為 post_id
  renderPostCardWithLoading(item.post_id, postsContainer,{getLikeIt:false});
  state.renderedCount += 1;
  return true;
}

// ===== 對外主流程：載入更多（滾到底觸發）=====
async function loadMorePosts() {
  if (state.loading) return;
  state.loading = true;

  try {
    // 若沒有可渲染的資料，先嘗試抓一批
    if (state.renderedCount >= state.recommended.length) {
      await fetchMoreIfNeeded();
    }

    // 有資料就渲染一筆
    const rendered = renderNextOne();
    if (!rendered) {
      // 沒資料可渲染 → 可在此顯示「到底了」提示（若需要）
      // showEndOfPostsNotice?.();
    }
  } catch (err) {
    console.error('[postsPage] loadMorePosts error:', err);
  } finally {
    state.loading = false;
  }
}

// ===== 初始化：首批渲染 + 若不滿一屏自動補載 =====
async function initialize() {
  // 先抓一批，確保可渲染
  await fetchMoreIfNeeded();

  // 首次渲染 N 筆
  for (let i = 0; i < INITIAL_RENDER_COUNT; i++) {
    if (state.renderedCount >= state.recommended.length) {
      await fetchMoreIfNeeded();
    }
    if (!renderNextOne()) break;
  }

  // 如果第一屏還填不滿，主動補載，最多跑 SAFETY_AUTOLOAD_STEPS 次避免無限迴圈
  let steps = 0;
  while (atWindowBottom() && steps < SAFETY_AUTOLOAD_STEPS) {
    steps += 1;
    await loadMorePosts();
    // 若真的完全沒新資料，loadMorePosts 內部會不渲染任何東西，也會自然跳出
    if (state.renderedCount >= state.recommended.length) break;
  }
}

// ===== 綁定 window scroll（同幀節流）=====
let _scrollTicking = false;
function onWindowScroll() {
  if (_scrollTicking) return;
  _scrollTicking = true;
  requestAnimationFrame(async () => {
    try {
      if (atWindowBottom()) {
        await loadMorePosts();
      }
    } finally {
      _scrollTicking = false;
    }
  });
}
window.addEventListener('scroll', onWindowScroll, { passive: true });

// ===== 啟動 =====
(async () => {
  await initialize();
  // 若載完仍不足一屏，再試一次（避免某些極短頁面初始判斷略過）
  if (atWindowBottom()) {
    await loadMorePosts();
  }
})();

