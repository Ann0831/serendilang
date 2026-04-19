import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState, Empty } from "../StateViewBase.jsx";
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

function PostCardSkeleton({ postId }) {
  return (
    <article key={String(postId)} className="w-full rounded-2xl shadow p-4 bg-white mb-6 border border-gray-200 animate-pulse" data-post-id={postId}>
      <div className="flex items-center mb-2 space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full border border-gray-200" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="ml-auto w-6 h-6 bg-gray-200 rounded" />
      </div>
      <div className="h-3 w-44 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-40 bg-gray-200 rounded mb-3" />
      <div className="space-y-2 mb-3">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
      </div>
      <div className="w-full aspect-[1.3/1] rounded-lg border bg-gray-100 mb-2" />
      <div className="h-5 w-16 bg-gray-200 rounded" />
    </article>
  );
}

function PostCard({ postId, detail, isLogin }) {
  if (!detail) return <PostCardSkeleton postId={postId} />;
  const menuId = `mainPage-menu-${postId}`;

  return (
    <article key={String(postId)} className="w-full rounded-2xl shadow p-4 bg-white mb-6 border border-gray-200" data-post-id={postId}>
      <div className="flex items-center mb-2 space-x-3">
        <div className="relative w-10 h-10">
          <AvatarImage
            src={toAvatarSrc(detail.profilePicture_url)}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover border border-gray-300"
          />
        </div>
        <h2 className="font-bold text-lg flex-1 truncate">{detail.author_name || "Unknown"}</h2>
        <div className="ml-auto relative flex items-center space-x-2">
          <button
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition flex items-center justify-center"
            onClick={() => {
              if (!isLogin) {
                window.location.assign("/login");
                return;
              }
              eventBus.emit("openChatRoom", {
                user_id: detail.author_id,
                post_id: postId,
                from: "ui/userProfile/post-message",
              });
            }}
          >
            <i className="ti ti-message-circle text-xl md:text-2xl"></i>
          </button>
          <button
            data-main-post-menu-toggle="true"
            className="text-gray-400 px-2 py-1 rounded hover:bg-gray-100 transition"
            onClick={() => {
              if (!isLogin) {
                window.location.assign("/login");
                return;
              }
              eventBus.emit("togglePostMenu", { menuId, from: "ui/userProfile/post-menu" });
            }}
          >
            ⋯
          </button>
          <div id={menuId} className="absolute right-0 top-10 z-20 hidden min-w-[10rem] rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            <button
              type="button"
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
              onClick={() => eventBus.emit("openReportPostModal", { post_id: postId, from: "ui/userProfile/post-report" })}
            >
              Report Post
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Native: {formatLanguageName(detail?.userLang?.nativelanguage, "?")} | Target: {formatLanguageName(detail?.userLang?.targetlanguage, "?")}
      </div>
      <span className="text-xs text-gray-400 block pb-3 pt-1">{formatPostCardDateTime(detail?.created_at)}</span>
      <p className="text-base mb-2">{detail?.content || ""}</p>

      {detail?.image_url ? <PostImageFrame src={detail.image_url} alt="Post" /> : null}

      <div className="flex items-center mt-2 gap-1">
        <span className={detail?.userlikeit ? "text-red-500" : "text-gray-500"}>
          <i className={detail?.userlikeit ? "ti ti-heart-filled text-2xl leading-none" : "ti ti-heart text-2xl leading-none"}></i>
        </span>
        <span className={detail?.userlikeit ? "like-count h-8 inline-flex items-center text-left text-sm text-red-500" : "like-count h-8 inline-flex items-center text-left text-sm"}>
          {Number(detail?.like_count || 0)}
        </span>
      </div>
    </article>
  );
}

function resolveFriendButtonClass(style) {
  if (style === "success") {
    return "px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-70 disabled:cursor-not-allowed";
  }
  if (style === "muted") {
    return "px-4 py-2 rounded-md bg-gray-400 text-white transition disabled:opacity-80 disabled:cursor-not-allowed";
  }
  return "px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-70 disabled:cursor-not-allowed";
}

