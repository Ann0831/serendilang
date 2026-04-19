import React, { useEffect, useState } from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState } from "../StateViewBase.jsx";
import faviconImage from "../../assets/images/favicon.png";
import { toAvatarSrc, UI_DEFAULT_AVATAR_SRC } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";

function getTopBarLocale() {
  if (typeof navigator !== "undefined" && typeof navigator.language === "string") {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("zh")) return "zh";
  }
  return "en";
}

const TOPBAR_TEXT = {
  en: {
    openNavMenu: "Open navigation menu",
    openAccountMenu: "Open account menu",
    about: "About",
    terms: "Terms",
    privacy: "Privacy",
    contact: "Contact",
    registerLogin: "Register / Login",
    logout: "Logout",
    logoutAll: "Logout All",
    logoAlt: "Serendilang logo",
    userAvatarAlt: "User avatar",
    loading: "Loading...",
  },
  zh: {
    openNavMenu: "開啟導覽選單",
    openAccountMenu: "開啟帳號選單",
    about: "關於",
    terms: "條款",
    privacy: "隱私",
    contact: "聯絡",
    registerLogin: "註冊 / 登入",
    logout: "登出",
    logoutAll: "全部裝置登出",
    logoAlt: "Serendilang 標誌",
    userAvatarAlt: "使用者頭像",
    loading: "載入中...",
  },
};

export default function TopBar() {
  const [ready, setReady] = useState(false);
  const [docMenuOpen, setDocMenuOpen] = useState(false);
  const text = TOPBAR_TEXT[getTopBarLocale()] || TOPBAR_TEXT.en;
  const s = useSubscribedState("TopBar", {
    menuOpen: false,
    loading: false,
    isLoggedIn: false,
    username: "",
    profileUrl: "",
  });

  const menuClass = s.menuOpen
    ? "absolute right-0 top-14 w-48 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 shadow-xl py-2 text-sm font-medium divide-y divide-gray-100 transform transition-all duration-300 ease-out origin-top-right opacity-100 scale-100 visible pointer-events-auto"
    : "absolute right-0 top-14 w-48 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 shadow-xl py-2 text-sm font-medium divide-y divide-gray-100 transform transition-all duration-300 ease-out origin-top-right opacity-0 scale-95 invisible pointer-events-none";
  const avatarUrl = toAvatarSrc(s.profileUrl || UI_DEFAULT_AVATAR_SRC);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      setReady(true);
    });
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (!docMenuOpen) return;
    const onDocClick = (event) => {
      const toggle = document.getElementById("topBar-nav-menuToggle");
      const menu = document.getElementById("topBar-nav-menuLinks");
      if (!toggle || !menu) return;
      if (toggle.contains(event.target) || menu.contains(event.target)) return;
      setDocMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [docMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 w-full h-16 bg-white text-gray-900 flex items-center justify-between px-4 md:px-8 shadow-md z-50 transition-all duration-700 ease-out ${
        ready ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <a href="/" className="flex items-center space-x-2 hover:text-indigo-700 transition">
        <img src={faviconImage} alt={text.logoAlt} className="w-8 h-8 rounded-md object-contain" />
        <span className="text-xl font-semibold italic">Serendilang</span>
      </a>

      <div className="flex items-center space-x-4 relative">
        <div className="relative">
          <button
            id="topBar-nav-menuToggle"
            className="text-2xl focus:outline-none"
            aria-label={text.openNavMenu}
            onClick={() => setDocMenuOpen((v) => !v)}
          >
            ☰
          </button>

          <div
            id="topBar-nav-menuLinks"
            className={docMenuOpen
              ? "absolute right-0 top-14 w-48 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 shadow-xl py-2 text-sm font-medium divide-y divide-gray-100 transform transition-all duration-300 ease-out origin-top-right opacity-100 scale-100 visible pointer-events-auto"
              : "absolute right-0 top-14 w-48 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 shadow-xl py-2 text-sm font-medium divide-y divide-gray-100 transform transition-all duration-300 ease-out origin-top-right opacity-0 scale-95 invisible pointer-events-none"}
          >
            <a href="/about" className="block px-5 py-2.5 hover:bg-gray-100 hover:text-gray-900 transition">{text.about}</a>
            <a href="/terms" className="block px-5 py-2.5 hover:bg-gray-100 hover:text-gray-900 transition">{text.terms}</a>
            <a href="/privacy" className="block px-5 py-2.5 hover:bg-gray-100 hover:text-gray-900 transition">{text.privacy}</a>
            <a href="/contact" className="block px-5 py-2.5 hover:bg-gray-100 hover:text-gray-900 transition">{text.contact}</a>
          </div>
        </div>

        {!s.isLoggedIn ? (
          <div className="ml-1" id="topBar-self-profile-zone">
            <a href="/login" className="border border-gray-300 text-gray-800 rounded px-4 py-1 text-sm hover:bg-gray-100 transition">
              {text.registerLogin}
            </a>
          </div>
        ) : (
          <div className="relative">
            <button
              id="topBar-doc-menuToggle"
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-gray-100 pr-3 pl-1 py-1 hover:bg-gray-200 transition"
              aria-label={text.openAccountMenu}
              onClick={() => eventBus.emit("toggleLogout", { from: "ui/topbar/menu-account" })}
            >
              <span className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 bg-white flex items-center justify-center">
                <AvatarImage src={avatarUrl} alt={text.userAvatarAlt} className="w-full h-full object-cover" />
              </span>
              <i className={`ti ${s.menuOpen ? "ti-chevron-up" : "ti-chevron-down"} text-sm text-gray-700`}></i>
            </button>

            <div id="topBar-doc-menuLinks" className={menuClass}>
              <button
                type="button"
                className="block w-full text-left px-5 py-2.5 hover:bg-gray-100 hover:text-gray-900 transition"
                onClick={() => eventBus.emit("executeLogout", { from: "ui/topbar/logout" })}
              >
                {text.logout}
              </button>
              <button
                type="button"
                className="block w-full text-left px-5 py-2.5 hover:bg-gray-100 hover:text-gray-900 transition"
                onClick={() => eventBus.emit("executeLogoutAll", { from: "ui/topbar/logout-all" })}
              >
                {text.logoutAll}
              </button>
            </div>
          </div>
        )}
      </div>

      <div id="full-header-dropdown" className="hidden" aria-hidden="true"></div>
      <img id="full-header-avatar" className="hidden" alt="" />
      <span id="full-header-username" className="hidden">{s.loading ? text.loading : s.username || ""}</span>
    </header>
  );
}
