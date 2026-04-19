import * as realConfig from "./config.js";
import * as mockConfig from "./config.mock.js";
import { isTestEnv } from "../environment/env.js";

const impl = isTestEnv ? mockConfig : realConfig;
const bind = (name) => (...args) => impl[name](...args);

export const SIGNALING_URL = bind("SIGNALING_URL");
export const createSocket = bind("createSocket");
export const sendJSON = bind("sendJSON");

