function toValidDate(value) {
  if (!value && value !== 0) return null;
  const numeric = Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getBrowserLocale() {
  if (typeof navigator !== "undefined" && typeof navigator.language === "string" && navigator.language.trim()) {
    return navigator.language;
  }
  return undefined;
}

export function formatPostCardDateTime(value) {
  const date = toValidDate(value);
  if (!date) return "";
  try {
    return date.toLocaleString(getBrowserLocale());
  } catch {
    return date.toISOString();
  }
}

export function formatChatListDate(value) {
  const date = toValidDate(value);
  if (!date) return "";
  try {
    return date.toLocaleDateString(getBrowserLocale(), { month: "short", day: "numeric" });
  } catch {
    return date.toISOString();
  }
}

export function formatChatSeparatorDateTime(value) {
  const date = toValidDate(value);
  if (!date) return "";
  try {
    const nowYear = new Date().getFullYear();
    const msgYear = date.getFullYear();
    const withYear = msgYear !== nowYear;
    return date.toLocaleString(getBrowserLocale(), withYear
      ? {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  } catch {
    return date.toISOString();
  }
}
