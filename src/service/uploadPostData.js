// ./services/releasePostData.js
import {
  postMakePost,
  postDeletePost,
  postSendLike,
  postUnsendLike,
  postSendPostReport
} from "../api/post_api.js";
import { compressImage } from "../utils/compressImage.js";

export const uploadPostData = {
  /**
   * 發佈貼文
   * @param {File|Blob} imageFile - 上傳圖片
   * @param {string} articleString - 文字內容
   * @returns {Promise<{result: "success"|"fail"}>}
   */
  async makePost(imageFile, articleString) {
    try {
      console.log("services/releasePostData.js: makePost: articleString:", articleString);

      let Blob = null;
      if (imageFile) {
        Blob = await compressImage(imageFile);
        console.log("services/releasePostData.js: makePost: Blob:", Blob);
      } else {
        console.log("services/releasePostData.js: makePost: no image file, skip compression");
      }

      const res = await postMakePost(Blob, articleString);
      return res?.status === "success"
        ? { result: "success" }
        : { result: "fail",message: res?.message || res?.error?.message || "Unknown error"  };
    } catch (error) {
      console.error("❌ makePost error:", error);
      return { result: "fail" };
    }
  },

  /**
   * 刪除貼文
   */
  async deletePost(postId) {
    try {
      const res = await postDeletePost(postId);
      return res?.status === "success"
        ? { result: "success" }
        : { result: "fail" };
    } catch (error) {
      console.error("❌ deletePost error:", error);
      return { result: "fail" };
    }
  },

  /**
   * 按讚
   */
  async sendLike(postId) {
    try {
      const res = await postSendLike(postId);
      return res?.status === "success"
        ? { result: "success" }
        : { result: "fail" };
    } catch (error) {
      console.error("❌ sendLike error:", error);
      return { result: "fail" };
    }
  },

  /**
   * 取消按讚
   */
  async unsendLike(postId) {
    try {
      const res = await postUnsendLike(postId);
      return res?.status === "success"
        ? { result: "success" }
        : { result: "fail" };
    } catch (error) {
      console.error("❌ unsendLike error:", error);
      return { result: "fail" };
    }
  },

  /**
   * 檢舉貼文
   */
  async sendPostReport(postId, reason) {
    try {
      const res = await postSendPostReport(postId, reason);
      return res?.status === "success"
        ? { result: "success" }
        : { result: "fail" };
    } catch (error) {
      console.error("❌ sendPostReport error:", error);
      return { result: "fail" };
    }
  }
};

