import {logout,logoutAll} from "../service/Logout.js";


export function toggleLogout() {
  const dropdown = document.getElementById("full-header-dropdown");
  if (!dropdown) return;

  if (dropdown.classList.contains("hidden")) {
    // 顯示
    dropdown.classList.remove("hidden");
  } else {
    // 隱藏
    dropdown.classList.add("hidden");
  }
}

export function closeLogout() {
  const dropdown = document.getElementById("full-header-dropdown");
  if (!dropdown) return;
  dropdown.classList.add("hidden");
}

export async function executeLogout(){

  logout();
}

export async function executeLogoutAll(){

  logoutAll();
}

