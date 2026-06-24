// Copies the hand-authored stylesheet and font files into dist/ so the
// published package ships styles.css + fonts/ alongside the compiled JS.
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

mkdirSync(resolve(root, "dist"), { recursive: true });
cpSync(resolve(root, "src/styles.css"), resolve(root, "dist/styles.css"));

if (existsSync(resolve(root, "src/fonts"))) {
  cpSync(resolve(root, "src/fonts"), resolve(root, "dist/fonts"), { recursive: true });
}

console.log("copy-assets: styles.css + fonts/ -> dist/");
