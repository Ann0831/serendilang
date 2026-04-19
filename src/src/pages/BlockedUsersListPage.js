import { createGlobalElement, mountToGlobalDisplay, unmountFromGlobalDisplay } from "./globalDisplayMount.js";
import BlockedUsersListPage from "../ui/pages/BlockedUsersListPage.jsx";

const BLOCKED_USERS_PAGE_KEY = "blocked-users-page";

export function showBlockedUsersListPage() {
  mountToGlobalDisplay(BLOCKED_USERS_PAGE_KEY, createGlobalElement(BlockedUsersListPage));
}

export function hideBlockedUsersListPage() {
  unmountFromGlobalDisplay(BLOCKED_USERS_PAGE_KEY);
}
