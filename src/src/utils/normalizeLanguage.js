export function normalizeLanguage(source = {}) {
  console.log("normalizeLanguage: source: ", source);

  const lang =
    source?.language && typeof source.language === "object"
      ? source.language
      : {};

  const pickFirstValid = (...values) => {
    for (const v of values) {
      if (
        v !== undefined &&
        v !== null &&
        v !== "?" &&
        v !== ""
      ) {
        return v;
      }
    }
    return "?";
  };

  const returnValue = {
    nativelanguage: pickFirstValid(
      source?.nativelanguage,
      source?.native_language,
      source?.nativeLanguage,
      lang?.nativelanguage,
      lang?.native_language,
      lang?.nativeLanguage
    ),
    targetlanguage: pickFirstValid(
      source?.targetlanguage,
      source?.target_language,
      source?.targetLanguage,
      lang?.targetlanguage,
      lang?.target_language,
      lang?.targetLanguage
    ),
  };

  console.log("normalizeLanguage: return:", returnValue);

  return returnValue;
}
