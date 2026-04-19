import { uploadPostData } from "../service/uploadPostData.js";
import { eventBus } from "../utils/eventBus.js";
import { blockUserService, unBlockUserService } from "../service/blockUserService.js";
import { deleteAccountService } from "../service/deleteAccountService.js";
import { reportPostService, sendReportUserService } from "../service/reportService.js";
import { getCurrentUserBlockList_Global } from "../userSelfData/userSelfData.js";
import { getUserProfile } from "../service/getUserProfile.js";
import { updateState } from "../utils/uiStateAdapter.js";
import { showBlockedUsersListPage, hideBlockedUsersListPage } from "./BlockedUsersListPage.js";
import {
  POST_IMAGE_MIN_HEIGHT_WIDTH_RATIO,
  POST_IMAGE_MAX_HEIGHT_WIDTH_RATIO,
} from "../utils/postImageRatio.js";

const modalState = {
  makePost: {
    open: false,
    submitting: false,
    text: "",
    file: null,
    previewUrl: "",
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    crop: null,
    cropDone: false,
    result: "",
    message: "",
  },
  deletePost: { open: false, submitting: false },
  reportPost: { open: false, submitting: false },
  reportUser: { open: false, submitting: false },
  blockUser: { open: false, submitting: false },
  unblockUser: { open: false, submitting: false },
  deleteUserAccount: { open: false, submitting: false },
  blockedUsersList: { open: false, loading: false, list: [], filter: "all" },
};

function syncModalState() {
  updateState("ModalsPage", {
    makePost: { ...(modalState.makePost || {}) },
    deletePost: { ...(modalState.deletePost || {}) },
    reportPost: { ...(modalState.reportPost || {}) },
    reportUser: { ...(modalState.reportUser || {}) },
    blockUser: { ...(modalState.blockUser || {}) },
    unblockUser: { ...(modalState.unblockUser || {}) },
    deleteUserAccount: { ...(modalState.deleteUserAccount || {}) },
    blockedUsersList: {
      ...(modalState.blockedUsersList || {}),
      list: Array.isArray(modalState?.blockedUsersList?.list)
        ? [...modalState.blockedUsersList.list]
        : [],
    },
  });
}

function revokeMakePostPreviewIfAny() {
  const url = modalState?.makePost?.previewUrl;
  if (url && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // no-op
    }
  }
}

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function toNumberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeMakePostCrop(inputCrop = {}, previousCrop = null, naturalWidth = 0, naturalHeight = 0) {
  const prev = previousCrop && typeof previousCrop === "object"
    ? previousCrop
    : { x: 0, y: 0, w: 1, h: 1 };

  const imgW = Number(naturalWidth) > 0 ? Number(naturalWidth) : 0;
  const imgH = Number(naturalHeight) > 0 ? Number(naturalHeight) : 0;
  if (!imgW || !imgH) {
    const x = clamp(toNumberOr(inputCrop.x, prev.x), 0, 1);
    const y = clamp(toNumberOr(inputCrop.y, prev.y), 0, 1);
    const w = clamp(toNumberOr(inputCrop.w, prev.w), 0.05, 1 - x);
    const h = clamp(toNumberOr(inputCrop.h, prev.h), 0.05, 1 - y);
    return { x, y, w, h };
  }

  const minHw = POST_IMAGE_MIN_HEIGHT_WIDTH_RATIO;
  const maxHw = POST_IMAGE_MAX_HEIGHT_WIDTH_RATIO;
  const minPx = 16;

  const maxX = Math.max(0, 1 - (minPx / imgW));
  const maxY = Math.max(0, 1 - (minPx / imgH));
  let x = clamp(toNumberOr(inputCrop.x, prev.x), 0, maxX);
  let y = clamp(toNumberOr(inputCrop.y, prev.y), 0, maxY);

  const maxWpx = Math.max(minPx, (1 - x) * imgW);
  const maxHpx = Math.max(minPx, (1 - y) * imgH);

  let wPx = clamp(toNumberOr(inputCrop.w, prev.w) * imgW, minPx, maxWpx);
  let hPx = clamp(toNumberOr(inputCrop.h, prev.h) * imgH, minPx, maxHpx);

  // Enforce H/W ratio range in pixel space.
  hPx = clamp(hPx, wPx * minHw, Math.min(wPx * maxHw, maxHpx));

  if (hPx > maxHpx) hPx = maxHpx;

  let minWForH = hPx / maxHw;
  let maxWForH = hPx / minHw;
  wPx = clamp(wPx, minWForH, Math.min(maxWForH, maxWpx));

  if (wPx > maxWpx) wPx = maxWpx;
  hPx = clamp(hPx, wPx * minHw, Math.min(wPx * maxHw, maxHpx));

  wPx = clamp(wPx, minPx, maxWpx);
  hPx = clamp(hPx, minPx, maxHpx);

  const nextW = clamp(wPx / imgW, minPx / imgW, 1 - x);
  const nextH = clamp(hPx / imgH, minPx / imgH, 1 - y);
  x = clamp(x, 0, 1 - nextW);
  y = clamp(y, 0, 1 - nextH);
  return { x, y, w: nextW, h: nextH };
}

