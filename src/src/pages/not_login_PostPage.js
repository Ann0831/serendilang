import { getGlobalPostSuggestNormalized } from "../service/recommendPostsService.js";
import { getPostById, getProfilePictureUrl, getUserLanguage, getUsernameById } from "../api/api.client.js";
import { updateState } from "../utils/uiStateAdapter.js";
import { eventBus } from "../utils/eventBus.js";

let state = {
  recommendedPosts: [],
  renderedCount: 0,
  loading: false,
  initialized: false,
  visiblePostIds: [],
  endReached: false,
};

let _detailJobVersion = 0;
let _loadMoreLock = false;

function syncState() {
  updateState("NotLoginPostPage", state);
}

function patchState(patch) {
  state = { ...state, ...patch };
  syncState();
}

function isValidPost(item) {
  return item && typeof item === "object" && typeof item.post_id === "string" && typeof item.author_id === "string";
}

function toSkeletonPost(item) {
  return {
    ...item,
    content: "",
    author_name: "",
    created_at: "",
    image_url: "",
    like_count: 0,
    profilePicture_url: "",
    userLang: null,
    userlikeit: false,
    detailStatus: "loading",
  };
}

function publishNextPosts(amount = 1) {
  const remain = state.recommendedPosts.length - state.renderedCount;
  const toPublish = Math.min(remain, amount);
  if (toPublish <= 0) return [];

  const nextBatch = state.recommendedPosts.slice(state.renderedCount, state.renderedCount + toPublish);
  const nextVisibleIds = [
    ...state.visiblePostIds,
    ...nextBatch.map((x) => x.post_id).filter(Boolean),
  ];

  patchState({
    renderedCount: state.renderedCount + toPublish,
    visiblePostIds: nextVisibleIds,
  });
  return nextBatch.map((x) => x.post_id).filter(Boolean);
}

function updateOnePost(postId, updater) {
  let changed = false;
  const next = state.recommendedPosts.map((post) => {
    if (post?.post_id !== postId) return post;
    changed = true;
    return updater(post);
  });
  if (!changed) return;
  patchState({ recommendedPosts: next });
}

function getPendingVisiblePostIds() {
  const visibleSet = new Set(state.visiblePostIds);
  return state.recommendedPosts
    .filter((p) => visibleSet.has(p?.post_id))
    .filter((p) => p?.detailStatus !== "ready" && p?.detailStatus !== "error")
    .map((p) => p?.post_id)
    .filter(Boolean);
}

async function enrichPostDetail(item) {
  const postId = item?.post_id;
  const authorId = item?.author_id;
  if (!postId || !authorId) return item;

  try {
    const [postSettled, profileSettled, langSettled, usernameSettled] = await Promise.allSettled([
      getPostById(postId),
      getProfilePictureUrl(authorId),
      getUserLanguage(authorId),
      getUsernameById(authorId),
    ]);
    const postRes = postSettled.status === "fulfilled" ? postSettled.value : null;
    const profileRes = profileSettled.status === "fulfilled" ? profileSettled.value : null;
    const langRes = langSettled.status === "fulfilled" ? langSettled.value : null;
    const usernameRes = usernameSettled.status === "fulfilled" ? usernameSettled.value : null;

    const post = postRes?.status === "success" ? postRes.data : null;
    if (!post) return { ...item, detailStatus: "error" };

    return {
      ...item,
      ...post,
      post_id: postId,
      author_id: authorId,
      content: post?.content ?? post?.article ?? "",
      author_name:
        post?.author_name ||
        (usernameRes?.status === "success" ? usernameRes.data : "") ||
        authorId,
      profilePicture_url:
        profileRes?.status === "success" && profileRes?.data
          ? profileRes.data
          : `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      userLang:
        langRes?.status === "success" && langRes?.data
          ? langRes.data
          : { nativelanguage: "?", targetlanguage: "?" },
      userlikeit: false,
      detailStatus: "ready",
    };
  } catch {
    return {
      ...item,
      detailStatus: "error",
      profilePicture_url: `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      userLang: { nativelanguage: "?", targetlanguage: "?" },
    };
  }
}

function _nextDetailJobVersion() {
  _detailJobVersion += 1;
  return _detailJobVersion;
}

