import "../css/index.css";
import { navigate } from "../route/navigator.js";
import { eventBus } from "../utils/eventBus.js";

/**
 * 綁定側邊欄選單事件（事件流：UI emit -> eventBus -> route navigate）
 */
let __menuNavigateRegistered = false;

export function initMenuEventControll() {
  if (__menuNavigateRegistered) return;

  eventBus.on("menuNavigate", (params = {}) => {
    const target = params?.target;
    if (!target) return;
    navigate(target);
  });
  __menuNavigateRegistered = true;
}

initMenuEventControll();
