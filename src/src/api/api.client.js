import * as realApi from "./api.js";
import * as mockApi from "./api.mock.js";
import { isTestEnv } from "../environment/env.js";
import { maybeThrowMockApiError } from "./fakeApiErrorInjector.js";

const impl = isTestEnv ? mockApi : realApi;
const bind = (name) => (...args) => {
  if (isTestEnv) {
    maybeThrowMockApiError(`api.${name}`);
    maybeThrowMockApiError(name);
  }
  return impl[name](...args);
};

export const getUnreadMessageCount = bind("getUnreadMessageCount");
export const getUnreadFriendRequestCount = bind("getUnreadFriendRequestCount");
export const getFriendsList = bind("getFriendsList");
export const getPostSuggest = bind("getPostSuggest");
export const fetchMessages = bind("fetchMessages");
export const getProfilePictureUrl = bind("getProfilePictureUrl");
export const getPostById = bind("getPostById");
export const getRequestedFriendData = bind("getRequestedFriendData");
export const getSpecificMessageScreen = bind("getSpecificMessageScreen");
export const getUnreadAcceptFriendCount = bind("getUnreadAcceptFriendCount");
export const getAllMessagesScreen = bind("getAllMessagesScreen");
export const getCurrentUserIdentity = bind("getCurrentUserIdentity");
export const getGlobalPostsSuggest = bind("getGlobalPostsSuggest");
export const getPotentialFriends = bind("getPotentialFriends");
export const getUserLanguage = bind("getUserLanguage");
export const getUserAllPostIds = bind("getUserAllPostIds");
export const getUsernameById = bind("getUsernameById");
export const getUserLikePost = bind("getUserLikePost");
export const getUserBlockList = bind("getUserBlockList");
export const apiGetFriendshipStatus = bind("apiGetFriendshipStatus");
export const getMyPostReports = bind("getMyPostReports");
export const checkUsernameAvailability = bind("checkUsernameAvailability");
export const getUserRealtimeStatus = bind("getUserRealtimeStatus");
export const getRealtimeOnlineList = bind("getRealtimeOnlineList");
export const getUnreadSystemUserNotifications = bind("getUnreadSystemUserNotifications");
export const getGoogleOauthStatus = bind("getGoogleOauthStatus");
export const checkResOk = bind("checkResOk");
