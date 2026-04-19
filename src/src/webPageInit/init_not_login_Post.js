import "../css/index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { initialize as initNotLoginPosts } from "../pages/not_login_PostPage.js";
import NotLoginPostPage from "../ui/pages/NotLoginPostPage.jsx";

let notLoginPostRoot = null;

export async function initNotLoginPostPage() {
  const host = document.getElementById("postsContainer");
  if (host) {
    if (!notLoginPostRoot) {
      notLoginPostRoot = createRoot(host);
    }
    notLoginPostRoot.render(React.createElement(NotLoginPostPage));
  }
  await initNotLoginPosts();
}