function getDefaultPostImageCrop(width, height) {
  const safeW = Number(width) > 0 ? Number(width) : 0;
  const safeH = Number(height) > 0 ? Number(height) : 0;
  if (!safeW || !safeH) return null;

  const minWh = 1 / POST_IMAGE_MAX_HEIGHT_WIDTH_RATIO;
  const maxWh = 1 / POST_IMAGE_MIN_HEIGHT_WIDTH_RATIO;

  let cropW = safeW;
  let cropH = safeH;
  const wh = safeW / safeH;

  if (wh < minWh) {
    cropH = safeW / minWh;
  } else if (wh > maxWh) {
    cropW = safeH * maxWh;
  }

  const x = (safeW - cropW) / 2;
  const y = (safeH - cropH) / 2;
  return {
    x: x / safeW,
    y: y / safeH,
    w: cropW / safeW,
    h: cropH / safeH,
  };
}

async function readImageDimensionsFromFile(file) {
  if (!file) return { width: 0, height: 0 };
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    return { width: 0, height: 0 };
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    const loaded = await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error("image_load_failed"));
      img.src = objectUrl;
    });
    if (!loaded) return { width: 0, height: 0 };
    return {
      width: img.naturalWidth || 0,
      height: img.naturalHeight || 0,
    };
  } finally {
    try {
      URL.revokeObjectURL(objectUrl);
    } catch {
      // no-op
    }
  }
}

async function buildCroppedImageFile(file, crop, naturalWidth, naturalHeight) {
  if (!file || !crop) return file;
  const srcW = Number(naturalWidth) > 0 ? Number(naturalWidth) : 0;
  const srcH = Number(naturalHeight) > 0 ? Number(naturalHeight) : 0;
  if (!srcW || !srcH) return file;

  const sx = Math.round(clamp(crop.x, 0, 1) * srcW);
  const sy = Math.round(clamp(crop.y, 0, 1) * srcH);
  const sw = Math.round(clamp(crop.w, 0, 1) * srcW);
  const sh = Math.round(clamp(crop.h, 0, 1) * srcH);
  if (sw <= 1 || sh <= 1) return file;

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error("image_load_failed"));
      img.src = objectUrl;
    });
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  } finally {
    try {
      URL.revokeObjectURL(objectUrl);
    } catch {
      // no-op
    }
  }

  const type = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.95));
  if (!blob) return file;
  return new File([blob], file.name || "post-image.jpg", { type: blob.type || type });
}

export function makePostModalPage() {
  const _ = document.getElementById("postContainer");
  revokeMakePostPreviewIfAny();
  modalState.makePost = {
    open: true,
    submitting: false,
    text: "",
    file: null,
    previewUrl: "",
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    crop: null,
    cropDone: false,
    result: "",
    message: "",
  };
  syncModalState();
  return null;
}

export function closePostModalPage() {
  revokeMakePostPreviewIfAny();
  modalState.makePost = {
    open: false,
    submitting: false,
    text: "",
    file: null,
    previewUrl: "",
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    crop: null,
    cropDone: false,
    result: "",
    message: "",
  };
  syncModalState();
}

export function updateMakePostText(text = "") {
  modalState.makePost = {
    ...modalState.makePost,
    text: typeof text === "string" ? text : String(text || ""),
    result: "",
    message: "",
  };
  syncModalState();
}

