import fs from "node:fs";
import type { AppConfig, RefreshResult, ToolId } from "../../shared/types.js";
import { nowIso } from "../core/time.js";
import { normalizeFsPath } from "../core/pathUtils.js";
import type { AppEventHub } from "../events/appEvents.js";
import type { AppDatabase } from "../storage/database.js";
import { sessionSourcesForAdapter, toolAdapters } from "../tools/adapters.js";
import { listSessionSourceTargets, refreshSessionFiles, type SessionSourceTarget } from "./sessionScanner.js";

interface FileFingerprint {
  mtimeMs: number;
  size: number;
}

interface TrackedSource extends SessionSourceTarget {
  fingerprint: FileFingerprint;
}

export interface SessionIndexRunOptions {
  toolIds?: ToolId[];
}

export interface SessionIndexRunResult {
  reason: string;
  changedSourceCount: number;
  removedSourceCount: number;
  removedSessionCount: number;
  addedProjectCount: number;
  refreshResult: RefreshResult | null;
}

export interface SessionIndexServiceOptions {
  database: () => AppDatabase;
  config: () => AppConfig;
  events: Pick<AppEventHub, "emit">;
  pollIntervalMs?: number;
}

const DEFAULT_POLL_INTERVAL_MS = 5_000;
const TRACKED_SOURCES_SETTING_KEY = "session-index:tracked-sources";

export class SessionIndexService {
  private readonly database: () => AppDatabase;
  private readonly config: () => AppConfig;
  private readonly events: Pick<AppEventHub, "emit">;
  private readonly pollIntervalMs: number;
  private trackedSources = new Map<string, TrackedSource>();
  private timer: NodeJS.Timeout | null = null;
  private startupTimer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(options: SessionIndexServiceOptions) {
    this.database = options.database;
    this.config = options.config;
    this.events = options.events;
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  }

