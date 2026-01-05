import { getPostCardData } from '../service/postCardData.js';
import {fetchUserProfilePicUrl} from "/service/getUserProfile.js";


export function setHeartState(svg, likeCountEl, liked) {
  if (liked) {
    svg.setAttribute("fill", "red");
    svg.setAttribute("stroke", "red");
    likeCountEl.style.color = "red"; 
    svg.setAttribute("data-liked", "true");
  } else {
    svg.setAttribute("fill", "white"); // 空心
    svg.setAttribute("stroke", "black"); 
    svg.setAttribute("data-liked", "false");
    likeCountEl.style.color = "black"; 
  }
  
}

export async function createPostCard(post_id, options = {}) {
  const { onOpenProfile, toggleLike ,getLikeIt=true} = options;

  const data = await getPostCardData(post_id,getLikeIt);
  console.log("./service/postCardData.js createPostCard data:", data);
  if (!data){ 
	  return null;
  }


   if (data.status === "error" && parseInt(data.code, 10) === 403) {
     const inner = data.data || {}; // ✅ 取內層物件
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

     // top row (頭像 + 名字)
     const topRow = document.createElement("div");
     topRow.className = "flex items-center mb-2 space-x-3";

     const avatar = document.createElement("img");
     avatar.src = inner.profilePicture_url || "/images/default-avatar.png";
     avatar.alt = `${inner.author_name || "User"} avatar`;
     avatar.className = "w-10 h-10 rounded-full object-cover border border-gray-300";

     const titleEl = document.createElement("h2");
     titleEl.className = "font-bold text-lg flex-1";
     titleEl.textContent = inner.author_name || "?";

     topRow.appendChild(avatar);
     topRow.appendChild(titleEl);
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
     msg.textContent = data.message || "This post is unavailable to you.";
     card.appendChild(msg);

     return card;
   }



  function parseIntOrZero(x) {
    const n = parseInt(x, 10);
    return Number.isFinite(n) ? n : 0;
  }

  // -------- card --------
  const card = document.createElement("div");
  card.className =
    "w-[90%] min-w-0 rounded-2xl shadow p-4 bg-white mb-6 border border-gray-200";
  card.dataset.postId = data.post_id;

  // top row
  const topRow = document.createElement("div");
  topRow.className = "flex items-center mb-2 space-x-3";

  // Avatar
  const avatar = document.createElement("img");
  avatar.src = data.profilePicture_url || "";
  avatar.alt = `${data.author_name || "User"} avatar`;
  avatar.className = "w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer";
  avatar.dataset.actionList=JSON.stringify([{"type":"click","action":"openUserPage","eventParameter":{"author_id":data.author_id,"post_id":post_id,"from":"/service/createPostCard.js"}}]);
  // Title (作者名稱)
  const titleEl = document.createElement("h2");
  titleEl.className = "font-bold text-lg flex-1 cursor-pointer"; // 撐開中間空間
  titleEl.textContent = data.author_name || "Unknown";
  titleEl.dataset.actionList=JSON.stringify([{"type":"click","action":"openUserPage","eventParameter":{"author_id":data.author_id,"post_id":post_id,"from":"/service/createPostCard.js"}}]);

  // Menu Wrapper
  const menuWrap = document.createElement("div");
  menuWrap.className = "ml-auto relative flex items-center space-x-2"; // 推到最右

  // --- menuWrap 一開始保持你原本的 flex 設定 ---
  // menuWrap.className = "ml-auto relative flex items-center space-x-2";

  // Send Message Button
  const sendMessageByPostBtn = createSendMessageByPostButton({
    author_id: data.author_id,
    post_id: data.post_id
  });

  // 🟢 NEW: 建立 menuWrapper（讓 menu 定位正確）
  const menuWrapper = document.createElement("div");
  menuWrapper.className = "relative"; // 重要！讓 menuDiv 用它來定位

  // -------- Menu Button --------
  const menuBtn = document.createElement("button");
  menuBtn.className =
    "text-gray-400 px-2 py-1 rounded hover:bg-gray-100 transition";
  menuBtn.dataset.action = "post-menu";
  menuBtn.dataset.menuId = `mainPage-menu-${data.post_id}`;
  menuBtn.textContent = "⋯";
  menuBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "togglePostMenu",
      eventParameter: { menuId: `mainPage-menu-${data.post_id}` }
    }
  ]);

  // -------- Menu Div --------
  const menuDiv = document.createElement("div");
  menuDiv.className =
    "absolute z-10 right-0 mt-2 hidden bg-white rounded shadow border p-2 w-40";
  menuDiv.id = `mainPage-menu-${data.post_id}`;

  // -------- Report Button --------
  const reportBtn = document.createElement("button");
  reportBtn.textContent = "Report Post";
  reportBtn.className =
    "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded";
  reportBtn.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "openReportPostModal",
      eventParameter: { post_id: data.post_id }
    }
  ]);

  menuDiv.appendChild(reportBtn);

  // 🟢 組 menuWrapper（正確做法）
  menuWrapper.appendChild(menuBtn);
  menuWrapper.appendChild(menuDiv);

  // 🟢 最後組回 menuWrap
  menuWrap.appendChild(sendMessageByPostBtn);
  menuWrap.appendChild(menuWrapper);

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

  // Like 區塊
  const likeRow = document.createElement("div");
  likeRow.className = "flex items-center mt-2 space-x-2";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", `mainpage-likebutton-${data.post_id}`);
  svg.setAttribute("data-action", "like-toggle");
  svg.setAttribute("data-post-id", data.post_id);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("class", "heart-icon w-7 h-7 cursor-pointer");
  svg.setAttribute("role", "button");
  svg.setAttribute(
    "aria-label",
    data.userlikeit ? "Unlike" : "Like"
  );

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

  svg.dataset.actionList=JSON.stringify([{"type":"click","action":"like_or_unlike","eventParameter":{"post_id":post_id,"from":"/service/createPostCard.js"}}]);



  const likeCount = document.createElement("span");
  likeCount.className = "like-count text-sm";
  likeCount.id = `mainpage-likecount-${data.post_id}`;
  likeCount.textContent = String(parseIntOrZero(data.like_count));

  // 初始化愛心狀態
  setHeartState(svg, likeCount, !!data.userlikeit);

  

  likeRow.appendChild(svg);
  likeRow.appendChild(likeCount);
  card.appendChild(likeRow);

  return card;
}
export function createSkeletonPostCard(post_id) {
  console.log("ui/ui_create.js: createSkeletonPostCard: post_id:", post_id);
  const card = document.createElement("div");
  card.className =
    "w-[90%] min-w-0 rounded-2xl shadow p-4 bg-white mb-6 border border-gray-200 animate-pulse";
  card.dataset.postId = post_id;

  // top row
  const topRow = document.createElement("div");
  topRow.className = "flex items-center mb-2 space-x-3";

  // 頭像 skeleton
  const avatarSk = document.createElement("div");
  avatarSk.className = "w-10 h-10 bg-gray-300 rounded-full border border-gray-200";

  // 標題 skeleton
  const titleSk = document.createElement("div");
  titleSk.className = "h-5 bg-gray-300 rounded w-1/4";

  // menu skeleton (對齊右側)
  const menuWrap = document.createElement("div");
  menuWrap.className = "ml-auto relative flex items-center space-x-2";
  const menuSk = document.createElement("div");
  menuSk.className = "w-6 h-6 bg-gray-200 rounded";
  menuWrap.appendChild(menuSk);

  topRow.appendChild(avatarSk);
  topRow.appendChild(titleSk);
  topRow.appendChild(menuWrap);
  card.appendChild(topRow);

  // 語言 skeleton
  const langSk = document.createElement("div");
  langSk.className = "h-3 bg-gray-200 rounded w-1/3 mb-2";
  card.appendChild(langSk);

  // 時間 skeleton
  const timeSk = document.createElement("div");
  timeSk.className = "h-2 bg-gray-200 rounded w-1/6 mb-3";
  card.appendChild(timeSk);

  // 內容 skeleton
  const contentSk = document.createElement("div");
  contentSk.className = "w-full h-4 bg-gray-300 rounded mb-2";
  card.appendChild(contentSk);

  const contentSk2 = document.createElement("div");
  contentSk2.className = "w-5/6 h-4 bg-gray-200 rounded mb-2";
  card.appendChild(contentSk2);

  // 圖片 skeleton
  const imgSk = document.createElement("div");
  imgSk.className = "w-full h-40 bg-gray-200 rounded-lg mb-2 border";
  card.appendChild(imgSk);

  // Like區塊 skeleton
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


export function createSendMessageByPostButton({
  post_id = "",
  author_id = "",
  extraClass = "",
} = {}) {
  const SendMessageByPostButton = document.createElement("button");
  SendMessageByPostButton.className =
    "p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition flex items-center justify-center " +
    extraClass;

  // Icon
  const iconEl = document.createElement("i");
  iconEl.className = `ti ti-message-circle text-xl md:text-2xl`;
  SendMessageByPostButton.appendChild(iconEl);

  // dataset.actionList
  SendMessageByPostButton.dataset.actionList = JSON.stringify([
    {
      type: "click",
      action: "openChatRoom",
      eventParameter: {
        user_id: author_id,     // 馬上使用
        from: "blockedFriendElement",
        post_id: post_id        // 雖然現在不用，但先保留
      },
    },
  ]);

  return SendMessageByPostButton;
}

