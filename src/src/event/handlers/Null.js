import { eventBus } from "../../utils/eventBus.js";

export function registerNULLHandler() {
  eventBus.on("NULL", (params, rawEvent) => {
    console.log("📪 收到 NULL 事件:", params || "(無參數)");

    const target = rawEvent?.target instanceof Element ? rawEvent.target : null;
    const clickedMainPostMenuToggle = !!target?.closest?.('[data-main-post-menu-toggle="true"]');
    const clickedMainPostMenu = !!target?.closest?.('[id^="mainPage-menu-"]');
    const skipMainPostMenuClose = clickedMainPostMenuToggle || clickedMainPostMenu;
    const clickedChatRoomMenuToggle = !!target?.closest?.('[data-chatroom-menu-toggle="true"]');
    const clickedChatRoomMenu = !!target?.closest?.('[id^="ChatRoom_Menu-"]');
    const skipChatRoomMenuClose = clickedChatRoomMenuToggle || clickedChatRoomMenu;
    const clickedSelfPostMenuToggle = !!target?.closest?.('[data-self-post-menu-toggle="true"]');
    const clickedSelfPostMenu = !!target?.closest?.('[id^="SelfPage-menu-"]');
    const skipSelfPostMenuClose = clickedSelfPostMenuToggle || clickedSelfPostMenu;
    const clickedUserSelfDropdownToggle = !!target?.closest?.('[data-userself-dropdown-toggle="true"]');
    const clickedUserSelfDropdown = !!target?.closest?.("#userselfpage-user-dropdown");
    const skipUserSelfDropdownClose = clickedUserSelfDropdownToggle || clickedUserSelfDropdown;
    const clickedEmojiMenuToggle = !!target?.closest?.('[data-emoji-menu-toggle="true"]');
    const clickedEmojiMenu = !!target?.closest?.('[id^="EmojiMenu-"]');
    const skipEmojiMenuClose = clickedEmojiMenuToggle || clickedEmojiMenu;

    // 隱藏所有已開啟的下拉、選單等元件
    const selectors = [
      '[id^="full-header-dropdown"]',
      '[id^="reportUserMenu-"]'
    ];
    if (!skipEmojiMenuClose) {
      selectors.push('[id^="EmojiMenu-"]');
    }
    if (!skipSelfPostMenuClose) {
      selectors.push('[id^="SelfPage-menu-"]');
    }
    if (!skipUserSelfDropdownClose) {
      selectors.push('[id^="userselfpage-user-dropdown"]');
    }
    if (!skipChatRoomMenuClose) {
      selectors.push('[id^="ChatRoom_Menu-"]');
    }
    if (!skipMainPostMenuClose) {
      selectors.push('[id^="mainPage-menu-"]');
    }

    document.querySelectorAll(selectors.join(",")).forEach((el) => {
      el.classList.add("hidden");
    });
  });
}
