// --- File: ./call/controller.js
// The orchestrator. Only here do we bind concrete IDs/params.

import { SIGNALING_URL, createSocket } from "/call_wss/config.js";
import { sendOffer, sendAnswer, sendCandidate,sendCancelCallRequest, sendCallRequest, sendAgreeCall, sendTurnOffCall, notifyCallSuccess, sendReplyCallRequest } from "/call_wss/signaling.js";
import { newPeerConnection, getLocalStream, createAndSetLocalOffer, createAndSetLocalAnswer, setRemote, addRemoteCandidate, teardownPeer } from "/rtc/core.js";
import {initializePeer} from "/rtc/initializePeer.js";

import { attachLocalStream, attachRemoteStream, resetStreams, hideVideos, bindResizeAutoPlay } from "/rtc/domVideo.js";
import { sleep } from "/utils/time.js";
import { showCallEndOverlay,showDialing, hideDialing, showEndCallButton, showTimeoutAndHideDialing, setDialingBusyCopy,set_target_username,set_target_avatar,loadTargetLanguageInfo } from "/call_ui/callUi.js";

import {fetchUserRealtimeStatus} from "/service/realTimeService.js";
import {recordCallIceDisconnected} from "/service/analyticsService.js ";

import {eventBus} from  "/utils/callEventBus.js";

import {soundPlayer} from "/utils/soundPlayer.js";
import {createFakeVideoTrack} from "/utils/createEmptyTrack.js";
//ui

import {showStopSign} from "/call_ui/stopSign.js";
import {showWssDisconnectedNotice,hideWssDisconnectedNotice,showIceReconnectingOverlay,hideIceReconnectingOverlay} from "/call_ui/disconnect_retryUi.js";


const max_config_id=2;

export let callEngine=null;

export function createCallEngine(params,forceStart=false){
    callEngine=new CallController(params);
    
    callEngine.initialize();
    if(forceStart){
      callEngine.mount();
    }

    return callEngine;
}

export class CallController {
  /**
   * @param {Object} opts
   * @param {string} opts.selfId - current user id
   * @param {string} opts.peerId - target user id
   * @param {RTCConfiguration} opts.rtcConfig
   * @param {string} [opts.signalingPath] - e.g. "/ws"
   */
  constructor({ configs,callId,selfId, peerId, rtcConfig,Only_Stun_rtcConfig,Only_External_rtcConfig, signalingPath = "/ws",queryString = "",isCaller=false,useCamera=false }) {
    console.log("/call/controller.js: constructor: queryString: ",queryString);
    console.log("/call/controller.js: constructor: Only_Stun_rtcConfig: ",Only_Stun_rtcConfig);
    console.log("/call/controller.js: constructor: Only_External_rtcConfig: ",Only_External_rtcConfig);
    
    this.configs=configs;
    this.config_id=0;
    this.callId=callId
    this.selfId = selfId;
    this.peerId = peerId;
    this.rtcConfig = rtcConfig;
    this.Only_Stun_rtcConfig = Only_Stun_rtcConfig;
    this.Only_External_rtcConfig=Only_External_rtcConfig;
    this.targetId = peerId; // used for DOM id suffix
    this.queryString = queryString;   // 新增這行
    this.socket = null;
    this.peer = null;
    this.localStream = null;
    this.isCaller=isCaller;
	
    this.callStart=false;
    this.state="pending";
    this.useCamera=useCamera;
    this.cameraEnabled=useCamera;
    this.lastRestartSocketTime=0;
    bindResizeAutoPlay(this.targetId);
  }


