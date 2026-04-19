import "../css/index.css";
import { initTopBar as initTopBarPage } from "../pages/topBar.js";

initTopBarPage();

export async function initTopBar() {
  return initTopBarPage();
}
