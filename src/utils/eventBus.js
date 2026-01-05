const listeners = {}; // 確保有全域存放

export const eventBus = {
  on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  },
  off(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  },
  emit(event, ...args) {   // ✅ 支援多參數
    if (!listeners[event]) return;
    listeners[event].forEach(cb => cb(...args)); // ✅ 展開傳入
  }
};