  async initialize(){
    console.log("/call/controller.js: initialize(): this.queryString: ",this.queryString);
    this.state="initiating";
    const [username, avatarUrl, langInfo] = await Promise.all([
        set_target_username(this.targetId),
        set_target_avatar(this.targetId),
        loadTargetLanguageInfo(this.targetId),
    ]);

    this.target_username = username;
    this.target_avatarUrl = avatarUrl;
    this.target_langInfo = langInfo;

  }
  async mount() {
    this.state="initiating";
    console.log("/call/controller.js: mount(): this.queryString: ",this.queryString);
    const target_RealtimeStatus=await fetchUserRealtimeStatus(this.peerId);
    if(target_RealtimeStatus){
	   console.log("target_RealtimeStatus: ",target_RealtimeStatus);
	   if(this.isCaller&&target_RealtimeStatus.isCallingYou){
		const url = new URL("/accept-call", window.location.origin);
  		url.searchParams.set("target_id", this.targetId);
  		url.searchParams.set("useCamera", this.useCamera ? "1" : "0");
		window.location.replace(url);
		return ;

	   }

	    if(this.isCaller&&(!target_RealtimeStatus.online)){
		    showStopSign("offline",this.peerId);
		    this.state="dead";
      		    try{
        		console.log("soundPlayer.stopAll();");
        		soundPlayer.stopAll();
        		console.log("soundPlayer.stopAll(); finish");
      		    }catch{

      		    }

		    return ;


	    }

            if(target_RealtimeStatus.inOtherCall){
                    showStopSign("busy",this.peerId);
                    this.state="dead";
                    try{
                        console.log("soundPlayer.stopAll();");
                        soundPlayer.stopAll();
                        console.log("soundPlayer.stopAll(); finish");
                    }catch{

                    }

                    return ;


            }
	    if(!this.isCaller&&!target_RealtimeStatus.isCallingYou){

		    showStopSign("peerLeft",this.peerId);
                    this.state="dead";
                    try{
                        console.log("soundPlayer.stopAll();");
                        soundPlayer.stopAll();
                        console.log("soundPlayer.stopAll(); finish");
                    }catch{

                    }

                    return ;
	    }
	    console.log(target_RealtimeStatus);

    }
    const url = SIGNALING_URL(this.signalingPath,this.queryString);
    this.createAndLoadSocket(url);
  }



  restartSocket() {
    if(this.state==="dead"){
	return;
    }
    if (this.isReconnectingSocket) {
      console.log("🚫 已在重連中，略過");
      return;
    }


    const now = Date.now();
    const elapsed = now - this.lastRestartSocketTime;

    if (elapsed < 5000) {
   	const wait = 5000 - elapsed;
  	console.warn(`⏳ 重啟太頻繁 (${elapsed}ms)，將在 ${wait}ms 後重啟`);
  	setTimeout(() => {
    	this.restartSocket();
  	}, wait);
      return;
    }


    this.isReconnectingSocket = true;
    this.lastRestartSocketTime = now;

    console.log("🔄 嘗試重新連線 WebSocket...");

    try {
      const url = SIGNALING_URL(this.signalingPath, this.queryString);

      setTimeout(async () => {
        try {
          await this.createAndLoadSocket(url);
          console.log("✅ WebSocket 重啟成功");
        } catch (err) {
          console.error("❌ WebSocket 重啟失敗:", err);
        } finally {
          this.isReconnectingSocket = false; // 🔓 無論成功失敗都釋放鎖
        }
      }, 1000);

    } catch (err) {
      console.error("❌ restartSocket 發生錯誤:", err);
    } finally {
      // 保險機制：3 秒後若仍未釋放鎖，強制釋放
      setTimeout(() => {
        this.isReconnectingSocket = false;
      }, 3000);
    }
  }


  createAndLoadSocket(url){
    this.socket = createSocket(url);
    bindCallSocketHandlers(this.socket, this);
    // 如果此時連線已成功（極少數情況），手動補觸發
    if (this.socket.readyState === WebSocket.OPEN) {
  	console.log("⚡ WebSocket 在綁定前已連線成功 → 補觸發 onopen()");
  	socket.onopen();
    }

  }

  async prepareLocal() {
    if (!this.localStream) {
      this.localStream = await getLocalStream({ video: this.cameraEnabled, audio: true });
      if (this.localStream.getVideoTracks().length === 0) {
        const fakeTrack = createFakeVideoTrack();
        this.localStream.addTrack(fakeTrack);
        console.warn("🎭 使用 fake video track");
      }
      attachLocalStream(this.targetId, this.localStream);
    }
  }

