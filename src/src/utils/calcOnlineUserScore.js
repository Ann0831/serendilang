/**
 * 根據語言匹配度計算上線使用者分數
 * @param {Object} user - { userId, username }
 * @param {Object} detailUserInfo - container.detailUserInfo
 * @param {string} myNative - 本地使用者的母語
 * @param {string} myTarget - 本地使用者的目標語言
 * @returns {number} 分數，越高代表越匹配
 */
export function calcOnlineUserScore(user, detailUserInfo, myNative, myTarget) {
  const detail = detailUserInfo?.[user.user_id||user.userId];
  console.log("calcOnlineUserScore: detailUserInfo, myNative, myTarget: ",detailUserInfo, myNative, myTarget);
  console.log("calcOnlineUserScore: user: ",user);
  console.log("calcOnlineUserScore: detail: ",detail);
  if (!detail){ 
     return 0;
  }
  let score = 0;
  // 對方母語 = 我的目標語言 → 高分
  if (detail.nativelanguage && detail.nativelanguage === myTarget) {
    score += 2;
  }
  // 對方目標語言 = 我的母語 → 中分
  if (detail.targetlanguage && detail.targetlanguage === myNative) {
    score += 1;
  }
  console.log("calcOnlineUserScore: user,score: ",user,score);
  return score;
}

