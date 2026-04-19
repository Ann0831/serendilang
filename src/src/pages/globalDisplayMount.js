import React from "react";
import { createRoot } from "react-dom/client";

const mounts = new Map();

function ensureGlobalDisplayHost() {
  if (typeof document === "undefined") return null;

  let host = document.getElementById("global_display");
  if (!host) {
    host = document.createElement("div");
    host.id = "global_display";
    document.body.appendChild(host);
  }

  host.classList.add("fixed", "inset-0", "z-[70]", "pointer-events-none");
  return host;
}

export function mountToGlobalDisplay(key, element) {
  const host = ensureGlobalDisplayHost();
  if (!host) return;

  if (mounts.has(key)) {
    const prev = mounts.get(key);
    prev.root.render(element);
    return;
  }

  const slot = document.createElement("div");
  slot.dataset.mountKey = key;
  slot.className = "pointer-events-auto";
  host.appendChild(slot);

  const root = createRoot(slot);
  root.render(element);
  mounts.set(key, { root, slot });
}

export function unmountFromGlobalDisplay(key) {
  const rec = mounts.get(key);
  if (!rec) return;

  rec.root.unmount();
  rec.slot.remove();
  mounts.delete(key);
}

export function isMountedInGlobalDisplay(key) {
  return mounts.has(key);
}

export function remountInGlobalDisplay(key, factory) {
  if (!isMountedInGlobalDisplay(key)) return;
  const rec = mounts.get(key);
  rec.root.render(factory());
}

export function clearGlobalDisplay() {
  for (const key of mounts.keys()) {
    unmountFromGlobalDisplay(key);
  }
}

export function createGlobalElement(type, props, ...children) {
  return React.createElement(type, props, ...children);
}
