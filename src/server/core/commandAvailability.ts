import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CACHE_TTL_MS = 30_000;
const availabilityCache = new Map<string, { available: boolean; checkedAt: number }>();

export interface CommandAvailabilityInvocation {
  command: string;
  args: string[];
}

export function commandAvailable(command: string, platform: NodeJS.Platform = process.platform): boolean {
  const key = `${platform}:${command}`;
  const now = Date.now();
  const cached = availabilityCache.get(key);
  if (cached && now - cached.checkedAt < CACHE_TTL_MS) return cached.available;

  const available = path.isAbsolute(command) ? fs.existsSync(command) : commandAvailableUncached(command, platform);
  availabilityCache.set(key, { available, checkedAt: now });
  return available;
}

export function clearCommandAvailabilityCache(): void {
  availabilityCache.clear();
}

function commandAvailableUncached(command: string, platform: NodeJS.Platform): boolean {
  const invocation = buildCommandAvailabilityInvocation(command, platform);
  const result = spawnSync(invocation.command, invocation.args, { stdio: "ignore" });
  return result.status === 0;
}

export function buildCommandAvailabilityInvocation(command: string, platform: NodeJS.Platform): CommandAvailabilityInvocation {
  if (platform === "win32") return { command: "where.exe", args: [command] };
  return { command: "sh", args: ["-c", "command -v \"$1\"", "sh", command] };
}
