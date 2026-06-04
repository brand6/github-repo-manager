import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const electronCache = process.env.ELECTRON_CACHE || path.join(projectRoot, ".tmp", "electron-cache");
fs.mkdirSync(electronCache, { recursive: true });

const builderPath = path.join(projectRoot, "node_modules", "electron-builder", "cli.js");

const child = spawn(process.execPath, [builderPath, ...process.argv.slice(2)], {
  cwd: projectRoot,
  env: {
    ...process.env,
    ELECTRON_CACHE: electronCache
  },
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