function _isCurrentDetailJob(version) {
  return version === _detailJobVersion;
}

async function enrichPostById(postId, version) {
  if (!_isCurrentDetailJob(version)) return;
  const current = state.recommendedPosts.find((x) => x?.post_id === postId);
  if (!current || current.detailStatus === "ready" || current.detailStatus === "error") return;
  const detailed = await enrichPostDetail(current);
  if (!_isCurrentDetailJob(version)) return;
  updateOnePost(postId, (p) => ({ ...p, ...detailed }));
}

async function enrichVisiblePostsInBackground(version, postIds = []) {
  const ids = postIds.length > 0 ? postIds : [...state.visiblePostIds];
  for (const postId of ids) {
    if (!_isCurrentDetailJob(version)) return;
    await enrichPostById(postId, version);
  }
}

async function loadMorePosts({ isPreload = false, showEndReachedNotice = false } = {}) {
  if (_loadMoreLock || state.loading) return;

  _loadMoreLock = true;
  patchState({ loading: true });

  try {
    let appendedCount = 0;
    if (state.renderedCount >= state.recommendedPosts.length) {
      const fetched = await getGlobalPostSuggestNormalized();
      const incoming = Array.isArray(fetched) ? fetched.filter(isValidPost) : [];

      const existing = new Set(state.recommendedPosts.map((p) => p.post_id));
      const appended = [];
      for (const item of incoming) {
        if (existing.has(item.post_id)) continue;
        existing.add(item.post_id);
        appended.push(item);
      }

      const skeletons = appended.map(toSkeletonPost);
      appendedCount = skeletons.length;
      if (skeletons.length > 0) {
        patchState({ recommendedPosts: [...state.recommendedPosts, ...skeletons], endReached: false });
      }

      if (appendedCount < 1 && !isPreload && showEndReachedNotice && !state.endReached) {
        patchState({ endReached: true });
        eventBus.emit("pushNotification", {
          key: "not-login-posts-end-reached",
          level: "success",
          message: "Register or log in to see more.",
          sticky: false,
          timeoutMs: 2600,
          from: "pages/not_login_PostPage/end-reached",
        });
      }
    }

    const publishAmount = 5;
    const publishedIds = publishNextPosts(publishAmount);
    const enrichTargets = [...new Set([...publishedIds, ...getPendingVisiblePostIds()])];
    if (enrichTargets.length > 0) {
      const version = _nextDetailJobVersion();
      void enrichVisiblePostsInBackground(version, enrichTargets);
    }
  } finally {
    patchState({ loading: false });
    _loadMoreLock = false;
  }
}

export async function notLogin_PostPage_LoadMore(params = {}) {
  const from = String(params?.from || "");
  const inferredPreload = from.includes("window-preload") || from.includes("preload");
  const isPreload = params?.isPreload === true || inferredPreload;
  const showEndReachedNotice = !!params?.showEndReachedNotice;
  await loadMorePosts({ isPreload, showEndReachedNotice });
}

async function initializeIfNeeded() {
  if (state.initialized && state.recommendedPosts.length > 0) return;

  patchState({ loading: true });
  try {
    const batch1 = await getGlobalPostSuggestNormalized();
    const firstBatch = Array.isArray(batch1) ? batch1.filter(isValidPost) : [];
    const seen = new Set();
    const uniq = [];
    for (const it of firstBatch) {
      if (seen.has(it.post_id)) continue;
      seen.add(it.post_id);
      uniq.push(it);
    }

    patchState({
      recommendedPosts: uniq.map(toSkeletonPost),
      renderedCount: 0,
      visiblePostIds: [],
      initialized: true,
      endReached: false,
    });

    const publishedIds = publishNextPosts(5);
    const version = _nextDetailJobVersion();
    void enrichVisiblePostsInBackground(version, publishedIds);
  } finally {
    patchState({ loading: false });
  }
}

export async function initialize() {
  state = {
    recommendedPosts: [],
    renderedCount: 0,
    loading: false,
    initialized: false,
    visiblePostIds: [],
    endReached: false,
  };
  _detailJobVersion = 0;
  _loadMoreLock = false;
  syncState();

  await initializeIfNeeded();
}
