// /event/handlers/editAvatarModal.js
import { eventBus } from "../../utils/eventBus.js";
import {
  openEditAvatarModal as pageOpenEditAvatarModal,
  closeEditAvatarModal as pageCloseEditAvatarModal,
  submitEditAvatarModal as pageSubmitEditAvatarModal,
  updateEditAvatarModalFile as pageUpdateEditAvatarModalFile,
  submitDeleteAvatarModal as pageSubmitDeleteAvatarModal,
  openEditLanguageModal as pageOpenEditLanguageModal,
  closeEditLanguageModal as pageCloseEditLanguageModal,
  submitEditLanguageModal as pageSubmitEditLanguageModal,
  updateEditLanguageModal as pageUpdateEditLanguageModal,
  openEditUsernameModal,
  closeEditUsernameModal,
  submitEditUsernameModal,
  updateEditUsernameModal as pageUpdateEditUsernameModal,
} from "../../pages/userSelfPage.js";

/** -------- Avatar Modal -------- */
function openEditAvatarModal() {
  console.log("[editAvatarModal] openEditAvatarModal");
  pageOpenEditAvatarModal();
}

function closeEditAvatarModal() {
  console.log("[editAvatarModal] closeEditAvatarModal");
  pageCloseEditAvatarModal();
}

function submitEditAvatarModal() {
  console.log("[editAvatarModal] submitEditAvatarModal");
  pageSubmitEditAvatarModal();
}

/** -------- Language Modal -------- */
function openEditLanguageModal(nativelanguage = "", targetlanguage = "") {
  console.log("[editLanguageModal] openEditLanguageModal:", {
    nativelanguage,
    targetlanguage,
  });
  pageOpenEditLanguageModal(nativelanguage, targetlanguage);
}

function closeEditLanguageModal() {
  console.log("[editLanguageModal] closeEditLanguageModal");
  pageCloseEditLanguageModal();
}

function submitEditLanguageModal() {
  console.log("[editLanguageModal] submitEditLanguageModal");
  pageSubmitEditLanguageModal();
}

/** -------- 統一註冊函式 -------- */
export function registerUserSelfModalHandlers() {
  /** 🧩 Avatar Events */
  eventBus.on("openEditAvatarModal", (params) => {
    console.log("[event] openEditAvatarModal:", params);
    openEditAvatarModal();
  });

  eventBus.on("closeEditAvatarModal", (params) => {
    console.log("[event] closeEditAvatarModal:", params);
    closeEditAvatarModal();
  });

  eventBus.on("submitEditAvatarModal", (params) => {
    console.log("[event] submitEditAvatarModal:", params);
    submitEditAvatarModal();
  });
  eventBus.on("editAvatarModalSelectFile", (params) => {
    console.log("[event] editAvatarModalSelectFile:", params);
    pageUpdateEditAvatarModalFile(params?.file || null);
  });

  eventBus.on("submitDeleteAvatarModal", (params) => {
    console.log("[event] submitDeleteAvatarModal:", params);
    pageSubmitDeleteAvatarModal();
  });

  /** 🧩 Language Events */
  eventBus.on("openEditLangModal", (params, el) => {
    console.log("[event] openEditLangModal:", params);

    let nativelanguage = "";
    let targetlanguage = "";

    if (el && el.dataset && el.dataset.langInfo) {
      try {
        const langInfo = JSON.parse(el.dataset.langInfo);
        if (langInfo && typeof langInfo === "object") {
          if (langInfo.nativelanguage) nativelanguage = String(langInfo.nativelanguage);
          if (langInfo.targetlanguage) targetlanguage = String(langInfo.targetlanguage);
        }
      } catch (e) {
        console.warn("[event] openEditLangModal: invalid data-lang-info JSON:", e);
      }
    }

    if (params && typeof params === "object") {
      if (params.nativelanguage) nativelanguage = String(params.nativelanguage);
      if (params.targetlanguage) targetlanguage = String(params.targetlanguage);
    }

    openEditLanguageModal(nativelanguage, targetlanguage);
  });

  eventBus.on("closeEditLanguageModal", (params) => {
    console.log("[event] closeEditLanguageModal:", params);
    closeEditLanguageModal();
  });

  eventBus.on("submitEditLanguageModal", (params) => {
    console.log("[event] submitEditLanguageModal:", params);
    submitEditLanguageModal();
  });
  eventBus.on("editLanguageModalInput", (params) => {
    console.log("[event] editLanguageModalInput:", params);
    pageUpdateEditLanguageModal(params?.field || "", params?.value || "");
  });
  eventBus.on("openEditUsernameModal", (params) => {
    console.log("[event] openEditUsernameModal:", params);
    openEditUsernameModal(params?.currentUsername || "");
  });

  eventBus.on("closeEditUsernameModal", (params) => {
    console.log("[event] closeEditUsernameModal:", params);
    closeEditUsernameModal();
  });

  eventBus.on("submitEditUsernameModal", (params) => {
    console.log("[event] submitEditUsernameModal:", params);
    submitEditUsernameModal();
  });
  eventBus.on("editUsernameModalInput", (params) => {
    console.log("[event] editUsernameModalInput:", params);
    pageUpdateEditUsernameModal(params?.username || "");
  });

  console.log("✅ registerUserSelfModalHandlers: avatar & language modal events registered.");
}
