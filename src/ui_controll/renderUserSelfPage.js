import { fetchUserLanguage, fetchUserProfilePicUrl, fetchUsername } from "../service/getUserSelfBasicData.js";

export async function renderUserSelfPage() {
  try {
    // 直接呼叫 service，不用管 userId
    const [language, profilePicUrl, username] = await Promise.all([
      fetchUserLanguage(),
      fetchUserProfilePicUrl(),
      fetchUsername()
    ]);

    // 更新頭貼
    const profilePicEl = document.getElementById("userselfpage-profile-pic");
    if (profilePicEl) {
      profilePicEl.src = profilePicUrl;
    }

    // 更新使用者名稱
    const usernameEl = document.getElementById("userselfpage-username");
    if (usernameEl) {
      usernameEl.textContent = username || "Unknown User";
    }

    // 更新語言
    const targetLangEl = document.getElementById("userselfpage-targetlanguage");
    if (targetLangEl) {
      targetLangEl.textContent = `Target: ${language?.targetlanguage || "?"}`;
    }

    const nativeLangEl = document.getElementById("userselfpage-nativelanguage");
    if (nativeLangEl) {
      nativeLangEl.textContent = `Native: ${language?.nativelanguage || "?"}`;
    }


    const editLangEl = document.getElementById("userselfpage-edit-language-btn");
    if (editLangEl) {
      editLangEl.dataset.langInfo = JSON.stringify({targetlanguage:language?.targetlanguage,nativelanguage:language?.nativelanguage});
    }



    console.log("✅ renderUserSelfPage success:", { username, language, profilePicUrl });
  } catch (err) {
    console.error("❌ renderUserSelfPage error:", err);
  }
}

