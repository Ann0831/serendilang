let onlineUsersSnapshot = {
  list: [],
  updatedAt: 0,
};

const listeners = new Set();

function cloneList(list = []) {
  return (Array.isArray(list) ? list : []).map((item) => ({ ...(item || {}) }));
}

function normalizeOnlineUser(item) {
  if (!item || typeof item !== "object") return null;
  const userId = String(item.userId || item.user_id || item.id || "");
  if (!userId) return null;
  return {
    ...item,
    userId,
  };
}

function dedupeByUserId(list = []) {
  const seen = new Set();
  const result = [];
  for (const item of Array.isArray(list) ? list : []) {
    const id = String(item?.userId || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }
  return result;
}

function emitChange() {
  const snapshot = getOnlineUsersSnapshot();
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch {
      // ignore subscriber errors
    }
  });
}

export function setOnlineUsersToPool(list, updatedAt = Date.now()) {
  const normalized = (Array.isArray(list) ? list : [])
    .map(normalizeOnlineUser)
    .filter(Boolean);
  const deduped = dedupeByUserId(normalized);

  onlineUsersSnapshot = {
    list: cloneList(deduped),
    updatedAt: Number.isFinite(Number(updatedAt)) ? Number(updatedAt) : Date.now(),
  };

  emitChange();
  return getOnlineUsersSnapshot();
}

export function getOnlineUsersFromPool() {
  return cloneList(onlineUsersSnapshot.list);
}

export function getOnlineUsersSnapshot() {
  return {
    list: cloneList(onlineUsersSnapshot.list),
    updatedAt: onlineUsersSnapshot.updatedAt,
  };
}

export function isUserOnlineFromPool(userId) {
  const id = String(userId || "");
  if (!id) return false;
  return onlineUsersSnapshot.list.some((x) => String(x?.userId || "") === id);
}

export function subscribeOnlineUsersPool(handler) {
  if (typeof handler !== "function") return () => {};
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
}
