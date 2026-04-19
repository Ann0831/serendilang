export const DEFAULT_AVATAR_URL = "/src/assets/images/defaultAvatar.svg";

const LEGACY_DEFAULT_AVATAR_PATHS = new Set([
  "/assets/images/defaultAvatar.svg",
  "assets/images/defaultAvatar.svg",
  `${import.meta.env.BASE_URL}assets/images/defaultAvatar.svg`,
  "/sourcecode/assets/images/defaultAvatar.svg",
  DEFAULT_AVATAR_URL,
]);

export function normalizeAvatarUrl(input) {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return DEFAULT_AVATAR_URL;

  if (LEGACY_DEFAULT_AVATAR_PATHS.has(raw)) {
    return DEFAULT_AVATAR_URL;
  }

  return raw;
}
