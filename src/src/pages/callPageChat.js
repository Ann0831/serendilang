function readCallPageContext() {
  const ctx = window.__CALL_PAGE_CONTEXT__ || {};
  const targetId = String(ctx?.targetId || window.__TARGET_USER_ID__ || "").trim();
  const isApp = !!ctx?.isApp;
  return {
    targetId,
    isApp,
    enabled: !!targetId && !isApp,
  };
}

export function getCallPageChatContext() {
  return readCallPageContext();
}

export function isCallPageChatEnabled() {
  return readCallPageContext().enabled;
}

export function isCallPageChatTarget(userId) {
  const id = String(userId || "").trim();
  if (!id) return false;
  const { targetId, enabled } = readCallPageContext();
  return enabled && id === targetId;
}
