import { getPostSuggestNormalized } from "../service/recommendPostsService.js";
import { getCurrentUserBlockList_Global, getCurrentUserReportedPosts_Global } from "../userSelfData/userSelfData.js";
import { updateState } from "../utils/uiStateAdapter.js";
import { getPostById, getProfilePictureUrl, getUserLanguage, getUserLikePost } from "../api/api.client.js";
import { uploadPostData } from "../service/uploadPostData.js";
import { eventBus } from "../utils/eventBus.js";

let state = {
  recommendedPosts: [],
  renderedCount: 0,
  loading: false,
  initialized: false,
  loadFailed: false,
  visiblePostIds: [],
  showing: false,
  endReached: false,
};
let _detailJobVersion = 0;
let _loadMoreLock = false;
const _likeLocks = new Set();

function syncLoginPostState() {
  updateState("LoginPostPage", state);
}

function patchState(patch) {
  state = { ...state, ...patch };
  syncLoginPostState();
}

function isValidPost(item) {
  return item && typeof item === "object" && typeof item.post_id === "string" && typeof item.author_id === "string";
}

async function enrichPostDetail(item) {
  const postId = item?.post_id;
  const fallbackAuthorId = item?.author_id;
  if (!postId) return item;

  try {
    const postRes = await getPostById(postId);
    const post = postRes?.status === "success" ? postRes.data : null;
    const authorId = post?.author_id || fallbackAuthorId;
    if (!post || !authorId) return item;

    const [profileSettled, langSettled, likeSettled] = await Promise.allSettled([
      getProfilePictureUrl(authorId),
      getUserLanguage(authorId),
      getUserLikePost(postId),
    ]);
    const profileRes = profileSettled.status === "fulfilled" ? profileSettled.value : null;
    const langRes = langSettled.status === "fulfilled" ? langSettled.value : null;
    const likeRes = likeSettled.status === "fulfilled" ? likeSettled.value : null;

    return {
      ...item,
      ...post,
      post_id: postId,
      author_id: authorId,
      content: post?.content ?? post?.article ?? "",
      profilePicture_url:
        profileRes?.status === "success" && profileRes?.data
          ? profileRes.data
          : `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      userLang:
        langRes?.status === "success" && langRes?.data
          ? langRes.data
          : { nativelanguage: "?", targetlanguage: "?" },
      userlikeit: likeRes?.status === "success" ? !!likeRes.data : false,
      uiStatus: "idle",
    };
  } catch {
    return {
      ...item,
      content: item?.content || "",
      profilePicture_url: item?.profilePicture_url || `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
      userLang: item?.userLang || { nativelanguage: "?", targetlanguage: "?" },
      userlikeit: !!item?.userlikeit,
      detailStatus: "error",
      uiStatus: "idle",
    };
  }
}

function publishNextPostsState(amount = 1) {
  const remain = state.recommendedPosts.length - state.renderedCount;
  const toPublish = Math.min(remain, amount);
  const nextBatch = state.recommendedPosts.slice(state.renderedCount, state.renderedCount + toPublish);

  if (toPublish <= 0) return [];
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
    uiStatus: "idle",
  };
}

function _nextDetailJobVersion() {
  _detailJobVersion += 1;
  return _detailJobVersion;
}

