const ILLEGAL_TARGET_PATTERNS = [
  /[\u0000-\u001F\u007F]/,
  /[<>"'`]/,
];

const ILLEGAL_PROTOCOL_PATTERN = /^(?:javascript|vbscript|file|data)\s*:/i;

function normalizeInternalTarget(target) {
  const raw = String(target || "").trim();
  if (!raw) return null;
  if (ILLEGAL_PROTOCOL_PATTERN.test(raw)) return null;
  if (ILLEGAL_TARGET_PATTERNS.some((pattern) => pattern.test(raw))) return null;

  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!url.pathname.startsWith("/")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function safeNavigate(target, options = {}) {
  const replace = options?.replace === true;
  const normalizedTarget = normalizeInternalTarget(target);
  const normalizedFallback = normalizeInternalTarget(options?.fallback || "/") || "/";
  const next = normalizedTarget || normalizedFallback;

  if (replace) {
    window.location.replace(next);
  } else {
    window.location.assign(next);
  }
  return Boolean(normalizedTarget);
}

// Keep compatibility with the requested name spelling.
export const safeNaviagate = safeNavigate;
