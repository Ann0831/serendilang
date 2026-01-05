import { eventBus } from "../utils/eventBus.js";

/**
 * 專門處理 dataset.actionList
 */
function dispatchActionList(el, eventType) {
  let actionList = [];

  try {
    actionList = JSON.parse(el.dataset.actionList);
  } catch (err) {
    console.error("❌ actionList JSON 解析失敗:", el.dataset.actionList);
    return;
  }

  // 單物件轉陣列保險
  if (!Array.isArray(actionList)) {
    actionList = [actionList];
  }

  actionList
    .filter(evt => evt.type === eventType)
    .forEach(evt => {
      const { action, eventParameter } = evt;

      if(eventType === "scroll"){
  	const { scrollTop, scrollHeight, clientHeight } = el;
  	eventParameter.scrollTop = scrollTop;
  	eventParameter.scrollHeight = scrollHeight;
  	eventParameter.clientHeight = clientHeight;
  	eventParameter.atBottom = scrollTop + clientHeight >= scrollHeight - 5;

      }

      // 發射事件到 eventBus
      eventBus.emit(action, eventParameter, el);
    });
}

/**
 * 初始化全域 click 事件委派
 */
export function initializeEmitEvent() {
  ["click", "scroll","keydown"].forEach(type => {
  document.addEventListener(type, (e) => {
    if (!(e.target instanceof Element)){ 
	   return;
    }
    if (type === "keydown") {
       if (e.key !== "Enter"){
               return;     // 不是 Enter → 不做事
       }
       if (e.shiftKey){
               return;
               // 有按 Shift → 不做事
       }
       if (e.isComposing) {
               return;
       }
       e.preventDefault();
    }


    console.log("event/eventEmitter.js: e.target: ",e.target);
    const el = e.target.closest("[data-action-list]");
    console.log("event/eventEmitter.js: el: ",el);
    if (!el){
      if(type==="click"){
	   console.log("/event/eventEmitter.js: initializeEmitEvent action:NULL");
           eventBus.emit("NULL", {}, e);
      }
      return;
    }
    dispatchActionList(el, type);
  }, true);
});

}

