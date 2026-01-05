import { getUserSelfPagePostCardData } from "../service/getUserSelfPagePostCardData.js";
import {fetchUserProfilePicUrl} from "/service/getUserProfile.js";


/**
 * 建立使用者個人頁面的 PostCard
 * @param {string|number} post_id 
 * @param {Object} options - 可傳入 onDeletePost, onEditPost callback
 */
export async function createUserSelfPagePostCard(post_id, options = {}) {
  const { onDeletePost, onEditPost, toggleLike } = options;

  const data = await getUserSelfPagePostCardData(post_id);
  console.log("./service/getUserSelfPagePostCardData.js createUserSelfPagePostCard data:", data);
  if (!data) return null;

  if (data.status === "error" && parseInt(data.code, 10) === 403) {
    const inner = data.data || {};
     try {
       inner.profilePicture_url = await Promise.resolve(
         fetchUserProfilePicUrl(inner.author_id)
       ).catch(() => "/images/assets/defaultAvatar.png");
     } catch {
       inner.profilePicture_url = "/images/default-avatar.png";
     }
    const card = document.createElement("div");
    card.className =
      "w-[90%] min-w-0 rounded-2xl shadow p-4 bg-white mb-6 border border-yellow-300 text-gray-700";

    // top row (頭像 + 名字 + menu)
    const topRow = document.createElement("div");
    topRow.className = "flex items-center mb-2 space-x-3";

    const avatar = document.createElement("img");
    avatar.src = inner.profilePicture_url || "/images/default-avatar.png";
    avatar.alt = `${inner.author_name || "User"} avatar`;
    avatar.className = "w-10 h-10 rounded-full object-cover border border-gray-300";

    const titleEl = document.createElement("h2");
    titleEl.className = "font-bold text-lg flex-1";
    titleEl.textContent = inner.author_name || "?";

    // --- Menu Wrapper ---
    const menuWrap = document.createElement("div");
    menuWrap.className = "ml-auto relative";

    // Menu Button (三個點)
    const menuBtn = document.createElement("button");
    menuBtn.className =
      "text-gray-400 px-2 py-1 rounded hover:bg-gray-100 transition";
    menuBtn.dataset.action = "post-menu";
    menuBtn.dataset.menuId = `BannedPost-menu-${inner.post_id}`;
    menuBtn.textContent = "⋯";
    menuBtn.dataset.actionList = JSON.stringify([
      {
        type: "click",
        action: "toggleSelfPostMenu",
        eventParameter: {
          post_id: inner.post_id,
          menuId: `SelfPage-menu-${inner.post_id}`,
        },
      },
    ]);

    // Menu Div
    const menuDiv = document.createElement("div");
    menuDiv.className =
      "absolute z-10 right-0 mt-2 hidden bg-white rounded shadow border p-2 w-40";
    menuDiv.id = `SelfPage-menu-${inner.post_id}`;


    // -------- Delete Button --------
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete Post";
    deleteBtn.className =
      "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded";
    deleteBtn.dataset.actionList = JSON.stringify([
      {
        type: "click",
        action: "openDeletePostModal",
        eventParameter: { post_id: inner.post_id },
      },
    ]);


    // 組合 menu
    menuDiv.appendChild(deleteBtn);
    menuWrap.appendChild(menuBtn);
    menuWrap.appendChild(menuDiv);

    // 組合 top row
    topRow.appendChild(avatar);
    topRow.appendChild(titleEl);
    topRow.appendChild(menuWrap);
    card.appendChild(topRow);

    // 語言
    if (inner.userLang?.targetlanguage) {
      const langDiv = document.createElement("div");
      langDiv.className = "text-xs text-gray-500 mb-2";
      langDiv.textContent = `Target: ${inner.userLang.targetlanguage}`;
      card.appendChild(langDiv);
    }

    // 時間
    if (inner.created_at) {
      const time = document.createElement("span");
      time.className = "text-xs text-gray-400 block pb-3 pt-1";
      const date = new Date(inner.created_at);
      time.textContent = date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      card.appendChild(time);
    }

    // 提示訊息
    const msg = document.createElement("div");
    msg.className = "text-center text-sm text-red-600";
    msg.textContent = data.message || "This post has been banned or is unavailable.";
    card.appendChild(msg);

    return card;
  }



  function parseIntOrZero(x) {
    const n = parseInt(x, 10);
    return Number.isFinite(n) ? n : 0;
  }

  // -------- helpers --------
  function setHeartState(svgEl, liked) {
    if (liked) {
      svgEl.setAttribute("fill", "red");
      svgEl.setAttribute("stroke", "red");
      svgEl.dataset.liked = "true";
    } else {
      svgEl.setAttribute("fill", "none");
      svgEl.setAttribute("stroke", "black");
      svgEl.dataset.liked = "false";
    }
  }

  // -------- card --------
  const card = document.createElement("div");
  card.className =
    "w-[90%] rounded-2xl shadow p-4 bg-white mb-6 border border-gray-200";
  card.dataset.postId = data.post_id;

  // top row
const topRow = document.createElement("div");
topRow.className = "flex items-center mb-2 space-x-3"; 

// Avatar
const avatar = document.createElement("img");
avatar.src = data.profilePicture_url || "/assets/images/defaultAvatar.svg";
avatar.alt = `${data.author_name || "Me"} avatar`;
avatar.className = "w-10 h-10 rounded-full cursor-pointer object-cover border border-gray-300";
avatar.dataset.actionList=JSON.stringify([{"type":"click","action":"openUserPage","eventParameter":{"author_id":data.author_id,"post_id":post_id,"from":"/service/createPostCard.js"}}]);


// Title (作者名稱)
const titleEl = document.createElement("h2");
titleEl.className = "font-bold text-lg flex-1 cursor-pointer"; // 撐開中間空間
titleEl.textContent = data.author_name || "(Unknown)";
titleEl.dataset.actionList=JSON.stringify([{"type":"click","action":"openUserPage","eventParameter":{"author_id":data.author_id,"post_id":post_id,"from":"/service/createPostCard.js"}}]);


// Menu Wrapper
const menuWrap = document.createElement("div");
menuWrap.className = "ml-auto relative"; // 推到最右

// Menu Button
const menuBtn = document.createElement("button");
menuBtn.className =
  "text-gray-400 px-2 py-1 rounded hover:bg-gray-100 transition";
menuBtn.dataset.action = "post-menu";
menuBtn.dataset.menuId = `SelfPage-menu-${data.post_id}`;
menuBtn.textContent = "⋯";
menuBtn.dataset.actionList = JSON.stringify([ { type: "click", action: "toggleSelfPostMenu",eventParameter: {post_id:data.post_id,menuId:`SelfPage-menu-${data.post_id}`}  } ]);
// Menu Div
const menuDiv = document.createElement("div");
menuDiv.className =
  "absolute z-10 right-0 mt-2 hidden bg-white rounded shadow border p-2";
menuDiv.id = `SelfPage-menu-${data.post_id}`;
  // -------- Delete Button --------
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete Post";
  deleteBtn.className =
    "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded";
  deleteBtn.dataset.actionList = JSON.stringify([
  {
    type: "click",
    action: "openDeletePostModal",
    eventParameter: { post_id: data.post_id },
  },
  ]);


  // 插入 menuDiv
  menuDiv.appendChild(deleteBtn);
// 把東西組起來
menuWrap.appendChild(menuBtn);
menuWrap.appendChild(menuDiv);

topRow.appendChild(avatar);
topRow.appendChild(titleEl);
topRow.appendChild(menuWrap);
  card.appendChild(topRow);
  // 語言
  if (data.userLang?.nativelanguage || data.userLang?.targetlanguage) {
      const langDiv = document.createElement("div");
    langDiv.className = "text-xs text-gray-500";

    const parts = [];

    if (data.userLang.nativelanguage) {
       parts.push(`Native: ${data.userLang.nativelanguage}`);
    }
    if (data.userLang.targetlanguage) {
       parts.push(`Target: ${data.userLang.targetlanguage}`);
    }

    // 用分隔線「|」或「•」拼接
    langDiv.textContent = parts.join(" | ");

    // 也可以換成圓點：
    // langDiv.textContent = parts.join(" • ");

    card.appendChild(langDiv);

  }

  // 時間
  const time = document.createElement("span");
  time.className = "text-xs text-gray-400 block pb-3 pt-1";

  if (data.created_at) {
    const date = new Date(data.created_at);
    time.textContent = date.toLocaleString("en-US",{
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    time.textContent = "";
  }

  card.appendChild(time);


  // 內容
  const content = document.createElement("p");
  content.className = "text-base mb-2";
  content.textContent = data.content || "";
  card.appendChild(content);

  // 圖片
  if (data.image_url) {
    const imgContent = document.createElement("img");
    imgContent.src = data.image_url;
    imgContent.alt = "Post Image";
    imgContent.className =
      "w-full max-h-64 object-contain rounded-lg mb-2 border";
    card.appendChild(imgContent);
  }

  // Like 區塊 (SVG)
  const likeRow = document.createElement("div");
  likeRow.className = "flex items-center mt-2 space-x-2";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", `selfpage-likebutton-${data.post_id}`);
  svg.setAttribute("data-action", "like-toggle");
  svg.setAttribute("data-post-id", data.post_id);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("class", "heart-icon w-7 h-7 cursor-pointer");
  svg.setAttribute("role", "button");
  svg.setAttribute("aria-label", data.userlikeit ? "Unlike" : "Like");
  svg.dataset.actionList=JSON.stringify([{"type":"click","action":"like_or_unlike","eventParameter":{"post_id":post_id,"from":"/service/createUserSelfPostCard.js"}}])

  setHeartState(svg, !!data.userlikeit);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute(
    "d",
    `M21 8.25c0-2.485-2.099-4.5-4.688-4.5
     -1.935 0-3.597 1.126-4.312 2.733
     -.715-1.607-2.377-2.733-4.313-2.733
     C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z`
  );
  svg.appendChild(path);

  const likeCount = document.createElement("span");
  likeCount.className = "like-count text-sm";
  likeCount.id = `selfpage-likecount-${data.post_id}`;
  likeCount.textContent = String(parseIntOrZero(data.like_count));

  likeRow.appendChild(svg);
  likeRow.appendChild(likeCount);
  card.appendChild(likeRow);

  // Like 切換事件

 

  return card;
}

/**
 * 建立 UserSelfPage 的骨架貼文卡
 */
export function createSkeletonUserSelfPagePostCard(post_id) {
  const card = document.createElement("div");
  card.className =
    "w-[90%] rounded-2xl shadow p-4 bg-white mb-6 border border-gray-200 animate-pulse";
  card.dataset.postId = post_id;

  const topRow = document.createElement("div");
  topRow.className = "flex items-center mb-2 space-x-3";

  const avatarSk = document.createElement("div");
  avatarSk.className =
    "w-10 h-10 bg-gray-300 rounded-full border border-gray-200";

  const titleSk = document.createElement("div");
  titleSk.className = "h-5 bg-gray-300 rounded w-1/4";

  const menuWrap = document.createElement("div");
  menuWrap.className = "ml-auto relative";
  const menuSk = document.createElement("div");
  menuSk.className = "w-6 h-6 bg-gray-200 rounded";
  menuWrap.appendChild(menuSk);

  topRow.appendChild(avatarSk);
  topRow.appendChild(titleSk);
  topRow.appendChild(menuWrap);
  card.appendChild(topRow);

  const langSk = document.createElement("div");
  langSk.className = "h-3 bg-gray-200 rounded w-1/3 mb-2";
  card.appendChild(langSk);

  const timeSk = document.createElement("div");
  timeSk.className = "h-2 bg-gray-200 rounded w-1/6 mb-3";
  card.appendChild(timeSk);

  const contentSk = document.createElement("div");
  contentSk.className = "w-full h-4 bg-gray-300 rounded mb-2";
  card.appendChild(contentSk);

  const contentSk2 = document.createElement("div");
  contentSk2.className = "w-5/6 h-4 bg-gray-200 rounded mb-2";
  card.appendChild(contentSk2);

  const imgSk = document.createElement("div");
  imgSk.className = "w-full h-40 bg-gray-200 rounded-lg mb-2 border";
  card.appendChild(imgSk);

  const likeRow = document.createElement("div");
  likeRow.className = "flex items-center mt-2 space-x-2";

  const likeIconSk = document.createElement("div");
  likeIconSk.className = "w-7 h-7 bg-gray-200 rounded";

  const likeCountSk = document.createElement("div");
  likeCountSk.className = "h-4 w-8 bg-gray-200 rounded";

  likeRow.appendChild(likeIconSk);
  likeRow.appendChild(likeCountSk);
  card.appendChild(likeRow);

  return card;
}

