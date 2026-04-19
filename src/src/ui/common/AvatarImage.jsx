import React from "react";
import { toAvatarSrc } from "./avatarSrc.js";

function isDefaultAvatarPath(url) {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw) return false;
  const clean = raw.split("#")[0].split("?")[0];
  return clean.endsWith("defaultAvatar.svg");
}

function DefaultAvatarSvg({ className = "", title = "avatar", ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      role="img"
      aria-label={title}
      {...rest}
    >
      <path
        fillRule="evenodd"
        d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function AvatarImage({ src, alt = "avatar", className = "", ...rest }) {
  const normalized = toAvatarSrc(src);
  if (isDefaultAvatarPath(normalized)) {
    return <DefaultAvatarSvg className={`${className} text-gray-400 bg-gray-100`} title={alt} {...rest} />;
  }
  return <img src={normalized} alt={alt} className={className} {...rest} />;
}
