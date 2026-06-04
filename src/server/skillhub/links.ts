import fs from "node:fs";
import path from "node:path";

export function createDirectoryLink(targetPath: string, linkPath: string): void {
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  retryFilesystemOperation(() => fs.symlinkSync(targetPath, linkPath, process.platform === "win32" ? "junction" : "dir"));
}

export function removeDirectoryLink(linkPath: string): { removed: boolean; missing: boolean; reason: string | null } {
  try {
    const stat = fs.lstatSync(linkPath);
    if (!stat.isSymbolicLink()) {
      return { removed: false, missing: false, reason: "目标不是 SkillHub 创建的 link" };
    }
    retryFilesystemOperation(() => fs.unlinkSync(linkPath));
    return { removed: true, missing: false, reason: null };
  } catch (error) {
    if (isMissingPathError(error)) {
      return { removed: false, missing: true, reason: null };
    }
    return { removed: false, missing: false, reason: error instanceof Error ? error.message : "link 删除失败" };
  }
}

export function linkPointsTo(linkPath: string, targetPath: string): boolean {
  try {
    const stat = fs.lstatSync(linkPath);
    if (!stat.isSymbolicLink()) return false;
    const current = fs.readlinkSync(linkPath);
    const resolved = path.resolve(path.dirname(linkPath), current);
    return path.resolve(resolved) === path.resolve(targetPath) || path.resolve(current) === path.resolve(targetPath);
  } catch {
    return false;
  }
}

export function pathExists(linkPath: string): boolean {
  try {
    fs.lstatSync(linkPath);
    return true;
  } catch (error) {
    if (isMissingPathError(error)) return false;
    return true;
  }
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT";
}

function retryFilesystemOperation<T>(operation: () => T): T {
  const maxAttempts = process.platform === "win32" ? 6 : 1;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts - 1 || !isTransientFilesystemError(error)) {
        throw error;
      }
      sleepSync(25 * (attempt + 1));
    }
  }
  throw lastError;
}

function isTransientFilesystemError(error: unknown): boolean {
  if (!(error instanceof Error) || !("code" in error)) return false;
  return ["EBUSY", "EPERM", "ENOTEMPTY"].includes(String((error as NodeJS.ErrnoException).code));
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
