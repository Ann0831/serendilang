// --- File: ./call/bootstrap.js
// Minimal glue: choose your ids ONCE here; everywhere else is algebraic/parameterized.

import { CallController,createCallEngine } from "./controller.js";

import {soundPlayer} from "/utils/soundPlayer.js";

// Supply these dynamically from your app/session state:
const SELF_ID = window.__CURRENT_USER_ID__;
const PEER_ID = window.__TARGET_USER_ID__;
const RTC_CONFIG = window.__RTC_CONFIG__ || { iceServers: [] };
const STUN_ONLY_RTC_CONFIG=window.Only__Stun__RTC_CONFIG__ || { iceServers: [] };
const TURN_ONLY_RTC_CONFIG=window.Only__Turn__RTC_CONFIG__  || { iceServers: [] };
const EXTERNAL_ONLY_RTC_CONFIG=window.Only__External__RTC_CONFIG__  || { iceServers: [] };

const useCamera= window.__ENABLE_CAMERA__==="1"?true:false;
const callId=window.__CALL_EXTERNAL_ID__ ;


const controller = createCallEngine({ configs:[RTC_CONFIG,STUN_ONLY_RTC_CONFIG,TURN_ONLY_RTC_CONFIG,EXTERNAL_ONLY_RTC_CONFIG],callId:callId,selfId: SELF_ID, peerId: PEER_ID, rtcConfig: RTC_CONFIG,rtcConfig: RTC_CONFIG,Only_Stun_rtcConfig:STUN_ONLY_RTC_CONFIG,Only_External_rtcConfig:EXTERNAL_ONLY_RTC_CONFIG, signalingPath: "/",queryString:("type=Call&&"+"user_id="+SELF_ID+"&&target_id="+PEER_ID),isCaller:true ,useCamera},false);

function initStartButton() {
  const startBtn = document.getElementById("StartCallButton");
  const startOverlay = document.getElementById("StartCallOverlay");

  if (!startBtn || !startOverlay) return;

  startBtn.addEventListener("click", () => {
    startOverlay.classList.add("hidden");
    
    try {
      controller.mount();
    } catch (err) {
      console.error("Start button mount failed:", err);
    }
    try{
      //soundPlayer.loop("/assets/sounds/dialing_sound(canon).mp3",1);

    }catch(error){


    }

  });
}

function initCameraToggleButton() {
  const camBtn = document.getElementById("toggleCameraBtn");
  if (!camBtn) {
    return;
  }

  // 初始狀態
  camBtn.textContent = controller.cameraEnabled
    ? "Disable Camera"
    : "Enable Camera/Voice";

  // 🌈 初始顏色
  if (controller.cameraEnabled) {
    camBtn.classList.add("bg-gray-800");  // disabled 狀態
  } else {
    camBtn.classList.add("bg-green-600"); // enable 狀態
  }

  camBtn.addEventListener("click", async () => {
    camBtn.disabled = true;
    camBtn.classList.add("opacity-50", "cursor-not-allowed");

    try {

      // ------ 開鏡頭 (從 OFF → ON) ------
      if (!controller.cameraEnabled) {
        try {
          await controller.enableCamera();
          controller.cameraEnabled = true;

          camBtn.textContent = "Disable Camera";

          // 💚 啟用 → 用灰色（因為此時顯示的是 Disable）
          camBtn.classList.remove("bg-green-600");
          camBtn.classList.add("bg-gray-800");

        } catch (err) {
          console.error("Enable camera failed:", err);
        }

      } else {

        // ------ 關鏡頭 (從 ON → OFF) ------
        try {
          await controller.disableCamera();
          controller.cameraEnabled = false;

          camBtn.textContent = "Enable Camera/Voice";

          // 💚 回到可以啟用 → 綠色
          camBtn.classList.remove("bg-gray-800");
          camBtn.classList.add("bg-green-600");

        } catch (err) {
          console.error("Disable camera failed:", err);
        }
      }

    } finally {
      camBtn.disabled = false;
      camBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  });
}



initStartButton();
initCameraToggleButton();
window.turnoffcall = () => controller.turnOffCall();
window.cancelCallRequest=() => controller.cancelCallRequest();

window.addEventListener("beforeunload", () => {
  try {   
    controller.turnOffCallSync();
  } catch (err) {
    console.warn("beforeunload cleanup failed:", err);
  }
});




