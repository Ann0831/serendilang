import { eventBus } from "/utils/eventBus.js";

export function registerNULLHandler() {
  eventBus.on("NULL", (params) => {
    console.log("📪 收到 NULL 事件:", params || "(無參數)");

    // 隱藏所有已開啟的下拉、選單等元件
    const selectors = [
      '[id^="ChatRoom_Menu-"]',
      '[id^="full-header-dropdown"]',
      '[id^="SelfPage-menu-"]',
      '[id^="mainPage-menu-"]',
      '[id^="userselfpage-user-dropdown"]',
      '[id^="reportUserMenu-"]',
      '[id^="EmojiMenu-"]'
    ];

    document.querySelectorAll(selectors.join(",")).forEach((el) => {
      el.classList.add("hidden");
    });
  });
}
