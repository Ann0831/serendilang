export const POST_IMAGE_MIN_HEIGHT_WIDTH_RATIO = 0.75;
export const POST_IMAGE_MAX_HEIGHT_WIDTH_RATIO = 1.1;

export function clampPostImageRatio(rawWidthHeightRatio) {
  if (!Number.isFinite(rawWidthHeightRatio) || rawWidthHeightRatio <= 0) return 1;

  const minWh = 1 / POST_IMAGE_MAX_HEIGHT_WIDTH_RATIO;
  const maxWh = 1 / POST_IMAGE_MIN_HEIGHT_WIDTH_RATIO;
  return Math.min(maxWh, Math.max(minWh, rawWidthHeightRatio));
}

