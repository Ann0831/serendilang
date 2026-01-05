import {isWssReady} from "/wss/wssCenter.js";
import {eventBus} from "/utils/eventBus.js";
import {initNavigator} from "/route/navigator.js";
import {registerEventHandlers} from "/event/eventHandlers.js";
import {initializeEmitEvent} from "/event/eventEmitter.js";


initNavigator();
registerEventHandlers();
initializeEmitEvent();

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    console.log("📄 頁面回到可見狀態，嘗試重連");
    if (!isWssReady()) {
      eventBus.emit("wssDisconnected", {});
    }
  }
});

