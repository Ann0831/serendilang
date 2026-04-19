import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState } from "../StateViewBase.jsx";
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
    <article key={String(postId)} className="w-[90%] mx-auto rounded-2xl shadow p-4 bg-white mb-6 border border-gray-200 animate-pulse" data-post-id={postId}>
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

function UserSelfPostCard({ detail, postId, isOnline }) {
  if (!detail) return <PostCardSkeleton postId={postId} />;
  const liked = !!detail.userlikeit;
  const likePending = !!detail.likePending;
  const menuId = `SelfPage-menu-${postId}`;
  return (
    <article key={String(postId)} className="w-[90%] mx-auto rounded-2xl shadow p-4 bg-white mb-6 border border-gray-200" data-post-id={postId}>
      <div className="flex items-center mb-2 space-x-3">
        <div className="relative w-10 h-10">
          <AvatarImage
            src={toAvatarSrc(detail.profilePicture_url)}
            alt="avatar"
            className="w-10 h-10 rounded-full cursor-pointer object-cover border border-gray-300"
            onClick={() => eventBus.emit("openUserPage", { author_id: detail.author_id, post_id: postId, from: "ui/userSelf/avatar" })}
          />
          {isOnline ? <span className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border border-white"></span> : null}
        </div>
        <h2
          className="font-bold text-lg flex-1 cursor-pointer truncate"
          onClick={() => eventBus.emit("openUserPage", { author_id: detail.author_id, post_id: postId, from: "ui/userSelf/author" })}
        >
          {detail.author_name || "Unknown"}
        </h2>
        <div className="ml-auto relative">
          <button
            data-self-post-menu-toggle="true"
            className="text-gray-400 px-2 py-1 rounded hover:bg-gray-100 transition"
            onClick={() => eventBus.emit("toggleSelfPostMenu", { post_id: postId, menuId, from: "ui/userSelf/postMenuToggle" })}
          >
            ⋯
          </button>
          <div id={menuId} className="absolute z-10 right-0 mt-2 hidden bg-white rounded shadow border p-2">
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              onClick={() => eventBus.emit("openDeletePostModal", { post_id: postId, from: "ui/userSelf/postMenuDelete" })}
            >
              Delete Post
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        {detail?.userLang?.nativelanguage ? `Native Language: ${formatLanguageName(detail.userLang.nativelanguage, "?")}` : ""}
        {detail?.userLang?.targetlanguage ? ` | Target Language: ${formatLanguageName(detail.userLang.targetlanguage, "?")}` : ""}
      </div>

      <span className="text-xs text-gray-400 block pb-3 pt-1">{formatPostCardDateTime(detail.created_at)}</span>
      <p className="text-base mb-2">{detail.content || ""}</p>

      {detail.image_url ? (
        <PostImageFrame src={detail.image_url} alt="Post" />
      ) : null}

      <div className="flex items-center mt-2 gap-1">
        <button
          className={liked
            ? `heart-icon w-8 h-8 cursor-pointer text-red-500 ${likePending ? "opacity-60" : ""}`
            : `heart-icon w-8 h-8 cursor-pointer ${likePending ? "opacity-60" : ""}`}
          onClick={() => eventBus.emit("like_or_unlike", { post_id: postId, from: "ui/userSelf/like" })}
          aria-label={liked ? "Unlike" : "Like"}
          title={liked ? "Unlike" : "Like"}
        >
          <i className={liked ? "ti ti-heart-filled text-2xl leading-none" : "ti ti-heart text-2xl leading-none"}></i>
        </button>
        <span className={liked ? "like-count h-8 inline-flex items-center justify-start text-left text-sm text-red-500" : "like-count h-8 inline-flex items-center justify-start text-left text-sm"}>
          {typeof detail.like_count === "number" ? detail.like_count : Number(detail.like_count || 0)}
        </span>
      </div>
    </article>
  );
}

function EditLanguageModal({ state }) {
  if (!state?.open) return null;
  const submitting = !!state?.submitting;
  const result = state?.result || "";
  const options = (Array.isArray(state?.options) ? state.options : [])
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && typeof item.name === "string") return item.name;
      return "";
    })
    .filter(Boolean);

  const close = () => {
    if (submitting) return;
    eventBus.emit("closeEditLanguageModal", { from: "ui/editLanguage/close" });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[90]" onClick={close}>
      <div className="bg-white w-[92%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-indigo-700">Edit Language</h2>
        <div className="flex flex-col gap-3">
          <label className="text-sm text-gray-700">
            Native language
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={state?.currentNative || ""}
              disabled={submitting}
              onChange={(e) => eventBus.emit("editLanguageModalInput", { field: "currentNative", value: e.target.value, from: "ui/editLanguage/native" })}
            >
              <option value="">Select language</option>
              {options.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-700">
            Target language
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={state?.currentTarget || ""}
              disabled={submitting}
              onChange={(e) => eventBus.emit("editLanguageModalInput", { field: "currentTarget", value: e.target.value, from: "ui/editLanguage/target" })}
            >
              <option value="">Select language</option>
              {options.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </label>
        </div>
        {submitting ? <div className="flex justify-center"><span className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" /></div> : null}
        {!submitting && result === "success" ? <p className="text-green-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-check"></i><span>Updated successfully</span></p> : null}
        {!submitting && result === "fail" ? <p className="text-red-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-x"></i><span>Update failed</span></p> : null}
        {(result === "success" || result === "fail") ? (
          <div className="flex justify-end">
            <button type="button" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition" onClick={close}>OK</button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition" disabled={submitting} onClick={close}>Cancel</button>
            <button type="button" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60" disabled={submitting || !(state?.currentNative || "").trim() || !(state?.currentTarget || "").trim()} onClick={() => eventBus.emit("submitEditLanguageModal", { from: "ui/editLanguage/submit" })}>Save</button>
          </div>
        )}
      </div>
    </div>
  );
}

function EditAvatarModal({ state, profilePicUrl }) {
  if (!state?.open) return null;
  const submitting = !!state?.submitting;
  const result = state?.result || "";
  const previewUrl = toAvatarSrc(state?.previewUrl || profilePicUrl);

  const close = () => {
    if (submitting) return;
    eventBus.emit("closeEditAvatarModal", { from: "ui/editAvatar/close" });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[90]" onClick={close}>
      <div className="bg-white w-[92%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-indigo-700">Edit Profile Picture</h2>
        <div className="flex justify-center">
          <AvatarImage src={previewUrl} alt="preview" className="w-28 h-28 rounded-full object-cover border border-gray-300" />
        </div>
        <label className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer">
          Select image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={submitting}
            onChange={(e) => {
              const file = e?.target?.files?.[0] || null;
              eventBus.emit("editAvatarModalSelectFile", { file, from: "ui/editAvatar/file" });
              e.target.value = "";
            }}
          />
        </label>
        {submitting ? <div className="flex justify-center"><span className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" /></div> : null}
        {!submitting && result === "success" ? <p className="text-green-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-check"></i><span>Updated successfully</span></p> : null}
        {!submitting && result === "fail" ? <p className="text-red-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-x"></i><span>Update failed</span></p> : null}
        {(result === "success" || result === "fail") ? (
          <div className="flex justify-end">
            <button type="button" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition" onClick={close}>OK</button>
          </div>
        ) : (
          <div className="flex justify-between gap-2">
            <button type="button" className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" disabled={submitting} onClick={() => eventBus.emit("submitDeleteAvatarModal", { from: "ui/editAvatar/delete" })}>Delete Avatar</button>
            <div className="flex gap-2">
              <button type="button" className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition" disabled={submitting} onClick={close}>Cancel</button>
              <button type="button" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60" disabled={submitting || !state?.file} onClick={() => eventBus.emit("submitEditAvatarModal", { from: "ui/editAvatar/submit" })}>Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditUsernameModal({ state }) {
  if (!state?.open) return null;
  const submitting = !!state?.submitting;
  const result = state?.result || "";
  const username = state?.currentUsername || "";

  const close = () => {
    if (submitting) return;
    eventBus.emit("closeEditUsernameModal", { from: "ui/editUsername/close" });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[90]" onClick={close}>
      <div className="bg-white w-[92%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-indigo-700">Edit Username</h2>
        {submitting ? (
          <div className="flex justify-center"><span className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" /></div>
        ) : result === "success" ? null : (
          <input
            type="text"
            value={username}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Enter username"
            onChange={(e) => eventBus.emit("editUsernameModalInput", { username: e.target.value, from: "ui/editUsername/input" })}
          />
        )}
        {!submitting && result === "success" ? <p className="text-green-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-check"></i><span>Updated successfully</span></p> : null}
        {!submitting && result === "fail" ? <p className="text-red-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-x"></i><span>Update failed</span></p> : null}
        {(result === "success" || result === "fail") ? (
          <div className="flex justify-end">
            <button type="button" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition" onClick={close}>OK</button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition" disabled={submitting} onClick={close}>Cancel</button>
            <button type="button" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60" disabled={submitting || !username.trim()} onClick={() => eventBus.emit("submitEditUsernameModal", { from: "ui/editUsername/submit" })}>Save</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserSelfPage() {
  const s = useSubscribedState("UserSelfPage", {});
  const onlineIds = useOnlineUsersSet();
  const profileLoading = !!s.profileLoading;
  const profile = s.profileState || {};
  const language = profile.language || {};
  const visiblePostIds = Array.isArray(s.visiblePostIds) ? s.visiblePostIds : [];
  const postDetailsById = s.postDetailsById || {};
  const editLanguageState = s?.modalState?.editLanguage || {};
  const editAvatarState = s?.modalState?.editAvatar || {};
  const editUsernameState = s?.modalState?.editUsername || {};

  return (
    <>
      <section id="UserSelfPage" className="w-full min-h-full p-6 pb-16 md:pb-0 block">
        <div className="max-w-3xl mx-auto space-y-8">
        <div id="userselfpage-userinfo" className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 border border-gray-200 relative pb-16">
          {profileLoading ? (
            <div className="w-full flex flex-col items-center gap-4 animate-pulse">
              <div className="w-full flex justify-end">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
              </div>
              <div className="w-28 h-28 rounded-full bg-gray-200 border border-gray-200" />
              <div className="h-7 w-40 rounded bg-gray-200" />
              <div className="space-y-2 flex flex-col items-center">
                <div className="h-4 w-56 rounded bg-gray-200" />
                <div className="h-4 w-56 rounded bg-gray-200" />
              </div>
            </div>
          ) : (
            <>
              <div className="absolute top-3 right-3">
                <button
                  id="userselfpage-more-btn"
                  data-userself-dropdown-toggle="true"
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                  onClick={() => eventBus.emit("toggle-userself-user-dropdown", { from: "userSelfPage" })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-gray-600">
                    <path d="M6.75 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm7.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm7.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"></path>
                  </svg>
                </button>
                <div id="userselfpage-user-dropdown" className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg hidden flex-col text-sm z-50">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                    onClick={() => eventBus.emit("openDeleteUserAccountModal", { from: "userSelfPage" })}
                  >
                    Delete Account
                  </button>
                </div>
              </div>

              <div className="w-full max-w-sm relative flex justify-center">
                <div className="relative w-28 h-28 rounded-full overflow-hidden">
                  <AvatarImage id="userselfpage-profile-pic" src={toAvatarSrc(profile.profilePicUrl)} className="w-full h-full object-cover" />
                  {onlineIds.has(String(profile?.user_id || profile?.userId || "")) ? (
                    <span className="absolute right-1 bottom-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
                  ) : null}
                </div>
                <button
                  id="userselfpage-edit-avatar-btn"
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center"
                  onClick={() => eventBus.emit("openEditAvatarModal", { from: "userSelfPage" })}
                  aria-label="Edit profile picture"
                  title="Edit profile picture"
                >
                  <i className="ti ti-camera text-lg"></i>
                </button>
              </div>

              <div className="w-full max-w-sm relative flex justify-center items-center">
                <h2 id="userselfpage-username" className="text-2xl font-semibold text-center">{profile.username || "Unknown User"}</h2>
                <button
                  id="userselfpage-edit-username-btn"
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition"
                  title="Edit username"
                  onClick={() => eventBus.emit("openEditUsernameModal", { currentUsername: profile.username || "", from: "userSelfPage" })}
                >
                  <i className="ti ti-pencil text-xl md:text-2xl"></i>
                </button>
              </div>

              <div className="w-full max-w-sm relative flex justify-center mt-1">
                <div className="min-w-0 text-center">
                  <div id="userselfpage-nativelanguage" className="text-sm text-gray-600">Native Language: {formatLanguageName(language.nativelanguage, "?")}</div>
                  <div id="userselfpage-targetlanguage" className="text-sm text-gray-600">Target Language: {formatLanguageName(language.targetlanguage, "?")}</div>
                </div>
                <button
                  id="userselfpage-edit-language-btn"
                  data-lang-info={JSON.stringify({
                    targetlanguage: language.targetlanguage || "",
                    nativelanguage: language.nativelanguage || "",
                  })}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition flex items-center justify-center text-gray-700"
                  onClick={() =>
                    eventBus.emit("openEditLangModal", {
                      nativelanguage: language.nativelanguage || "",
                      targetlanguage: language.targetlanguage || "",
                      from: "userSelfPage",
                    })
                  }
                  aria-label="Edit language"
                  title="Edit language"
                >
                  <i className="ti ti-language text-lg"></i>
                </button>
              </div>
            </>
          )}
        </div>

        <div id="userselfpage-posts" className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">My Posts</h3>
          <div id="userselfpage-posts-container" className="space-y-4">
            {visiblePostIds.map((postId) => {
              const detailState = postDetailsById?.[postId];
              if (!detailState || detailState.status === "loading") {
                return <PostCardSkeleton key={String(postId)} postId={postId} />;
              }
              if (detailState.status === "error") {
                return (
                  <article key={String(postId)} className="w-[90%] mx-auto rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4">
                    Failed to load post.
                  </article>
                );
              }
              return (
                <UserSelfPostCard
                  key={String(postId)}
                  postId={postId}
                  detail={detailState.data}
                  isOnline={onlineIds.has(String(detailState?.data?.author_id || ""))}
                />
              );
            })}
          </div>

          <div id="userselfpage_loading_spinner_Container" className={s.loadingUserSelfPostsLock ? "flex items-center justify-center mt-4" : "flex items-center justify-center hidden mt-4"}>
            <div id="userselfpage_loading_spinner" className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        </div>
        </div>
      </section>
      <EditLanguageModal state={editLanguageState} />
      <EditAvatarModal state={editAvatarState} profilePicUrl={profile.profilePicUrl} />
      <EditUsernameModal state={editUsernameState} />
    </>
  );
}
