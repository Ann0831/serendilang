import "../css/index.css";
import { registerRootPageEventHandlers } from "../event/rootpageEventHandlers.js";
import { initializeEmitEvent } from "../event/eventEmitter.js";
import { initTopBar } from "../pages/topBar.js";
import { initNotLoginPostPage } from "./init_not_login_Post.js";
import { initErrorMessagesPage } from "../pages/errorMessagesPage.js";
import { initNotificationMessagesPage } from "../pages/notificationMessagesPage.js";
import { isTestEnv } from "../environment/env.js";
import { setTestLoginState } from "../api/post_api.client.js";

function detectLocale() {
  if (typeof navigator === "undefined") return "en";
  const lang = String(navigator.language || "").toLowerCase();
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

function applyRootPageLocale() {
  const locale = detectLocale();
  if (locale !== "zh") return;

  const byId = (id) => document.getElementById(id);
  const title1 = byId("root-cta-title-1");
  const title2 = byId("root-cta-title-2");
  const desc = byId("root-cta-desc");
  const login = byId("root-cta-login");
  const register = byId("root-cta-register");
  const welcome = byId("root-welcome-title");

  if (title1) {
    if (title1.firstChild?.nodeType === Node.TEXT_NODE) {
      title1.firstChild.nodeValue = "找到新朋友 ";
    } else {
      title1.insertBefore(document.createTextNode("找到新朋友 "), title1.firstChild || null);
    }
  }
  if (title2) title2.textContent = "在一起學語言的同時，交到真正的朋友。";
  if (desc) desc.textContent = "與世界各地的人聊天、每天練習，並在 Serendilang 建立有意義的連結。";
  if (login) login.textContent = "登入";
  if (register) register.textContent = "註冊";
  if (welcome) welcome.textContent = "歡迎來到 Serendilang - 語言交換（Beta）";
}

function animateRootWelcomeBanner() {
  const banner = document.getElementById("root-welcome-banner");
  if (!banner) return;
  requestAnimationFrame(() => {
    banner.classList.remove("opacity-0", "translate-y-3");
    banner.classList.add("opacity-100", "translate-y-0");
  });
}

function animateRootLeftCta() {
  const cta = document.getElementById("root-cta-left");
  if (!cta) return;
  requestAnimationFrame(() => {
    cta.classList.remove("opacity-0", "-translate-x-3");
    cta.classList.add("opacity-100", "translate-x-0");
  });
}

async function initializeRootPage() {
  if (isTestEnv) {
    try {
      await setTestLoginState(false);
    } catch (err) {
      console.warn("[rootpage_initializer] setTestLoginState(false) failed:", err);
    }
  }

  registerRootPageEventHandlers();
  initializeEmitEvent();
  applyRootPageLocale();
  initTopBar();
  initErrorMessagesPage();
  initNotificationMessagesPage();
  initNotLoginPostPage();
  animateRootWelcomeBanner();
  animateRootLeftCta();
}

void initializeRootPage();
