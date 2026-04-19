// /utils/soundPlayer.js

class SoundPlayer {
  constructor() {
    this.cache = new Map();         // 快取載入的 Audio()
    this.activeLoops = new Map();   // { url: { audio, timeoutId } }
    this.MAX_LOOP_DURATION = 20000; // 20 秒
  }

  preload(url) {
    if (this.cache.has(url)) return;
    const audio = new Audio(url);
    audio.preload = "auto";
    this.cache.set(url, audio);
  }

  /** 一次播放（非 loop） */
  play(url, volume = 1.0) {
    if (!this.cache.has(url)) this.preload(url);

    const base = this.cache.get(url);
    const sound = base.cloneNode(true);

    sound.volume = volume;
    sound.play().catch(err =>
      console.warn("[SoundPlayer] play failed:", err)
    );

    return sound;
  }

  /** 開始循環播放，最多 30 秒 */
  loop(url, volume = 1.0) {
    // 若已經在播放 loop，就不重複啟動
    if (this.activeLoops.has(url)) return;

    if (!this.cache.has(url)) this.preload(url);

    const base = this.cache.get(url);
    const sound = base.cloneNode(true);

    sound.volume = volume;
    sound.loop = true;

    sound.play().catch(err =>
      console.warn("[SoundPlayer] loop play failed:", err)
    );

    // 30 秒後自動停止
    const timeoutId = setTimeout(() => {
      this.stop(url);
    }, this.MAX_LOOP_DURATION);

    // 保存 loop 狀態
    this.activeLoops.set(url, { audio: sound, timeoutId });
  }

  /** 停止某個 loop */
  stop(url) {
    const entry = this.activeLoops.get(url);
    if (!entry) return;

    const { audio, timeoutId } = entry;

    audio.pause();
    audio.currentTime = 0;

    clearTimeout(timeoutId);
    this.activeLoops.delete(url);
  }

  /** 停止所有 loop */
  stopAll() {
    for (const [url, entry] of this.activeLoops.entries()) {
      const { audio, timeoutId } = entry;
      audio.pause();
      audio.currentTime = 0;
      clearTimeout(timeoutId);
    }
    this.activeLoops.clear();
  }
}

export const soundPlayer = new SoundPlayer();


