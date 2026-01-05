// ./user_identity/user_identity.js

import {
  fetchCurrentUserIdentity,
  fetchUserLanguage,
  fetchUserBlockList
} from "/service/getUserSelfBasicData.js";

import { fetchMyPostReportsService as fetchMyPostReports } from "/service/reportService.js";

let currentUserIdentity = null;
let currentUserLanguage = null;
let userBlockList = null;
let userReportedPosts = null;   // 🔹 使用者檢舉的貼文表
let _refreshLock = null;

/**
 * 重新從後端拉取使用者身份資訊
 */
export async function refreshUserData() {
  // 🔒 若已有 refresh 在執行 → 等待它完成
  if (_refreshLock) return _refreshLock;

  _refreshLock = (async () => {
    try {
      await initUserData();
    } finally {
      _refreshLock = null; // ✅ 確保無論成功或失敗都清除鎖
    }
  })();

  return _refreshLock;
}

/**
 * 初始化所有使用者資料（身分、語言、封鎖名單、檢舉貼文）
 */
export async function initUserData() {
  try {
    // 先取得身份
    try {
      currentUserIdentity = await fetchCurrentUserIdentity();
      console.log("initUserData: currentUserIdentity:", currentUserIdentity);
    } catch (err) {
      currentUserIdentity = null;
      console.error("initUserData: failed to load currentUserIdentity:", err);
    }

    // 建立 Promise 陣列（並行執行）
    const promises = [];

    // 如果身份存在 → 查語言
    if (currentUserIdentity && currentUserIdentity.user_id) {
      promises.push(
        fetchUserLanguage().then(
          (lang) => {
            currentUserLanguage = lang;
            console.log("initUserData: currentUserLanguage:", currentUserLanguage);
          },
          (err) => {
            currentUserLanguage = null;
            console.error("initUserData: failed to load user language:", err);
          }
        )
      );
    } else {
      currentUserLanguage = null;
    }

    // 不依賴身份 → 直接查封鎖名單
    promises.push(
      fetchUserBlockList().then(
        (list) => {
          userBlockList = Array.isArray(list) ? list : [];
          console.log("initUserData: userBlockList:", userBlockList);
        },
        (err) => {
          userBlockList = [];
          console.error("initUserData: failed to load userBlockList:", err);
        }
      )
    );

    // 🔹 查詢檢舉貼文表
    promises.push(
      fetchMyPostReports().then(
        (reports) => {
          userReportedPosts = Array.isArray(reports) ? reports : [];
          console.log("initUserData: userReportedPosts:", userReportedPosts);
        },
        (err) => {
          userReportedPosts = [];
          console.error("initUserData: failed to load userReportedPosts:", err);
        }
      )
    );

    // 等待所有非身份請求完成
    await Promise.allSettled(promises);
  } catch (error) {
    console.error("❌ Unexpected error in initUserData:", error);
  }
}

/**
 * 從 service 抓取並回傳最新使用者身分
 */
export async function fetchCurrentUserIdentity_Global() {
  currentUserIdentity = await fetchCurrentUserIdentity();
  return currentUserIdentity;
}

/**
 * 取得目前快取的使用者身分（若尚未存在會初始化）
 */
export async function getCurrentUserIdentity_Global() {
  if (!currentUserIdentity) await initUserData();
  return currentUserIdentity;
}

/**
 * 取得目前使用者語言（若尚未存在會初始化）
 */
export async function getCurrentUserLanguage_Global() {
  if (!currentUserLanguage) await initUserData();
  return currentUserLanguage;
}

/**
 * 取得目前使用者的封鎖名單
 */
export async function getCurrentUserBlockList_Global() {
  if (!userBlockList) await initUserData();
  return Array.isArray(userBlockList) ? userBlockList : [];
}

/**
 * 取得目前使用者的檢舉貼文清單
 */
export async function getCurrentUserReportedPosts_Global() {
  if (!userReportedPosts) await initUserData();
  return Array.isArray(userReportedPosts) ? userReportedPosts : [];
}

