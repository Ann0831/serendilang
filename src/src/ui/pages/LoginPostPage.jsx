import React, { useEffect, useRef } from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState, Empty } from "../StateViewBase.jsx";
import LoginPageHeader from "../common/LoginPageHeader.jsx";
import { useOnlineUsersSet } from "../common/useOnlineUsersSet.js";
import { formatLanguageName } from "../../utils/language/languageDisplay.js";
import { toAvatarSrc } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";
import { clampPostImageRatio } from "../../utils/postImageRatio.js";
import { formatPostCardDateTime } from "../../utils/dateTimeFormat.js";

function PostImageFrame({ src, alt }) {
  const [boxRatio, setBoxRatio] = React.useState(1.3);

  return (
    <div className="w-full overflow-hidden rounded-lg mb-2 border border-gray-200" style={{ aspectRatio: `${boxRatio} / 1` }}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-center"
        onLoad={(e) => {
          const w = e.currentTarget.naturalWidth || 0;
          const h = e.currentTarget.naturalHeight || 0;
          if (!w || !h) return;
          setBoxRatio(clampPostImageRatio(w / h));
        }}
      />
    </div>
  );
}

export default function LoginPostPage() {
  const s = useSubscribedState("LoginPostPage", {});
  const isZh = typeof navigator !== "undefined" && String(navigator.language || "").toLowerCase().startsWith("zh");
  const text = isZh
    ? {
        loadFailed: "貼文載入失敗",
        retry: "重試",
        noPosts: "目前沒有貼文",
      }
    : {
        loadFailed: "Failed to load posts.",
        retry: "Retry",
        noPosts: "No posts",
      };
  const onlineIds = useOnlineUsersSet();
  const list = Array.isArray(s.recommendedPosts) ? s.recommendedPosts : [];
  const visible = new Set(Array.isArray(s.visiblePostIds) ? s.visiblePostIds : []);
  const rows = list.filter((p) => visible.has(p?.post_id));
  const loading = !!s.loading;
  const initialized = !!s.initialized;
  const loadFailed = !!s.loadFailed;
  const showSkeleton = rows.length === 0 && (!initialized || loading);
  const showLoadFailed = rows.length === 0 && initialized && !loading && loadFailed;
  const showEmpty = rows.length === 0 && initialized && !loading && !loadFailed;
  const listRef = useRef(null);
  const lastEmitAtRef = useRef(0);

  const emitLoadMore = (from, showEndReachedNotice = false) => {
    const now = Date.now();
    if (now - lastEmitAtRef.current < 450) return;
    lastEmitAtRef.current = now;
    console.log("🧭 [debug] emit loginPostPageLoadMore", { from, loading, showEndReachedNotice });
    eventBus.emit("loginPostPageLoadMore", {
      isPreload: false,
      from: `${from}-bottom`,
      showEndReachedNotice: !!showEndReachedNotice,
    });
  };

  const checkNearBottom = (from) => {
    const listEl = listRef.current;
    const nearBottomInList = !!listEl &&
      listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 120;

    console.log("🧭 [debug] post scroll check", {
      from,
      loading,
      nearBottomInList,
      list: listEl
        ? {
            scrollTop: listEl.scrollTop,
            clientHeight: listEl.clientHeight,
            scrollHeight: listEl.scrollHeight,
          }
        : null,
    });

    if (nearBottomInList) {
      emitLoadMore(from, true);
    }
  };
  const onListScroll = (e) => {
    if (!e?.currentTarget) return;
    checkNearBottom("ui/post/list-scroll");
  };

  useEffect(() => {
    const onWindowScroll = () => {
      const doc = document.documentElement;
      const distanceToBottom = doc.scrollHeight - (window.innerHeight + window.scrollY);
      const nearBottomInWindow = distanceToBottom <= 120;
      const inPreloadWindow = distanceToBottom > 120 && distanceToBottom <= 1200;
      /*
      console.log("🧭 [debug] window scroll check", {
        scrollY: window.scrollY,
        innerHeight: window.innerHeight,
        docScrollHeight: doc.scrollHeight,
        distanceToBottom,
        nearBottomInWindow,
        inPreloadWindow,
      });
      */
      if (nearBottomInWindow) {
        emitLoadMore("ui/post/window-scroll", true);
      } else if (inPreloadWindow) {
        emitLoadMore("ui/post/window-preload", false);
      }
    };

    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
  }, []);

  return (
    <div className="flex h-full min-h-full flex-col">
      <LoginPageHeader title="Main Page" />
      <div ref={listRef} id="postpage-posts" onScroll={onListScroll} className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
        {showLoadFailed ? (
          <div className="w-[70%] min-w-0 mx-auto rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{text.loadFailed}</span>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                  onClick={() => eventBus.emit("loginPostPageLoadMore", { isPreload: false, from: "ui/post/retry", showEndReachedNotice: true })}
                >
                  {text.retry}
                </button>
            </div>
          </div>
        ) : null}
        {showEmpty ? <Empty text={text.noPosts} /> : null}
        {showSkeleton ? [0, 1, 2].map((n) => (
          <article key={`login-post-skeleton-${n}`} className="w-[70%] min-w-0 mx-auto rounded-2xl shadow p-4 bg-white mb-6 border border-gray-200">
            <div className="flex items-center mb-3 space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse border border-gray-200" />
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-3 w-44 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-40 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="space-y-2 mb-3">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-full aspect-[1.3/1] rounded-lg border bg-gray-100 animate-pulse mb-2" />
          </article>
        )) : null}
        {rows.map((p) => {
        const postId = p.post_id;
        const liked = !!p?.userlikeit;
        const likePending = !!p?.likePending;
        const detailReady = p?.detailStatus === "ready";
        const isOnline = onlineIds.has(String(p?.author_id || ""));
        return (
          <article key={postId} className="w-[70%] min-w-0 mx-auto rounded-2xl shadow p-4 bg-white mb-6 border border-gray-200">
            <div className="flex items-center mb-2 space-x-3">
              {detailReady ? (
                <a
                  href={`/user/${encodeURIComponent(String(p?.author_id || ""))}`}
                  className="flex items-center space-x-3 flex-1 min-w-0 hover:opacity-90 transition"
                >
                  <div className="relative w-10 h-10">
                    <AvatarImage src={toAvatarSrc(p?.profilePicture_url)} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-300" />
                    {isOnline ? <span className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border border-white"></span> : null}
                  </div>
                  <h2 className="font-bold text-lg flex-1 truncate">{p?.author_name || p?.author_id || "Unknown"}</h2>
                </a>
              ) : (
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse border border-gray-200" />
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              )}
              <div className="ml-auto relative flex items-center space-x-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition flex items-center justify-center"
                  onClick={() => eventBus.emit("openChatRoom", { user_id: p?.author_id, from: "ui/post/message", post_id: postId })}
                >
                  <i className="ti ti-message-circle text-xl md:text-2xl"></i>
                </button>
                <button
                  data-main-post-menu-toggle="true"
                  className="text-gray-400 px-2 py-1 rounded hover:bg-gray-100 transition"
                  onClick={() => eventBus.emit("togglePostMenu", { menuId: `mainPage-menu-${postId}`, from: "ui/post/menu-toggle" })}
                >
                  ⋯
                </button>
                <div
                  id={`mainPage-menu-${postId}`}
                  className="absolute right-0 top-10 z-20 hidden min-w-[10rem] rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
                >
                  <button
                    type="button"
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => eventBus.emit("openReportPostModal", { post_id: postId, from: "ui/post/menu-report" })}
                  >
                    Report Post
                  </button>
                </div>
              </div>
            </div>

            {detailReady ? (
              <div className="text-xs text-gray-500">
                {p?.userLang?.nativelanguage ? `Native: ${formatLanguageName(p.userLang.nativelanguage, "?")}` : ""}
                {p?.userLang?.targetlanguage ? ` | Target: ${formatLanguageName(p.userLang.targetlanguage, "?")}` : ""}
              </div>
            ) : (
              <div className="h-3 w-44 bg-gray-200 rounded animate-pulse" />
            )}

            {detailReady ? (
              <span className="text-xs text-gray-400 block pb-3 pt-1">{formatPostCardDateTime(p?.created_at)}</span>
            ) : (
              <div className="mt-1 h-3 w-40 bg-gray-200 rounded animate-pulse" />
            )}

            {detailReady ? (
              <p className="text-base mb-2">{p?.content || ""}</p>
            ) : (
              <div className="space-y-2 mb-3 mt-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
            )}

            {detailReady && p?.image_url ? (
              <PostImageFrame src={p.image_url} alt="Post" />
            ) : !detailReady ? (
              <div className="w-full aspect-[1.3/1] rounded-lg border bg-gray-100 animate-pulse mb-2" />
            ) : null}

            <div className="flex items-center mt-2 gap-1">
              <button
                className={liked
                  ? `heart-icon w-8 h-8 cursor-pointer text-red-500 ${likePending ? "opacity-60" : ""}`
                  : `heart-icon w-8 h-8 cursor-pointer ${likePending ? "opacity-60" : ""}`}
                onClick={() => eventBus.emit("like_or_unlike", { post_id: postId, from: "ui/post/like" })}
                aria-label={liked ? "Unlike" : "Like"}
                title={liked ? "Unlike" : "Like"}
              >
                <i className={liked ? "ti ti-heart-filled text-2xl leading-none" : "ti ti-heart text-2xl leading-none"}></i>
              </button>
              <span className={liked ? "like-count h-8 inline-flex items-center justify-start text-left text-sm text-red-500" : "like-count h-8 inline-flex items-center justify-start text-left text-sm"}>
                {typeof p?.like_count === "number" ? p.like_count : Number(p?.like_count || 0)}
              </span>
            </div>
          </article>
        );
      })}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <span className="h-8 w-8 rounded-full border-4 border-gray-300 border-t-indigo-600 animate-spin" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
