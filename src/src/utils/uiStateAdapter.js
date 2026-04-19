// -----------------

/**
 * globalState: id -> state
 */
const globalState = Object.create(null);

/**
 * handlers: id -> Set<handler(state)>
 */
const handlers = new Map();

/**
 * 註冊 handler（一個 id 只能有一個）
 * @param {string} id
 * @param {(state:any)=>void} handler
 */
export function subscribe(id, handler) {
  if (!handlers.has(id)) {
    handlers.set(id, new Set());
  }
  handlers.get(id).add(handler);

  // 若該 id 已有 state，立刻同步一次（可選但推薦）
  if (id in globalState) {
    handler(globalState[id]);
  }

  return () => {
    const set = handlers.get(id);
    if (!set) return;

    set.delete(handler);
    if (set.size === 0) {
      handlers.delete(id);
    }
  };
}

/**
 * 更新某個 id 的 state
 * @param {string} id
 * @param {any | ((prev:any)=>any)} next
 */
export function updateState(id, next) {
  const prev = globalState[id];
  const value =
    typeof next === 'function'
      ? next(prev)
      : next;

  globalState[id] = value;

  const set = handlers.get(id);
  if (set && set.size > 0) {
    for (const handler of set) {
      handler(value);
    }
  }
}

/**
 * 讀取某個 id 的 state
 */
export function getState(id) {
  return globalState[id];
}