export async function updateMakePostFile(file = null) {
  const nextFile = file && typeof file === "object" ? file : null;
  if (nextFile && typeof nextFile.type === "string" && !nextFile.type.startsWith("image/")) {
    modalState.makePost = {
      ...modalState.makePost,
      result: "fail",
      message: "Please select an image file.",
    };
    syncModalState();
    return;
  }

  revokeMakePostPreviewIfAny();
  let previewUrl = "";
  let imageNaturalWidth = 0;
  let imageNaturalHeight = 0;
  let crop = null;
  if (nextFile && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    try {
      previewUrl = URL.createObjectURL(nextFile);
    } catch {
      previewUrl = "";
    }
    try {
      const dims = await readImageDimensionsFromFile(nextFile);
      imageNaturalWidth = dims.width;
      imageNaturalHeight = dims.height;
      crop = normalizeMakePostCrop(
        getDefaultPostImageCrop(imageNaturalWidth, imageNaturalHeight),
        null,
        imageNaturalWidth,
        imageNaturalHeight,
      );
    } catch {
      imageNaturalWidth = 0;
      imageNaturalHeight = 0;
      crop = null;
    }
  }

  modalState.makePost = {
    ...modalState.makePost,
    file: nextFile,
    previewUrl,
    imageNaturalWidth,
    imageNaturalHeight,
    crop,
    cropDone: !nextFile,
    result: "",
    message: "",
  };
  syncModalState();
}

export function updateMakePostCrop(crop = null) {
  if (!crop || typeof crop !== "object") return;
  const nextCrop = normalizeMakePostCrop(
    crop,
    modalState?.makePost?.crop || null,
    modalState?.makePost?.imageNaturalWidth || 0,
    modalState?.makePost?.imageNaturalHeight || 0,
  );
  modalState.makePost = {
    ...modalState.makePost,
    crop: nextCrop,
    cropDone: false,
  };
  syncModalState();
}

export function resetMakePostCrop() {
  const width = Number(modalState?.makePost?.imageNaturalWidth) || 0;
  const height = Number(modalState?.makePost?.imageNaturalHeight) || 0;
  if (!width || !height) return;
  modalState.makePost = {
    ...modalState.makePost,
    crop: normalizeMakePostCrop(getDefaultPostImageCrop(width, height), null, width, height),
    cropDone: false,
  };
  syncModalState();
}

export function confirmMakePostCrop() {
  if (!modalState?.makePost?.file || !modalState?.makePost?.crop) return;
  modalState.makePost = {
    ...modalState.makePost,
    cropDone: true,
    result: "",
    message: "",
  };
  syncModalState();
}

export function reopenMakePostCrop() {
  if (!modalState?.makePost?.file || !modalState?.makePost?.crop) return;
  modalState.makePost = {
    ...modalState.makePost,
    cropDone: false,
    result: "",
    message: "",
  };
  syncModalState();
}

export function clearMakePostFile() {
  revokeMakePostPreviewIfAny();
  modalState.makePost = {
    ...modalState.makePost,
    file: null,
    previewUrl: "",
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    crop: null,
    cropDone: false,
    result: "",
    message: "",
  };
  syncModalState();
}

export async function submitPostModalPage() {
  if (modalState.makePost?.submitting) return;
  const file = modalState.makePost.file || null;
  const text = (modalState.makePost.text || "").trim();
  if (!file && !text) {
    modalState.makePost = {
      ...modalState.makePost,
      result: "fail",
      message: "Please write something or upload an image.",
    };
    syncModalState();
    return;
  }
  if (file && !modalState?.makePost?.cropDone) {
    modalState.makePost = {
      ...modalState.makePost,
      result: "fail",
      message: "Please complete image crop before posting.",
    };
    syncModalState();
    return;
  }

  modalState.makePost = { ...modalState.makePost, submitting: true };
  syncModalState();

  try {
    const croppedFile = await buildCroppedImageFile(
      file,
      modalState?.makePost?.crop,
      modalState?.makePost?.imageNaturalWidth,
      modalState?.makePost?.imageNaturalHeight,
    );
    const res = await uploadPostData.makePost(croppedFile, text);
    const success = res?.result === "success";
    if (success) {
      revokeMakePostPreviewIfAny();
    }
    modalState.makePost = {
      ...modalState.makePost,
      submitting: false,
      file: success ? null : modalState.makePost.file,
      previewUrl: success ? "" : modalState.makePost.previewUrl,
      imageNaturalWidth: success ? 0 : modalState.makePost.imageNaturalWidth,
      imageNaturalHeight: success ? 0 : modalState.makePost.imageNaturalHeight,
      crop: success ? null : modalState.makePost.crop,
      cropDone: success ? false : modalState.makePost.cropDone,
      text: success ? "" : modalState.makePost.text,
      result: success ? "success" : "fail",
      message: success ? "Submitted successfully!" : (res?.message || "Post upload failed"),
    };
  } catch (err) {
    modalState.makePost = {
      ...modalState.makePost,
      submitting: false,
      result: "fail",
      message: String(err?.message || "unknown error"),
    };
  }
  syncModalState();
}

