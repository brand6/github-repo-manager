import type { AppConfig, LaunchCommand, ProjectResourceDirectoryPreference, SessionEntry, ToolId, ToolStatus } from "../../shared/types.js";

export interface SkillTargetOptions {
  directoryPreference?: ProjectResourceDirectoryPreference;
}

export interface ToolAdapter {
  id: ToolId;
  parserVersion: string;
  sourceFormat: string;
  capabilities: ToolStatus["capabilities"];
  visibleInProjectUi: boolean;
  defaultSessionSources(env?: NodeJS.ProcessEnv): string[];
  skillTarget(projectRoot: string, options?: SkillTargetOptions): { supported: boolean; directory: string | null; reason: string | null };
  detect(config: AppConfig): ToolStatus;
  buildNewSessionCommand(config: AppConfig, cwd: string): LaunchCommand;
  buildResumeCommand(config: AppConfig, session: SessionEntry): LaunchCommand;
}
