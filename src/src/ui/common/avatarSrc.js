export const UI_DEFAULT_AVATAR_SRC = "/src/assets/images/defaultAvatar.svg";

const LEGACY_DEFAULT_AVATAR_SET = new Set([
  "/assets/images/defaultAvatar.svg",
  "assets/images/defaultAvatar.svg",
  `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
  "/sourcecode/assets/images/defaultAvatar.svg",
  UI_DEFAULT_AVATAR_SRC,
]);

const ILLEGAL_SRC_PATTERNS = [
  /^javascript\s*:/i,
  /^vbscript\s*:/i,
  /^file\s*:/i,
  /^data\s*:\s*text\/html/i,
  /^data\s*:\s*application\//i,
  /[\u0000-\u001F\u007F]/,
  /[<>"'`]/,
];

function isIllegalAvatarSrc(raw) {
  const value = String(raw || "").trim();
  if (!value) return false;
  return ILLEGAL_SRC_PATTERNS.some((pattern) => pattern.test(value));
}

export function toAvatarSrc(input) {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return UI_DEFAULT_AVATAR_SRC;
  if (LEGACY_DEFAULT_AVATAR_SET.has(raw)) return UI_DEFAULT_AVATAR_SRC;
  if (isIllegalAvatarSrc(raw)) return UI_DEFAULT_AVATAR_SRC;
  return raw;
}