export function openDeletePostModal(postId) {
  const _ = document.getElementById("postContainer");
  modalState.deletePost = { open: true, submitting: false, postId };
  syncModalState();
}

export function closeDeletePostModal() {
  modalState.deletePost = { open: false, submitting: false };
  syncModalState();
}

export async function confirmDeletePost() {
  const postId = modalState.deletePost.postId;
  if (!postId) return;

  modalState.deletePost = { ...modalState.deletePost, submitting: true };
  syncModalState();

  try {
    const res = await uploadPostData.deletePost(postId);
    modalState.deletePost = {
      ...modalState.deletePost,
      submitting: false,
      result: res?.result === "success" ? "success" : "fail",
    };
    if (res?.result === "success") eventBus.emit("reInitUserSelfPosts", {});
  } catch {
    modalState.deletePost = { ...modalState.deletePost, submitting: false, result: "fail" };
  }
  syncModalState();
}

export function openReportPostModal(postId) {
  const _ = document.getElementById("postContainer");
  modalState.reportPost = { open: true, submitting: false, postId, reason: "" };
  syncModalState();
}

export function updateReportPostReason(reason = "") {
  modalState.reportPost = {
    ...modalState.reportPost,
    reason: typeof reason === "string" ? reason : String(reason || ""),
    result: "",
  };
  syncModalState();
}

export function closeReportPostModal() {
  modalState.reportPost = { open: false, submitting: false };
  syncModalState();
}

export async function submitReportPostModal() {
  const { postId, reason } = modalState.reportPost;
  if (!postId || !reason) return;

  modalState.reportPost = { ...modalState.reportPost, submitting: true };
  syncModalState();

  try {
    const res = await reportPostService(postId, reason);
    modalState.reportPost = {
      ...modalState.reportPost,
      submitting: false,
      result: res?.result === "success" ? "success" : "fail",
    };
  } catch {
    modalState.reportPost = { ...modalState.reportPost, submitting: false, result: "fail" };
  }
  syncModalState();
}

export function openReportUserModal(target_id, target_name) {
  const _ = document.getElementById("chatRoomsContainer");
  modalState.reportUser = { open: true, submitting: false, target_id, target_name, reason: "" };
  syncModalState();
}

export function updateReportUserReason(reason = "") {
  modalState.reportUser = {
    ...modalState.reportUser,
    reason: typeof reason === "string" ? reason : String(reason || ""),
    result: "",
  };
  syncModalState();
}

export function closeReportUserModal() {
  modalState.reportUser = { open: false, submitting: false };
  syncModalState();
}

export async function submitReportUserModal() {
  const { target_id, reason } = modalState.reportUser;
  if (!target_id || !reason) return;

  modalState.reportUser = { ...modalState.reportUser, submitting: true };
  syncModalState();

  try {
    const res = await sendReportUserService(target_id, reason);
    modalState.reportUser = {
      ...modalState.reportUser,
      submitting: false,
      result: res?.result === "success" ? "success" : "fail",
    };
  } catch {
    modalState.reportUser = { ...modalState.reportUser, submitting: false, result: "fail" };
  }
  syncModalState();
}

export function openBlockUserModal(target_id, target_name) {
  const _ = document.getElementById("chatRoomsContainer");
  modalState.blockUser = { open: true, submitting: false, target_id, target_name };
  syncModalState();
}

export function closeBlockUserModal() {
  modalState.blockUser = { open: false, submitting: false };
  syncModalState();
}

export async function submitBlockUserModal() {
  const target_id = modalState.blockUser.target_id;
  if (!target_id) return;

  modalState.blockUser = { ...modalState.blockUser, submitting: true };
  syncModalState();

  try {
    const res = await blockUserService(target_id);
    modalState.blockUser = {
      ...modalState.blockUser,
      submitting: false,
      result: res?.result === "success" ? "success" : "fail",
    };

    if (res?.result === "success") {
      eventBus.emit("reloadMessagesPage", { from: "BlockUserModal" });
      eventBus.emit("reloadFriendsListPage", { from: "BlockUserModal" });
      eventBus.emit("reloadBlockedUsersListModal", { from: "BlockUserModal" });
      eventBus.emit("reloadChatRoom", { from: "BlockUserModal", target_id });
    }
  } catch {
    modalState.blockUser = { ...modalState.blockUser, submitting: false, result: "fail" };
  }
  syncModalState();
}

