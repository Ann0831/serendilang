import React from "react";
import { createRoot } from "react-dom/client";
import DocSideBar from "../ui/pages/DocSideBar.jsx";

let docSideBarRoot = null;

function ensureMountNode() {
  if (typeof document === "undefined") return null;
  let host = document.getElementById("doc-side-menu-root");
  if (!host) {
    host = document.createElement("div");
    host.id = "doc-side-menu-root";
    document.body.prepend(host);
  }
  return host;
}

export function initDocSideBar() {
  const host = ensureMountNode();
  if (!host) return;
  if (!docSideBarRoot) docSideBarRoot = createRoot(host);
  docSideBarRoot.render(React.createElement(DocSideBar));
}
