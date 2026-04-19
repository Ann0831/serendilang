import { validlanguage } from "./validLanguage.js";

const languageRows = Array.isArray(validlanguage()?.languages) ? validlanguage().languages : [];
const byLower = new Map(
  languageRows
    .filter((x) => x && typeof x.name === "string")
    .map((x) => [String(x.lowercase || x.name).toLowerCase(), x.name]),
);
const byNameLower = new Map(
  languageRows
    .filter((x) => x && typeof x.name === "string")
    .map((x) => [x.name.toLowerCase(), x.name]),
);

const alias = {
  chinese: "chinese (mandarin)",
  mandarin: "chinese (mandarin)",
  "chinese mandarin": "chinese (mandarin)",
};

export function formatLanguageName(value, fallback = "?") {
  const raw = typeof value === "string" ? value.trim() : String(value || "").trim();
  if (!raw) return fallback;
  const lowerRaw = raw.toLowerCase();
  const normalized = alias[lowerRaw] || lowerRaw;
  if (byLower.has(normalized)) return byLower.get(normalized);
  if (byNameLower.has(normalized)) return byNameLower.get(normalized);

  for (const [k, v] of byNameLower.entries()) {
    if (k.includes(normalized) || normalized.includes(k)) return v;
  }
  return raw;
}