export function openUnblockUserModal(target_id, target_name) {
  const _ = document.getElementById("chatRoomsContainer");
  modalState.unblockUser = { open: true, submitting: false, target_id, target_name };
  syncModalState();
}

export function closeUnblockUserModal() {
  modalState.unblockUser = { open: false, submitting: false };
  syncModalState();
}

export async function submitUnblockUserModal() {
  const target_id = modalState.unblockUser.target_id;
  if (!target_id) return;

  modalState.unblockUser = { ...modalState.unblockUser, submitting: true };
  syncModalState();

  try {
    const res = await unBlockUserService(target_id);
    modalState.unblockUser = {
      ...modalState.unblockUser,
      submitting: false,
      result: res?.result === "success" ? "success" : "fail",
    };

    if (res?.result === "success") {
      eventBus.emit("reloadMessagesPage", { from: "UnblockUserModal" });
      eventBus.emit("reloadFriendsListPage", { from: "UnblockUserModal" });
      eventBus.emit("reloadBlockedUsersListModal", { from: "UnblockUserModal" });
      eventBus.emit("reloadChatRoom", { from: "UnblockUserModal", target_id });
      setTimeout(() => {
        closeUnblockUserModal();
      }, 800);
    }
  } catch {
    modalState.unblockUser = { ...modalState.unblockUser, submitting: false, result: "fail" };
    setTimeout(() => {
      closeUnblockUserModal();
    }, 800);
  }
  syncModalState();
}

export function openDeleteUserAccountModal() {
  const _ = document.getElementById("userselfpage-username");
  modalState.deleteUserAccount = { open: true, submitting: false };
  syncModalState();
}

export function closeDeleteUserAccountModal() {
  modalState.deleteUserAccount = { open: false, submitting: false };
  syncModalState();
}

export async function submitDeleteUserAccountModal() {
  modalState.deleteUserAccount = { ...modalState.deleteUserAccount, submitting: true };
  syncModalState();

  try {
    const result = await deleteAccountService();
    modalState.deleteUserAccount = {
      ...modalState.deleteUserAccount,
      submitting: false,
      result: result?.success ? "success" : "fail",
    };
  } catch {
    modalState.deleteUserAccount = { ...modalState.deleteUserAccount, submitting: false, result: "fail" };
  }
  syncModalState();
}

export function openBlockedUsersListModal(options = { filter: "all" }) {
  const _ = document.getElementById("friendslistpage");
  modalState.blockedUsersList = {
    ...modalState.blockedUsersList,
    open: true,
    loading: true,
    filter: options.filter || "all",
    result: "loading",
  };
  syncModalState();
  showBlockedUsersListPage();
  loadBlockedUsersList(options);
}

export function closeBlockedUsersListModal() {
  modalState.blockedUsersList = { ...modalState.blockedUsersList, open: false };
  syncModalState();
  hideBlockedUsersListPage();
}

export function reloadBlockedUsersListModal() {
  if (!modalState.blockedUsersList.open) return;
  loadBlockedUsersList({ filter: modalState.blockedUsersList.filter || "all" });
}

async function loadBlockedUsersList(options) {
  modalState.blockedUsersList = {
    ...modalState.blockedUsersList,
    loading: true,
    filter: options.filter || "all",
    result: "loading",
  };
  syncModalState();

  try {
    const blockList = await getCurrentUserBlockList_Global();
    const list = [];

    if (Array.isArray(blockList)) {
      for (const userId of blockList) {
        const moreData = await getUserProfile(userId);
        if (options.filter === "friendsOnly" && moreData?.friendship_status?.in?.state !== "friend") continue;

        list.push({
          friend_id: userId,
          friend_name: moreData?.username || "Unknown",
          profilePicUrl: moreData?.profile_picture_url || "",
          language: {
            nativelanguage: moreData?.nativelanguage,
            targetlanguage: moreData?.targetlanguage,
          },
          isBlocked: true,
        });
      }
    }

    modalState.blockedUsersList = {
      ...modalState.blockedUsersList,
      loading: false,
      list,
      result: "success",
    };
  } catch {
    modalState.blockedUsersList = {
      ...modalState.blockedUsersList,
      loading: false,
      list: [],
      result: "fail",
    };
  }

  syncModalState();
  // TODO: 呼叫 UI 層 React render 函式
}