  async startWebRTC({ isCaller}) {
    console.log("startWebRTC");
    if (this.peer) {
      try {
        console.warn("⚠️ 已存在舊 peer，先清理");
        this.peer.onicecandidate = null;
        this.peer.ontrack = null;
        this.peer.onconnectionstatechange = null;
        this.peer.oniceconnectionstatechange = null;
        this.peer.close();
      } catch (err) {
        console.error("⚠️ 關閉舊 peer 時出錯：", err);
      }
      this.peer = null;
    }

    this.callStart=true;
    

    this.peer = newPeerConnection(this.configs[this.config_id]);
    this.peerSenders=[];
    initializePeer({peer: this.peer,localStream: this.localStream});
  // 🎤  加入本地音視訊軌道
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          const sender=this.peer.addTrack(track, this.localStream);
          this.peerSenders.push(sender);
        } catch (err) {
          console.warn("addTrack 失敗：", err);
        }
      });
    }
    console.log("this.peerSenders: ",this.peerSenders);
 
    if (isCaller) {
      const offer = await createAndSetLocalOffer(this.peer);
      sendOffer(this.socket, { offer, to: this.peerId, from: this.selfId,config_id:this.config_id });
    }
  }



  async receiveOffer(offer,config_id) {
    if (this.peer) {
      try {
        console.warn("⚠️ 已存在舊 peer，先清理");
        this.peer.onicecandidate = null;
        this.peer.ontrack = null;
        this.peer.onconnectionstatechange = null;
        this.peer.oniceconnectionstatechange = null;
        this.peer.close();
      } catch (err) {
        console.error("⚠️ 關閉舊 peer 時出錯：", err);
      }
      this.peer = null;
    }
    this.config_id=config_id||0;
    

    this.peer = newPeerConnection(this.configs[this.config_id]);
    this.peerSenders=[];
    	  
    initializePeer({peer: this.peer,localStream: this.localStream});
    
  // 🎤   加入本地音視訊軌道
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          const sender=this.peer.addTrack(track, this.localStream);
          this.peerSenders.push(sender);
        } catch (err) {
          console.warn("addTrack 失敗：", err);
        }
      });
    }
    await setRemote(this.peer, offer);
    console.log("setRemoteDescription: offer");
    const answer = await createAndSetLocalAnswer(this.peer);
    sendAnswer(this.socket, { answer, to: this.peerId, from: this.selfId });
  }


  async enableCamera() {
    // 1. 取得相機畫面
    this.cameraEnabled = true;
    const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const realTrack = camStream.getVideoTracks()[0];

    // 2. 找到原本 video sender
    const videoSender = this.peerSenders?.find(s => s.track && s.track.kind === "video");
    if(!this.peer){
      console.log("enableCamera: no peer");
      return;

    }
    if (!videoSender) {
      console.error("❌  找不到 video sender（可能還沒有 addTrack）");
      return;
    }

    // 3. replaceTrack → 對方就會看到你的畫面
    await videoSender.replaceTrack(realTrack);

    // 4. 更新 localStream
    const oldTrack = this.localStream.getVideoTracks()[0];
    if (oldTrack) {
      oldTrack.stop();
      this.localStream.removeTrack(oldTrack);
    }
    this.localStream.addTrack(realTrack);

    console.log("📷r Camera enabled (addTrack 模式)");
  }



  async disableCamera() {
    console.log("📵  disableCamera()...");
    this.cameraEnabled = false;
    const videoSender = this.peerSenders?.find(
      (s) => s.track && s.track.kind === "video"
    );
    if(!this.peer){
      console.log("disableCamera: No peer / No peerSenders");

    }

    if (!videoSender) {
      console.error("❌  disableCamera: 找不到 video sender");
      return;
    }

    // 產生新的 fake video track（外部函式，不用 this）
    const fakeTrack = createFakeVideoTrack();

    // replace real → fake
    await videoSender.replaceTrack(fakeTrack);

    // 更新 localStream（刪舊 → 加新）
    const oldTrack = this.localStream.getVideoTracks()[0];
    if (oldTrack) oldTrack.stop();

    if (oldTrack) this.localStream.removeTrack(oldTrack);
    this.localStream.addTrack(fakeTrack);


    console.log("📵  Camera disabled (fake video is being sent)");
  }


  async makeCall() {
    await this.prepareLocal();
    sendCallRequest(this.socket, { to: this.peerId, from: this.selfId });
    tryNotifyReactNative("isCalling");
    showDialing();
    try{
      soundPlayer.loop("/assets/sounds/dialing_sound(canon).mp3",1);

    }catch(error){


    }
    this.timeoutGuard();
  }

  async answerCall() {
    await this.prepareLocal();
    sendAgreeCall(this.socket, { to: this.peerId, from: this.selfId });
  }
  async forced_turnOffCall(){
    console.log("this.turnOffCall");
    
    this.cleanup();
    hideDialing();
    showCallEndOverlay(this.target_avatarUrl,this.target_langInfo,this.target_username,this.peerId);



  }
  turnOffCallSync() {
     sendTurnOffCall(this.socket, { to: this.peerId, from: this.selfId });
     this.state="dead";

  }
  async cancelCallRequest(){
    console.log("this.cancelCallRequest");
    if(!this.isCaller){
      return;
    }

    hideWssDisconnectedNotice();
    hideDialing();
    try {
      // 送出掛斷訊息
      sendCancelCallRequest(this.socket, { to: this.peerId, from: this.selfId });

      // 🕐 稍微等待封包離開送出緩衝區（建議 50–150ms）
      await new Promise(r => setTimeout(r, 80));

    } catch (err) {
      console.warn("⚠️ turnOffCall 發送訊息時出錯:", err);
    }

    // 🧹 UI 清理
    const overlay = document.getElementById("dialingOverlay");
    if (overlay) overlay.classList.add("hidden");

    // 顯示停止符號提示
    showStopSign("meCancelCall", this.peerId);

    // 🧹 然後再執行清理
    this.cleanup();
  }

  async simpleTurnOffCall(){
    console.log("this.turnOffCall");
    hideWssDisconnectedNotice();
    try {
      // 送出掛斷訊息
      sendTurnOffCall(this.socket, { to: this.peerId, from: this.selfId });
          
    
      // 🕐 稍微等待封包離開送出緩衝區（建議 50–150ms）
      await new Promise(r => setTimeout(r, 80));
        
    } catch (err) {
      console.warn("⚠️ turnOffCall 發送訊息時出錯:", err);
    }
        
    // 🧹 然後再執行清理
    this.cleanup();


  }

  async turnOffCall() {
    console.log("this.turnOffCall");
    hideWssDisconnectedNotice();
    try {
      // 送出掛斷訊息
      sendTurnOffCall(this.socket, { to: this.peerId, from: this.selfId });


      // 🕐 稍微等待封包離開送出緩衝區（建議 50–150ms）
      await new Promise(r => setTimeout(r, 80));

    } catch (err) {
      console.warn("⚠️ turnOffCall 發送訊息時出錯:", err);
    }

    // 🧹 然後再執行清理
    this.cleanup();
    hideDialing();
    showCallEndOverlay(
      this.target_avatarUrl,
      this.target_langInfo,
      this.target_username,
      this.peerId
    );
  }

  cleanup() {
    resetStreams(this.targetId);
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    teardownPeer(this.peer);
    this.peer = null;
    this.state="dead";
    hideVideos(this.targetId);
    // 🔒 關閉 WebSocket 並移除事件監聽
    if (this.socket) {
      try {
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onerror = null;
        this.socket.onclose = null;
        this.socket.close(1000, "Call ended cleanup");
        console.log("🧹 WebSocket 已關閉");
      } catch (err) {
        console.error("⚠️ 關閉 WebSocket 時發生錯誤:", err);
      }
      this.socket = null;
    }
    try{ 
	console.log("soundPlayer.stopAll();");
	soundPlayer.stopAll();
        console.log("soundPlayer.stopAll(); finish");
    }catch{

    }

    
  }

  async timeoutGuard() {
    await sleep(60);
    // 🧹 UI 清理
    const overlay = document.getElementById("dialingOverlay");
    if (overlay) overlay.classList.add("hidden");
    hideWssDisconnectedNotice();

    if (!this.callStart) {
      showStopSign("timeout",this.peerId)
      sendCancelCallRequest(this.socket, { to: this.peerId, from: this.selfId });
      this.cleanup();
      tryNotifyReactNative("endCall");
    }
  }
  peerOnicecandidate(e){
    if (e.candidate) {
      const cand = e.candidate.candidate;
      console.log("🧊 ICE candidate:", cand);

      // 額外解析類型 (host / srflx / relay)
      if (cand.includes("typ relay")) {
        console.log("✅ 使用 TURN 中繼 (relay)");
      } else if (cand.includes("typ srflx")) {
        console.log("🌐 使用 STUN 取得外部 IP (srflx)");
      } else if (cand.includes("typ host")) {
        console.log("🏠 本地連線 (host)");
      }

      sendCandidate(this.socket, { candidate: e.candidate, to: this.peerId, from: this.selfId })
    } else {
      console.log("🏁 ICE candidate 收集完成");
    }


  }
  peerOntrack(e){
    const [remoteStream] = e.streams;
    attachRemoteStream(this.targetId, remoteStream);

  }

  async peerOniceconnectionstatechange(st) {
    console.log("🌐 ICE 狀態變化:", st);

    // ---------- 成功狀態 ----------
    if (st === "connected" || st === "completed") {
      console.log("✅ ICE 已連線成功");
      if (this._disconnectTimer) clearTimeout(this._disconnectTimer);
      if (this._failTimeoutTimer) clearTimeout(this._failTimeoutTimer);
      this._fallbacking = false;
      notifyCallSuccess(this.socket, { to:this.peerId,from: this.selfId, msg: "ICE 連線已成功建立！" });
      hideIceReconnectingOverlay();
      return;
    }

    // ---------- 暫時中斷 ----------
    if (st === "disconnected"||st === "failed" || st === "closed") {
      // 若正在 fallback，就不重複觸發
      if (this._fallbacking) {
        console.log("⏳ 正在進行 fallback，略過此次 disconnected");
        return;
      }

      this._fallbacking = true; // 🔒 上鎖
      console.warn("⚠️ ICE 暫時中斷，3 秒後檢查是否恢復...");
      showIceReconnectingOverlay();
      // 3 秒後檢查是否恢復
      this._disconnectTimer = setTimeout(async () => {
        if (this.peer?.iceConnectionState === "disconnected") {
          console.error("⏰ ICE 已斷線超過 3 秒，啟動 fallback");

          // 避免超出上限
          if (this.config_id >= this.configs.length) {
            console.warn("🚫 所有 config 都已嘗試，停止重啟");
            this._fallbacking = false;
	    this.cleanup();
            //mlog(["ice Failed from 470"]);
	    hideIceReconnectingOverlay();
            showStopSign("iceFailed", this.peerId);
	    recordCallIceDisconnected(this.callId);
            return;
          }

          // 正確遞增
          this.config_id = (this.config_id || 0) + 1;

          // 切換對應 config
          if (this.config_id === 1) this.rtcConfig = this.Only_Stun_rtcConfig;
          else if (this.config_id === 2) this.rtcConfig = this.Only_External_rtcConfig;

          console.warn(`🔁 啟動 fallback 層級 ${this.config_id}`);
          await this.startWebRTC({ isCaller: this.isCaller });
        } else {
          console.log("✅ ICE 在 3 秒內恢復，取消 fallback");
        }

        this._fallbacking = false; // 解鎖
      }, 3000);
    }


    // ---------- 全域 60 秒超時監控 ----------
    if (!this._failTimeoutTimer&&(st === "disconnected"||st === "failed" || st === "closed")) {
      this._failTimeoutTimer = setTimeout(() => {
        const currentState = this.peer?.iceConnectionState;
        if (currentState !== "connected" && currentState !== "completed") {
          console.error("🕒 超時 60 秒仍未連上，視為失敗");
	  this.cleanup();
	  //mlog(["ice Failed from 509"]);
          hideIceReconnectingOverlay();
          showStopSign("iceFailed", this.peerId);
          this._fallbacking = false;
	  recordCallIceDisconnected(this.callId);
        }
      }, 60000);
    }
  }

  peerOnconnectionstatechange(){

  }




}


