import * as realApi from "./post_api.js";
import * as mockApi from "./post_api.mock.js";
import { isTestEnv } from "../environment/env.js";
import { maybeThrowMockApiError } from "./fakeApiErrorInjector.js";

const impl = isTestEnv ? mockApi : realApi;
const bind = (name) => (...args) => {
  if (isTestEnv) {
    maybeThrowMockApiError(`post_api.${name}`);
    maybeThrowMockApiError(name);
  }
  return impl[name](...args);
};

export const testlogin = bind("testlogin");
export const logout = bind("logout");
export const logoutAll = bind("logoutAll");
export const postAcceptFriendRequest = bind("postAcceptFriendRequest");
export const postAddFriend = bind("postAddFriend");
export const postCheckUsernameExist = bind("postCheckUsernameExist");
export const postDeleteAccount = bind("postDeleteAccount");
export const postDeletePost = bind("postDeletePost");
export const postMakePost = bind("postMakePost");
export const postMessage = bind("postMessage");
export const postSendLike = bind("postSendLike");
export const postSendPostReport = bind("postSendPostReport");
export const postSendReportUser = bind("postSendReportUser");
export const postSetFriendRequestRead = bind("postSetFriendRequestRead");
export const postSetAcceptFriendRead = bind("postSetAcceptFriendRead");
export const postTestLogin = bind("postTestLogin");
export const postLogin = bind("postLogin");
export const postRegister = bind("postRegister");
export const postUnsendLike = bind("postUnsendLike");
export const updateUserLanguage = bind("updateUserLanguage");
export const modifyProfilePicture = bind("modifyProfilePicture");
export const setMessageRead = bind("setMessageRead");
export const postUserBlock = bind("postUserBlock");
export const postUserUnBlock = bind("postUserUnBlock");
export const postAnalyticsFirstOnlineList = bind("postAnalyticsFirstOnlineList");
export const postAnalyticsWssDisconnect = bind("postAnalyticsWssDisconnect");
export const markSystemUserNotificationAsRead = bind("markSystemUserNotificationAsRead");
export const postDeleteProfilePicture = bind("postDeleteProfilePicture");
export const postApiCallsInit = bind("postApiCallsInit");
export const postApiAnalyticsIceDisconnected = bind("postApiAnalyticsIceDisconnected");
export const postApiUsersUpdateUsername = bind("postApiUsersUpdateUsername");
export const clearGoogleOauthCookie = bind("clearGoogleOauthCookie");
export const setTestLoginState = bind("setTestLoginState");
export const checkResOk = bind("checkResOk");
