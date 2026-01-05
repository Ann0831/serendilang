import { logout as apiLogout, logoutAll as apiLogoutAll } from "../api/post_api.js";

// ✅ 登出目前裝置
export async function logout() {
  const res = await apiLogout();
  console.log("[Service:logout] res:", res);

  if (res && res.status !== "error" && (res.result === "success" || res.status === "success")) {
    localStorage.removeItem("userInfo");
    sessionStorage.clear();
    localStorage.clear();

    window.location.reload();

    return true;
  } else {
    console.error("[Service:logout] failed:", res);
    throw new Error("Logout failed: " + JSON.stringify(res));
  }
}

// ✅ 登出所有裝置
export async function logoutAll() {
  const res = await apiLogoutAll();
  console.log("[Service:logoutAll] res:", res);

  if (res && res.status !== "error" && (res.result === "success" || res.status === "success")) {
    localStorage.removeItem("userInfo");
    sessionStorage.clear();
    localStorage.clear();

    window.location.reload();
    return true;
  } else {
    console.error("[Service:logoutAll] failed:", res);
    throw new Error("LogoutAll failed: " + JSON.stringify(res));
  }
}

