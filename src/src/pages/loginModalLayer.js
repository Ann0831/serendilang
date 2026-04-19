import React from "react";
import { createRoot } from "react-dom/client";
import LoginModalLayer from "../ui/pages/LoginModalLayer.jsx";
import { closeUnblockUserModal } from "./modalsMerged.js";

let modalRoot = null;

function ensureModalMountNode() {
  if (typeof document === "undefined") return null;

  let host = document.getElementById("login-modal-root");
  if (!host) {
    host = document.createElement("div");
    host.id = "login-modal-root";
    document.body.appendChild(host);
  }
  return host;
}

export function initLoginModalLayer() {
  const host = ensureModalMountNode();
  if (!host) return;

  if (!modalRoot) modalRoot = createRoot(host);
  modalRoot.render(
    React.createElement(LoginModalLayer, {
      onCloseUnblockUser: closeUnblockUserModal,
    })
  );
}