  start(): void {
    if (this.timer || this.startupTimer) return;
    this.startupTimer = setTimeout(() => {
      this.startupTimer = null;
      this.poll("startup");
    }, 0);
    this.startupTimer.unref?.();
    this.timer = setInterval(() => this.poll("poll"), this.pollIntervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  runOnce(reason = "manual", options: SessionIndexRunOptions = {}): SessionIndexRunResult | null {
    if (this.running) return null;
    this.running = true;
    try {
      const result = this.scanOnce(reason, options);
      if (result && (result.changedSourceCount > 0 || result.removedSourceCount > 0 || result.removedSessionCount > 0)) {
        this.emitChanged(result);
      }
      return result;
    } finally {
      this.running = false;
    }
  }

  markSynced(toolIds: ToolId[] = []): void {
    const selectedTools = toolIds.length > 0 ? new Set<ToolId>(toolIds) : null;
    const nextSources = selectedTools ? this.currentTrackedSources() : new Map<string, TrackedSource>();

    if (selectedTools) {
      for (const [key, source] of nextSources) {
        if (selectedTools.has(source.toolId)) {
          nextSources.delete(key);
        }
      }
    }

    for (const target of listSessionSourceTargets(this.config(), toolIds)) {
      const fingerprint = readFingerprint(target.sourceFile);
      if (fingerprint) {
        nextSources.set(targetKey(target), { ...target, fingerprint });
      }
    }

    this.setTrackedSources(nextSources);
  }

  private poll(reason: string): void {
    try {
      this.runOnce(reason);
    } catch (error) {
      console.error("Automatic session index refresh failed", error);
    }
  }

  private scanOnce(reason: string, options: SessionIndexRunOptions): SessionIndexRunResult | null {
    const config = this.config();
    const selectedTools = options.toolIds?.length ? new Set<ToolId>(options.toolIds) : null;
    const previousSources = this.currentTrackedSources();
    const indexedSourceTimes = indexedSourceTimesByKey(this.database());
    const targets = listSessionSourceTargets(config, options.toolIds);
    const nextSources = new Map(previousSources);
    const currentTargets = new Map<string, TrackedSource>();
    const changedTargets: SessionSourceTarget[] = [];
    let trackingChanged = false;

    for (const target of targets) {
      const fingerprint = readFingerprint(target.sourceFile);
      if (!fingerprint) continue;
      const tracked = { ...target, fingerprint };
      const key = targetKey(target);
      currentTargets.set(key, tracked);
      nextSources.set(key, tracked);

      const previous = previousSources.get(key);
      const indexedPrevious = previous ? null : trackedFromIndexedState(target, fingerprint, indexedSourceTimes);
      if (indexedPrevious) {
        trackingChanged = true;
      }
      if (!previous || !sameFingerprint(previous.fingerprint, fingerprint)) {
        if (!indexedPrevious || !sameFingerprint(indexedPrevious.fingerprint, fingerprint)) {
          changedTargets.push(target);
        }
      }
    }

    const removedSources: TrackedSource[] = [];
    for (const [key, previous] of previousSources) {
      if (selectedTools && !selectedTools.has(previous.toolId)) continue;
      if (currentTargets.has(key)) continue;
      if (!isStillConfigured(previous, config)) continue;

      const sourceRoot = readStat(previous.sourceRoot);
      if (!sourceRoot) {
        nextSources.set(key, previous);
        continue;
      }

      if (readStat(previous.sourceFile)) {
        nextSources.set(key, previous);
        continue;
      }

      removedSources.push(previous);
      nextSources.delete(key);
    }

    if (changedTargets.length === 0 && removedSources.length === 0) {
      if (trackingChanged) {
        this.setTrackedSources(nextSources);
      } else {
        this.trackedSources = nextSources;
      }
      return null;
    }

    const refreshResult = changedTargets.length > 0
      ? refreshSessionFiles(this.database(), changedTargets, {
          scope: "sessions-incremental",
          missingSourceMessage: "Session source file was missing during incremental index refresh"
        })
      : null;
    const removedSessionCount = this.removeDeletedSources(removedSources);
    const changedTools = uniqueToolIds([...changedTargets, ...removedSources]);
    const addedProjectCount = changedTools.length > 0 ? this.database().addSessionProjectsForTools(changedTools) : 0;

    this.setTrackedSources(nextSources);
    return {
      reason,
      changedSourceCount: changedTargets.length,
      removedSourceCount: removedSources.length,
      removedSessionCount,
      addedProjectCount,
      refreshResult
    };
  }

  private currentTrackedSources(): Map<string, TrackedSource> {
    if (this.trackedSources.size > 0) return new Map(this.trackedSources);
    this.trackedSources = readPersistedTrackedSources(this.database());
    return new Map(this.trackedSources);
  }

  private setTrackedSources(sources: Map<string, TrackedSource>): void {
    this.trackedSources = new Map(sources);
    this.database().setSetting(TRACKED_SOURCES_SETTING_KEY, [...sources.values()]);
  }

  private removeDeletedSources(sources: TrackedSource[]): number {
    let removedSessionCount = 0;
    for (const source of sources) {
      this.database().deleteParserWarningsBySourceFile(source.toolId, source.sourceFile);
      removedSessionCount += this.database().deleteSessionsBySourceFile(source.toolId, source.sourceFile);
    }
    return removedSessionCount;
  }

  private emitChanged(result: SessionIndexRunResult): void {
    this.events.emit({
      type: "sessions:changed",
      at: nowIso(),
      reason: result.reason,
      changedSourceCount: result.changedSourceCount,
      removedSourceCount: result.removedSourceCount,
      removedSessionCount: result.removedSessionCount,
      addedProjectCount: result.addedProjectCount,
      scanRunId: result.refreshResult?.scanRun.id ?? null,
      indexedCount: result.refreshResult?.indexedCount ?? 0,
      skippedCount: result.refreshResult?.skippedCount ?? 0,
      warningCount: result.refreshResult?.warningCount ?? 0
    });
  }
}

function targetKey(target: Pick<SessionSourceTarget, "toolId" | "sourceFile">): string {
  return `${target.toolId}:${normalizeFsPath(target.sourceFile)}`;
}

function readFingerprint(sourceFile: string): FileFingerprint | null {
  const stat = readStat(sourceFile);
  if (!stat?.isFile()) return null;
  return { mtimeMs: stat.mtimeMs, size: stat.size };
}

function readStat(sourceFile: string): fs.Stats | null {
  try {
    return fs.statSync(sourceFile);
  } catch {
    return null;
  }
}

function sameFingerprint(left: FileFingerprint, right: FileFingerprint): boolean {
  return left.mtimeMs === right.mtimeMs && left.size === right.size;
}

function trackedFromIndexedState(
  target: SessionSourceTarget,
  fingerprint: FileFingerprint,
  indexedSourceTimes: Map<string, number>
): TrackedSource | null {
  const indexedAtMs = indexedSourceTimes.get(targetKey(target));
  if (indexedAtMs === undefined || indexedAtMs < fingerprint.mtimeMs) return null;
  return { ...target, fingerprint };
}

function indexedSourceTimesByKey(database: AppDatabase): Map<string, number> {
  const indexedTimes = new Map<string, number>();
  for (const session of database.listSessions()) {
    setMaxTime(indexedTimes, targetKey(session), Date.parse(session.indexedAt));
  }
  for (const warning of database.listParserWarnings()) {
    if (!warning.toolId || !warning.sourceFile) continue;
    setMaxTime(indexedTimes, targetKey({ toolId: warning.toolId, sourceFile: warning.sourceFile }), Date.parse(warning.createdAt));
  }
  return indexedTimes;
}

function setMaxTime(times: Map<string, number>, key: string, value: number): void {
  if (!Number.isFinite(value)) return;
  times.set(key, Math.max(times.get(key) ?? 0, value));
}

function readPersistedTrackedSources(database: AppDatabase): Map<string, TrackedSource> {
  const persisted = database.getSetting<unknown[]>(TRACKED_SOURCES_SETTING_KEY, []);
  const sources = new Map<string, TrackedSource>();
  if (!Array.isArray(persisted)) return sources;

  for (const item of persisted) {
    if (!isPersistedTrackedSource(item)) continue;
    sources.set(targetKey(item), item);
  }

  return sources;
}

function isPersistedTrackedSource(value: unknown): value is TrackedSource {
  if (!value || typeof value !== "object") return false;
  const source = value as Partial<TrackedSource>;
  return (
    isToolId(source.toolId) &&
    typeof source.sourceRoot === "string" &&
    typeof source.sourceFile === "string" &&
    typeof source.fingerprint?.mtimeMs === "number" &&
    typeof source.fingerprint.size === "number"
  );
}

function isToolId(value: unknown): value is ToolId {
  return value === "codex" || value === "claude" || value === "opencode" || value === "qwen" || value === "qoder" || value === "copilot";
}

function isStillConfigured(source: TrackedSource, config: AppConfig): boolean {
  const adapter = toolAdapters[source.toolId];
  const normalizedRoot = normalizeFsPath(source.sourceRoot);
  return sessionSourcesForAdapter(adapter, config).some((candidate) => normalizeFsPath(candidate) === normalizedRoot);
}

function uniqueToolIds(targets: Array<Pick<SessionSourceTarget, "toolId">>): ToolId[] {
  return [...new Set(targets.map((target) => target.toolId))];
}
