import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const webPagesDir = resolve(__dirname, "webPages");
const webPagesInputs = Object.fromEntries(
  readdirSync(webPagesDir)
    .filter((file) => file.endsWith(".html"))
    .map((file) => [`webPages/${file}`, resolve(webPagesDir, file)]),
);

function loadVirtualBackendEnv() {
  const envPath = resolve(__dirname, "fake_backend_env");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!key) return;
    if (process.env[key] == null) process.env[key] = value;
  });
}

loadVirtualBackendEnv();

export default defineConfig({
  appType: "mpa",

  // 靜態資源改由 /sourcecode/ 提供
  base: "/sourcecode/",

  plugins: [react()],

  build: {
    rollupOptions: {
      input: {
        ...webPagesInputs,
      },
    },
  },
});