export default function UserProfilePage() {
  const s = useSubscribedState("UserProfilePage", {});
  const topBar = useSubscribedState("TopBar", {});
  const onlineIds = useOnlineUsersSet();

  const targetId = String(s.currentUserPageId || "");
  const profileLoading = !!s.profileLoading;
  const profile = s.profile || {};
  const friendAction = profile?.friendAction || {
    label: "Add Friend",
    disabled: false,
    eventName: null,
    eventParameter: { target_id: targetId },
    style: "primary",
  };

  const postIds = Array.isArray(s.visiblePostIds) ? s.visiblePostIds : [];
  const postDetailsById = s.postDetailsById || {};
  const isOnline = onlineIds.has(String(targetId));
  const showSidebar = true;
  const viewerName = String(topBar?.username || "You");
  const viewerAvatar = toAvatarSrc(topBar?.profileUrl);

  return (
    <section id="UserProfilePage" className="w-full min-h-screen bg-gray-50 text-gray-900 pt-16">
      {showSidebar ? (
        <aside
          id="userprofile-side-menu"
          className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 border-r border-gray-200 bg-gray-100 z-30 flex-col p-4"
        >
          {s?.isLogin ? (
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <AvatarImage src={viewerAvatar} alt="self avatar" className="w-10 h-10 rounded-full object-cover border border-gray-300" />
              <span className="font-semibold text-gray-800 truncate">{viewerName}</span>
            </div>
          ) : (
            <a
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition font-medium"
            >
              Register / Login
            </a>
          )}
          <a
            href="/"
            className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            <i className="ti ti-arrow-left text-base"></i>
            <span>Back to Home</span>
          </a>
        </aside>
      ) : null}

      <div className={`${showSidebar ? "lg:pl-64" : ""} p-6`}>
        <div className="max-w-3xl mx-auto space-y-8">
        <div id="userprofilepage-userinfo" data-user-id={targetId} className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-3 border border-gray-200">
          {profileLoading ? (
            <div className="w-full flex flex-col items-center gap-3 animate-pulse">
              <div className="w-28 h-28 rounded-full bg-gray-200 border border-gray-200" />
              <div className="h-7 w-40 rounded bg-gray-200" />
              <div className="h-4 w-56 rounded bg-gray-200" />
              <div className="h-4 w-56 rounded bg-gray-200" />
              <div className="flex gap-3 mt-4">
                <div className="h-10 w-28 rounded-md bg-gray-200" />
                <div className="h-10 w-24 rounded-md bg-gray-200" />
              </div>
            </div>
          ) : (
            <>
              <div className="relative w-28 h-28 rounded-full overflow-hidden">
                <AvatarImage id="userprofilepage-profile-pic" src={toAvatarSrc(profile?.profile_picture_url)} className="w-full h-full object-cover" alt="User Avatar" />
                {isOnline ? <span className="absolute right-2 bottom-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white" /> : null}
              </div>

              <h2 id="userprofilepage-username" className="text-2xl font-semibold">
                <span id="userprofilepage-username-text">{profile?.username || "Loading..."}</span>
              </h2>

              <div id="userprofilepage-nativelanguage" className="text-sm text-gray-600">
                <span id="userprofilepage-nativelanguage-text">Native Language: {formatLanguageName(profile?.nativelanguage, "?")}</span>
              </div>
              <div id="userprofilepage-targetlanguage" className="text-sm text-gray-600">
                <span id="userprofilepage-targetlanguage-text">Target Language: {formatLanguageName(profile?.targetlanguage, "?")}</span>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  id="userprofilepage-addfriend-btn"
                  className={resolveFriendButtonClass(friendAction?.style)}
                  disabled={!!friendAction?.disabled}
                  onClick={() => {
                    if (!s?.isLogin) {
                      window.location.assign("/login");
                      return;
                    }
                    if (!friendAction?.eventName) return;
                    eventBus.emit(friendAction.eventName, friendAction.eventParameter || { target_id: targetId, from: "ui/userProfile/addfriend" });
                  }}
                >
                  {friendAction?.label || "Add Friend"}
                </button>
                <button
                  id="userprofilepage-message-btn"
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition"
                  onClick={() => {
                    if (!s?.isLogin) {
                      window.location.assign("/login");
                      return;
                    }
                    eventBus.emit("openChatRoom", { user_id: targetId, from: "ui/userProfile/message" });
                  }}
                >
                  Message
                </button>
              </div>
            </>
          )}
        </div>

        <div id="userprofilepage-posts" className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Posts</h3>
          <div id="userprofilepage-posts-container" className="space-y-4">
            {postIds.length === 0 && !s?.loadingUserProfilePostsLock ? <Empty text="No posts" /> : null}
            {postIds.map((postId) => {
              const detail = postDetailsById?.[postId]?.data || null;
              const status = postDetailsById?.[postId]?.status;
              if (!detail || status === "loading") {
                return <PostCardSkeleton key={String(postId)} postId={postId} />;
              }
              return <PostCard key={String(postId)} postId={postId} detail={detail} isLogin={!!s?.isLogin} />;
            })}
          </div>

          {s?.loadingUserProfilePostsLock ? (
            <div className="flex items-center justify-center mt-4" id="userprofilepage_loading_spinner_Container">
              <div id="userprofilepage_loading_spinner" className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : null}
        </div>
        </div>
      </div>
    </section>
  );
}
