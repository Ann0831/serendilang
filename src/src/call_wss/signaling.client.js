import * as realSignaling from "./signaling.js";
import * as mockSignaling from "./signaling.mock.js";
import { isTestEnv } from "../environment/env.js";

const impl = isTestEnv ? mockSignaling : realSignaling;
const bind = (name) => (...args) => impl[name](...args);

export const sendOffer = bind("sendOffer");
export const sendAnswer = bind("sendAnswer");
export const sendCandidate = bind("sendCandidate");
export const sendCancelCallRequest = bind("sendCancelCallRequest");
export const sendCallRequest = bind("sendCallRequest");
export const sendAgreeCall = bind("sendAgreeCall");
export const sendTurnOffCall = bind("sendTurnOffCall");
export const notifyCallSuccess = bind("notifyCallSuccess");
export const sendReplyCallRequest = bind("sendReplyCallRequest");

