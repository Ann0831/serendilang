export class CoolDownScheduler {
  constructor(fn, cooldownMs = 5000, expireMs = 6000) {
    this.fn = fn;
    this.cooldownMs = cooldownMs;
    this.expireMs = expireMs;

    this.lastRun = 0;
    this.lastCall = 0;
    this.running = false;
  }

  async loop() {
    this.running = true;
    while (true) {
      if (Date.now() - this.lastCall > this.expireMs) {
        console.log("超時未呼叫，自動停止");
        this.running = false;
        break;
      }

      if (Date.now() - this.lastRun >= this.cooldownMs) {
        this.lastRun = Date.now();
        try {
          this.fn();
        } catch (err) {
          console.error("任務錯誤:", err);
        }
      }

      await new Promise(r => setTimeout(r, 500)); // 每 500ms 檢查一次
    }
  }

  call() {
    this.lastCall = Date.now();
    if (!this.running) {
      this.loop();
    }
  }

  stop() {
    this.running = false;
  }

  isRunning() {
    return this.running;
  }
}
