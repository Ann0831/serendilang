import React from "react";
import { useSubscribedState } from "../StateViewBase.jsx";
import { toAvatarSrc, UI_DEFAULT_AVATAR_SRC } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";

export default function DocSideBar() {
  const topBar = useSubscribedState("TopBar", {
    isLoggedIn: false,
    username: "",
    profileUrl: "",
  });

  const isLoggedIn = !!topBar?.isLoggedIn;
  const username = String(topBar?.username || "You");
  const profileUrl = toAvatarSrc(topBar?.profileUrl || UI_DEFAULT_AVATAR_SRC);

  return (
    <aside
      id="doc-side-menu"
      className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 border-r border-gray-200 bg-gray-100 z-30 flex-col p-4"
    >
      {isLoggedIn ? (
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50 border border-gray-200">
          <AvatarImage src={profileUrl} alt="self avatar" className="w-10 h-10 rounded-full object-cover border border-gray-300" />
          <span className="font-semibold text-gray-800 truncate">{username}</span>
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
  );
}
