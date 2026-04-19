import "../css/index.css";
import { initMenuBar } from "../pages/menuBar.js";

initMenuBar();

export async function initMenu() {
  return initMenuBar();
}