function _isCurrentDetailJob(version) {
  return version === _detailJobVersion;
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

function readPost(postId) {
  return state.recommendedPosts.find((p) => p?.post_id === postId) || null;
}

function getPendingVisiblePostIds() {
  const visibleSet = new Set(state.visiblePostIds);
  return state.recommendedPosts
    .filter((p) => visibleSet.has(p?.post_id))
    .filter((p) => p?.detailStatus !== "ready" && p?.detailStatus !== "error")
    .map((p) => p?.post_id)
    .filter(Boolean);
}

async function enrichPostById(postId, version) {
  if (!_isCurrentDetailJob(version)) return;
  const current = state.recommendedPosts.find((x) => x?.post_id === postId);
  if (!current || current.detailStatus === "ready" || current.detailStatus === "error") return;
  const detailed = await enrichPostDetail(current);
  if (!_isCurrentDetailJob(version)) return;
  updateOnePost(postId, (post) => ({
    ...post,
    ...detailed,
    detailStatus: detailed?.detailStatus === "error" ? "error" : "ready",
    uiStatus: "idle",
  }));
}

async function enrichVisiblePostsInBackground(version, postIds = []) {
  const ids = postIds.length > 0 ? postIds : [...state.visiblePostIds];
  for (const postId of ids) {
    if (!_isCurrentDetailJob(version)) return;
    await enrichPostById(postId, version);
  }
}

async function resolveFilterListsWithTimeout(timeoutMs = 600) {
  const timeout = (fallback) =>
    new Promise((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    });

  const [blockSettled, reportSettled] = await Promise.allSettled([
    Promise.race([getCurrentUserBlockList_Global(), timeout([])]),
    Promise.race([getCurrentUserReportedPosts_Global(), timeout([])]),
  ]);
  const blockList = blockSettled.status === "fulfilled" ? blockSettled.value : [];
  const reportPosts = reportSettled.status === "fulfilled" ? reportSettled.value : [];

  return {
    blockList: Array.isArray(blockList) ? blockList : [],
    reportPosts: Array.isArray(reportPosts) ? reportPosts : [],
  };
}

async function loadMorePosts({ isPreload = false, showEndReachedNotice = false } = {}) {
  if (!state.showing) return;
  if (_loadMoreLock || state.loading) return;
  _loadMoreLock = true;
  patchState({ loading: true });

  try {
    let appendedCount = 0;
    if (state.renderedCount >= state.recommendedPosts.length) {
      const fetched = await getPostSuggestNormalized();
      if (state.loadFailed) patchState({ loadFailed: false });
      const incoming = Array.isArray(fetched) ? fetched.filter(isValidPost) : [];

      const existing = new Set(state.recommendedPosts.map((p) => p.post_id));
      const appended = [];
      const { blockList, reportPosts } = await resolveFilterListsWithTimeout();

      for (const item of incoming) {
        if (existing.has(item.post_id)) continue;
        if (Array.isArray(blockList) && blockList.includes(item.author_id)) continue;
        if (Array.isArray(reportPosts) && reportPosts.includes(item.post_id)) continue;
        existing.add(item.post_id);
        appended.push(item);
      }

      const skeletons = appended.map(toSkeletonPost);
      appendedCount = skeletons.length;
      if (skeletons.length > 0) {
        patchState({ recommendedPosts: [...state.recommendedPosts, ...skeletons], endReached: false });
      }

      if (appended.length < 1 && !isPreload && showEndReachedNotice) {
        if (!state.endReached) {
          patchState({ endReached: true });
          eventBus.emit("pushNotification", {
            key: "main-posts-end-reached",
            level: "success",
            message: "You've read all posts.",
            sticky: false,
            timeoutMs: 2600,
            from: "pages/loginPostPage/end-reached",
          });
        }
      }
    }

    const publishAmount = isPreload ? 1 : 3;
    const publishedIds = publishNextPostsState(publishAmount);
    const enrichTargets = [...new Set([...publishedIds, ...getPendingVisiblePostIds()])];
    if (enrichTargets.length > 0) {
      const version = _nextDetailJobVersion();
      void enrichVisiblePostsInBackground(version, enrichTargets);
    }
  } catch (error) {
    if (state.recommendedPosts.length === 0) {
      patchState({ initialized: true, loadFailed: true });
    }
    console.error("[loginPostPage] loadMorePosts failed:", error);
  } finally {
    patchState({ loading: false });
    _loadMoreLock = false;
  }
}

async function initializeIfNeeded() {
  if (state.initialized && state.recommendedPosts.length > 0) return;

  patchState({ loading: true });

  try {
    const batch1 = await getPostSuggestNormalized();
    const firstBatch = Array.isArray(batch1) ? batch1.filter(isValidPost) : [];

    const seen = new Set();
    const uniq = [];
    const { blockList, reportPosts } = await resolveFilterListsWithTimeout();

    for (const it of firstBatch) {
      if (seen.has(it.post_id)) continue;
      if (Array.isArray(blockList) && blockList.includes(it.author_id)) continue;
      if (Array.isArray(reportPosts) && reportPosts.includes(it.post_id)) continue;
      seen.add(it.post_id);
      uniq.push(it);
    }

    patchState({
      recommendedPosts: uniq.map(toSkeletonPost),
      renderedCount: 0,
      visiblePostIds: [],
      initialized: true,
      loadFailed: false,
      endReached: false,
    });

    const publishedIds = publishNextPostsState(5);
    const version = _nextDetailJobVersion();
    void enrichVisiblePostsInBackground(version, publishedIds);
  } catch (error) {
    patchState({
      recommendedPosts: [],
      renderedCount: 0,
      visiblePostIds: [],
      initialized: true,
      loadFailed: true,
      endReached: false,
    });
    console.error("[loginPostPage] initializeIfNeeded failed:", error);
  } finally {
    patchState({ loading: false });
  }
}

export async function login_PostPage_Enter() {
  patchState({ showing: true });
  if (!state.initialized) {
    await initializeIfNeeded(); // first enter: try to load and publish 5 posts
  } else if (state.visiblePostIds.length === 0 && state.recommendedPosts.length > 0) {
    const publishedIds = publishNextPostsState(5); // initialized but nothing visible, rehydrate first 5
    const enrichTargets = [...new Set([...publishedIds, ...getPendingVisiblePostIds()])];
    if (enrichTargets.length > 0) {
      const version = _nextDetailJobVersion();
      void enrichVisiblePostsInBackground(version, enrichTargets);
    }
  } else {
    const pending = getPendingVisiblePostIds();
    if (pending.length > 0) {
      const version = _nextDetailJobVersion();
      void enrichVisiblePostsInBackground(version, pending);
    }
  }
}

export async function login_PostPage_LoadMore(params = {}) {
  const isPreload = !!params?.isPreload;
  const showEndReachedNotice = !!params?.showEndReachedNotice;
  await loadMorePosts({ isPreload, showEndReachedNotice });
}

export async function login_PostPage_ToggleLike(postId) {
  if (!postId) return { result: "fail", reason: "missing_post_id" };
  if (_likeLocks.has(postId)) return { result: "ignored", reason: "busy" };

  const before = readPost(postId);
  if (!before) return { result: "fail", reason: "post_not_found" };

  const prevLiked = !!before.userlikeit;
  const prevCount = Number.isFinite(Number(before.like_count)) ? Number(before.like_count) : 0;
  const nextLiked = !prevLiked;
  const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

  _likeLocks.add(postId);
  updateOnePost(postId, (p) => ({
    ...p,
    userlikeit: nextLiked,
    like_count: nextCount,
    likePending: true,
  }));

  try {
    const res = nextLiked
      ? await uploadPostData.sendLike(postId)
      : await uploadPostData.unsendLike(postId);

    if (res?.result === "success") {
      updateOnePost(postId, (p) => ({ ...p, likePending: false }));
      return { result: "success", liked: nextLiked };
    }

    updateOnePost(postId, (p) => ({
      ...p,
      userlikeit: prevLiked,
      like_count: prevCount,
      likePending: false,
    }));
    return { result: "fail", reason: "api_fail" };
  } catch {
    updateOnePost(postId, (p) => ({
      ...p,
      userlikeit: prevLiked,
      like_count: prevCount,
      likePending: false,
    }));
    return { result: "fail", reason: "exception" };
  } finally {
    _likeLocks.delete(postId);
  }
}

export function login_PostPage_Leave() {
  patchState({ showing: false });
}

export function login_PostPage_ResetCache() {
  _nextDetailJobVersion();
  state = {
    recommendedPosts: [],
    renderedCount: 0,
    loading: false,
    initialized: false,
    loadFailed: false,
    visiblePostIds: [],
    showing: false,
    endReached: false,
  };
  syncLoginPostState();
}

export async function login_PostPage_ReInitAll() {
  const wasShowing = !!state.showing;
  if (wasShowing && typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
  login_PostPage_ResetCache();
  if (wasShowing) {
    patchState({ showing: true });
    await initializeIfNeeded();
  }
}
