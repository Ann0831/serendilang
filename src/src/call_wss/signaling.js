// --- File: ./call_wss/signaling.js
// All functions that USE the socket live here (send/receive wrappers)

import { sendJSON } from "./config.js";

export function sendOffer(socket, { offer, to, from, type = "ice",config_id }) {
  sendJSON(socket, { action:"ICE_SendOffer",offer, towhom: to, fromwhom: from, type,config_id });
}

export function sendAnswer(socket, { answer, to, from, type = "ice" }) {
  sendJSON(socket, { action:"ICE_SendAnswer",answer, towhom: to, fromwhom: from, type });
}

export function sendCandidate(socket, { candidate, to, from, type = "ice" }) {
  sendJSON(socket, { action:"ICE_SendCandidate",candidate, towhom: to, fromwhom: from, type });
}

export function sendCallRequest(socket, { to, from, type = "ice" }) {
  sendJSON(socket, {action:"callRequest", callrequest: "callrequest", towhom: to, fromwhom: from, type });
}

export function sendCancelCallRequest(socket, { to, from, type = "ice" }) {
  sendJSON(socket, {action:"cancelCallRequest", towhom: to, fromwhom: from, type });
}

export function sendAgreeCall(socket, { to, from, type = "ice" }) {
  sendJSON(socket, {action:"agreeCall", towhom: to, fromwhom: from, type });
}

export function sendTurnOffCall(socket, { to, from, type = "ice" }) {
  sendJSON(socket, {action:"turnOffCall", towhom: to, fromwhom: from, type });
}

export function notifyCallSuccess(socket, { to,from, msg, type = "ice" }) {
  console.log("notifyCallSuccess");
  sendJSON(socket, {action:"notifyCallSuccess",towhom: to, "call-success": `${from} ${msg}`, type });
}

// Optional custom messages
export function sendReplyCallRequest(socket, { to, from, reply, type = "ice" }) {
  sendJSON(socket, { action:"replyCallRequest",replycallrequest: reply, towhom: to, fromwhom: from, type });
}