function mlog(...args) {
  console.log(...args);
  const el = document.getElementById("mobile-log") || (() => {
    const div = document.createElement("div");
    div.id = "mobile-log";
    div.style = "position:fixed;bottom:0;left:0;right:0;height:30%;overflow:auto;background:black;color:#0f0;font-size:12px;z-index:9999;padding:4px;";
    document.body.appendChild(div);
    return div;
  })();
  el.innerHTML += args.join(" ") + "<br>";
}


function tryNotifyReactNative(message) {
  try {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(message);
      console.log("RN msg:", message);
    }
  } catch {}
}


function bindCallSocketHandlers(socket, ctx) {
  // 🟢 連線成功
  socket.onopen = async () => {
    console.log("✅ WebSocket 已連線");
    hideWssDisconnectedNotice();
    await sleep(1);

    if (ctx.state === "initiating") {
      if (ctx.isCaller) {
        console.log("📞 Caller → makeCall()");
        await ctx.makeCall();
      } else {
        console.log("📞 Callee → answerCall()");
	showEndCallButton();
        await ctx.answerCall();
      }
    }
    ctx.state = "active";
  };

  // 🔴 錯誤
  socket.onerror = async (err) => {
    console.error("❌ WebSocket 發生錯誤:", err);

    // 嘗試從錯誤物件中擷取更多細節（有時瀏覽器只給到 event）
    const msg = String(err?.message || err?.reason || "");
    let inferredCode = null;

    // 🧩 根據 message 內容嘗試推測錯誤類型（某些瀏覽器不給 code）
    if (msg.includes("ECONNREFUSED") || msg.includes("NetworkError")) inferredCode = 1006;
    if (msg.includes("403") || msg.includes("unauthorized")) inferredCode = 4001;
    if (msg.includes("timeout")) inferredCode = 1011;

    // 依錯誤類型分流
    try {
      switch (inferredCode) {
        case 1006: // 非預期斷線
        case 1011:
        case 1012:
        case 1013:
          console.warn("🌐 網路或伺服器中斷 →嘗試重連");

          await ctx.restartSocket();
          break;

        case 1008: // rate limit
          console.warn("🚫 被伺服器限流，暫不重連");
          showStopSign("ratelimit", ctx.peerId);
	  hideWssDisconnectedNotice();
          await ctx.simpleTurnOffCall();
          // 可選延遲重連（如 5 秒後）

          break;
        case 4000: // 新通話取代舊通話
          console.warn("☎️ 通話被新呼叫取代，結束通話但不重")
          showStopSign("replaced", ctx.peerId);
          hideWssDisconnectedNotice();
          await ctx.simpleTurnOffCall();
          break;

        case 4001: // 對方忙線中
          console.warn("⚠️ self正在通話中，本次呼叫作廢");
          showStopSign("replaced", ctx.peerId);
	  hideWssDisconnectedNotice();
          await ctx.simpleTurnOffCall();
          break;

        default:
          console.warn("❓ 未知錯誤，預設執行安全重啟策略");
          await ctx.restartSocket();
          break;
      }



    } catch (e) {
      console.error("⚠️ onerror 處理過程中發生異常:", e);
    }

    // 可選：紀錄錯誤（例如上報伺服器或存檔）
    try {
      logError?.("WebSocketError", {
        message: msg,
        inferredCode,
        stack: err?.stack,
      });
    } catch {}
  };

  // 🟠 關閉
  socket.onclose = async (event) => {
    console.warn("⚠️ WebSocket 關閉:", event.code, event.reason);
    if(ctx.state!=="dead"){

      showWssDisconnectedNotice();

    }
    try {
      switch (event.code) {
        case 1000:
          console.log("🧹 正常關閉（使用者或伺服器結束連線）");
	  hideWssDisconnectedNotice();
          await ctx.simpleTurnOffCall();
          break;
        case 1008: // rate limit
          console.warn("🚫 被伺服器限流，暫不重連");
          showStopSign("ratelimit", ctx.peerId);
	  hideWssDisconnectedNotice();
          await ctx.simpleTurnOffCall();
          // 可選延遲重連（如 5 秒後）

          break;
	case 1006:
        case 1011:
        case 1012:
        case 1013:
          console.warn("🌐 非預期中斷 → 嘗試重連");

          if (ctx.state !== "dead") {
            await ctx.restartSocket();
          }
          break;
        case 4000:
          console.warn("☎️ 通話被新的呼叫取代 → 結束當前通話但不重連");
          showStopSign("replaced", ctx.peerId);
          hideWssDisconnectedNotice();
          await ctx.simpleTurnOffCall();
          break;

        case 4001:
          console.warn("⚠️(自己正在通話中） → 中止本次呼叫");
          showStopSign("replaced", ctx.peerId);
	  hideWssDisconnectedNotice();
          await ctx.simpleTurnOffCall();
          break;

        default:
          console.warn("❓ 未知關閉代碼，預設執行安全重啟策略");

          if (ctx.state !== "dead") {
            await ctx.restartSocket();
          }
          break;
      }


    } catch (e) {
      console.error("⚠️ onclose 處理過程中發生錯誤:", e);
    }

    // 📦 錯誤紀錄或上報（可選）
    try {
      logError?.("WebSocketClose", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
    } catch {}
  };

  // 💬 收訊事件
  socket.onmessage = async (ev) => {
    let message;
    try {
      message = JSON.parse(ev.data);
    } catch (err) {
      console.error("❌ 無法解析 JSON:", ev.data);
      return;
    }

    const { action, offer, answer, candidate,config_id, calldisconnected } = message;

    if (action==="callRequest" && !ctx.isCaller) {
      console.log("📞 收到 callrequest");
      await ctx.answerCall();
      return;
    }

    if (action==="agreeCall" && ctx.isCaller) {
      console.log("✅ 對方同意通話 (agreecall)");
      showEndCallButton();
      hideDialing();
      ctx.callStart=true;
      try{
	console.log("soundPlayer.stopAll();");
        soundPlayer.stopAll();
	console.log("soundPlayer.stopAll(); finish");
      }catch{
    
      }
      await ctx.startWebRTC({ isCaller: ctx.isCaller });
      return;
    }

    if (offer&&(action==="ICE_SendOffer")) {
      console.log("📨 收到 offer: ",offer);
       console.log("📨  收到 config_id: ",config_id);
      await ctx.receiveOffer(offer,config_id);
      console.log("✅ offer complete");
      return;
    }

    if (answer&&(action==="ICE_SendAnswer")) {
      await setRemote(ctx.peer, answer);
      return;
    }

    if (candidate&&(action==="ICE_SendCandidate")) {
      await addRemoteCandidate(ctx.peer, candidate);
      console.log("✅ candidate complete");
      return;
    }

    if (action==="turnOffCall" && message.fromwhom === ctx.peerId && message.towhom === ctx.selfId) {
      console.log("⚠️ 收到強制結束通話");
      await ctx.forced_turnOffCall();
      return;
    }

    if (action==="replyCallRequest" && message.fromwhom === ctx.peerId && message.towhom === ctx.selfId) {
      console.log("📩 收到 replycallrequest:", message.replycallrequest);
      if (message.replycallrequest === "onAcall") {
        setDialingBusyCopy();
      }
      return;
    }

    if (calldisconnected) {
      console.log("📴 通話中斷:", message);
      return;
    }
  };
}

