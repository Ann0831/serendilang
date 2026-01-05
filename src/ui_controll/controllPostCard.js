
import {uploadPostData} from "../service/uploadPostData.js"


export async function toggleLike(svgEl, likeCountEl, postId) {
  console.log("/ui_controll/controllPostCard.js: toggleLike: likeCountEl:", likeCountEl);
  console.log("/ui_controll/controllPostCard.js: toggleLike: svgEl:", svgEl);

  const liked = svgEl.getAttribute("data-liked") === "true";

  // 樂觀更新：先修改 UI
  if (!liked) {
    svgEl.setAttribute("fill", "red");
    svgEl.setAttribute("stroke", "red");
    svgEl.setAttribute("data-liked", "true");
    svgEl.setAttribute("aria-label", "Unlike");
    if (likeCountEl) {
      likeCountEl.style.color = "red";
      likeCountEl.textContent = String(parseInt(likeCountEl.textContent, 10) + 1);
    }
  } else {
    svgEl.setAttribute("fill", "white");
    svgEl.setAttribute("stroke", "black");
    svgEl.setAttribute("data-liked", "false");
    svgEl.setAttribute("aria-label", "Like");
    if (likeCountEl) {
      likeCountEl.style.color = "black";
      likeCountEl.textContent = String(
        Math.max(0, parseInt(likeCountEl.textContent, 10) - 1)
      );
    }
  }

  try {
    // 再送請求
    const res = liked
      ? await uploadPostData.unsendLike(postId)
      : await uploadPostData.sendLike(postId);

    // 如果 API 失敗，就回滾 UI
    if (!res || res.result !== "success") {
      console.warn("toggleLike failed, rollback UI");
      if (!liked) {
        // 回滾 → 原本是沒按讚
        svgEl.setAttribute("fill", "white");
        svgEl.setAttribute("stroke", "black");
        svgEl.setAttribute("data-liked", "false");
        svgEl.setAttribute("aria-label", "Like");
        if (likeCountEl) {
	  likeCountEl.style.color = "black";
          likeCountEl.textContent = String(
            Math.max(0, parseInt(likeCountEl.textContent, 10) - 1)
          );
        }
      } else {
        // 回滾 → 原本是有按讚
        svgEl.setAttribute("fill", "red");
        svgEl.setAttribute("stroke", "red");
        svgEl.setAttribute("data-liked", "true");
        svgEl.setAttribute("aria-label", "Unlike");
        if (likeCountEl) {
	  likeCountEl.style.color = "red";
          likeCountEl.textContent = String(parseInt(likeCountEl.textContent, 10) + 1);
        }
      }
    }
  } catch (err) {
    console.error("toggleLike error:", err);

    // 發生錯誤也要回滾 UI
    if (!liked) {
      svgEl.setAttribute("fill", "white");
      svgEl.setAttribute("stroke", "red");
      svgEl.setAttribute("data-liked", "false");
      svgEl.setAttribute("aria-label", "Like");
      if (likeCountEl) {
        likeCountEl.textContent = String(
          Math.max(0, parseInt(likeCountEl.textContent, 10) - 1)
        );
      }
    } else {
      svgEl.setAttribute("fill", "red");
      svgEl.setAttribute("stroke", "red");
      svgEl.setAttribute("data-liked", "true");
      svgEl.setAttribute("aria-label", "Unlike");
      if (likeCountEl) {
        likeCountEl.textContent = String(parseInt(likeCountEl.textContent, 10) + 1);
      }
    }
  }
}

