import { execFile } from "node:child_process";
import path from "node:path";
import type {
  AppConfig,
  CliHubAvailabilityState,
  CliHubCli,
  LaunchCommand,
  Project,
  ProjectCliAction,
  ProjectCliActionAvailability,
  ProjectCliActionExecutionMode,
  ProjectCliActionGroup,
  ProjectCliCommand,
  ProjectCliActionRunResult,
  ProjectCliActionState
} from "../../shared/types.js";
import { nowIso } from "../core/time.js";
import { ensureBuiltInCliHubClis, type CliHubCommandResult, type CliHubCommandRunner, type CliHubRuntimeOptions } from "../clihub/clihub.js";
import { launchInTerminal, terminalWindowTarget } from "../launch/terminal.js";
import type { AppDatabase } from "../storage/database.js";

interface ProjectCliActionDefinition {
  actionId: string;
  cliId: string;
  cliDisplayName: string;
  label: string;
  defaultCommand: string;
  args: string[];
  executionMode: ProjectCliActionExecutionMode;
  writesProject: boolean;
  requiresConfirmation: boolean;
  affectedSubpaths: string[];
}

export class ProjectCliActionError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode = 400
  ) {
    super(message);
  }
}

const inlineCommandTimeoutMs = 60_000;
const outputLimit = 6000;

const projectCliActions: ProjectCliActionDefinition[] = [
  {
    actionId: "codegraph:init",
    cliId: "codegraph",
    cliDisplayName: "CodeGraph",
    label: "初始化索引",
    defaultCommand: "codegraph",
    args: ["init", "-i"],
    executionMode: "terminal",
    writesProject: true,
    requiresConfirmation: true,
    affectedSubpaths: [".codegraph"]
  },
  {
    actionId: "codegraph:status",
    cliId: "codegraph",
    cliDisplayName: "CodeGraph",
    label: "查看状态",
    defaultCommand: "codegraph",
    args: ["status"],
    executionMode: "inline",
    writesProject: false,
    requiresConfirmation: false,
    affectedSubpaths: []
  },
  {
    actionId: "codegraph:index-force",
    cliId: "codegraph",
    cliDisplayName: "CodeGraph",
    label: "重建索引",
    defaultCommand: "codegraph",
    args: ["index", "--force"],
    executionMode: "terminal",
    writesProject: true,
    requiresConfirmation: true,
    affectedSubpaths: [".codegraph"]
  },
  {
    actionId: "codegraph:sync",
    cliId: "codegraph",
    cliDisplayName: "CodeGraph",
    label: "增量同步",
    defaultCommand: "codegraph",
    args: ["sync"],
    executionMode: "terminal",
    writesProject: true,
    requiresConfirmation: true,
    affectedSubpaths: [".codegraph"]
  }
];

export function listProjectCliActions(database: AppDatabase, project: Project): ProjectCliActionState {
  ensureBuiltInCliHubClis(database);
  const actions = projectCliActions.flatMap((definition) => materializeAction(database, project, definition));
  const commands = installedProjectCliCommands(database, project);
  const groups = new Map<string, ProjectCliActionGroup>();
  for (const action of actions) {
    const current = groups.get(action.cliId);
    if (current) {
      current.actions.push(action);
      continue;
    }
    groups.set(action.cliId, {
      cliId: action.cliId,
      displayName: action.cliDisplayName,
      availability: action.availability,
      actions: [action]
    });
  }
  for (const command of commands) {
    const current = groups.get(command.cliId);
    if (current) {
      current.commands = [...(current.commands ?? []), command];
      continue;
    }
    groups.set(command.cliId, {
      cliId: command.cliId,
      displayName: command.displayName,
      availability: {
        state: "available",
        reason: null,
        cliHubCliId: command.cliId,
        cliHubAvailabilityState: "available"
      },
      commands: [command],
      actions: []
    });
  }

  return {
    projectId: project.id,
    targetRootPath: project.rootPath,
    groups: [...groups.values()]
  };
}

export async function executeProjectCliAction(
  database: AppDatabase,
  project: Project,
  actionId: string,
  config: AppConfig,
  options: CliHubRuntimeOptions = {},
  executionOptions: { dryRun?: boolean } = {}
): Promise<ProjectCliActionRunResult> {
  const action = listProjectCliActions(database, project)
    .groups.flatMap((group) => group.actions)
    .find((candidate) => candidate.actionId === actionId);
  if (!action) {
    throw new ProjectCliActionError("Project CLI action 不存在", "project-cli-action-not-found", 404);
  }
  if (action.availability.state !== "available") {
    throw new ProjectCliActionError(action.availability.reason ?? "CLI 当前不可用", "project-cli-unavailable", 409);
  }

  const startedAt = nowIso();
  if (action.executionMode === "terminal") {
    const command = launchCommand(action);
    const launch = launchInTerminal(command, {
      dryRun: Boolean(executionOptions.dryRun),
      windowTarget: terminalWindowTarget(config.terminal.mode, {
        toolId: action.cliId,
        cwd: action.cwd,
        projectRootPath: project.rootPath
      })
    });
    return {
      projectId: project.id,
      targetRootPath: project.rootPath,
      actionId: action.actionId,
      cliId: action.cliId,
      label: action.label,
      command: action.command,
      args: action.args,
      commandText: action.commandText,
      cwd: action.cwd,
      executionMode: action.executionMode,
      status: launch.launched ? "launched" : "failed",
      startedAt,
      completedAt: nowIso(),
      exitCode: null,
      stdout: "",
      stderr: launch.reason ?? "",
      launch
    };
  }

  const result = await runProjectCliCommand(commandRunner(options), action.command, action.args, action.cwd);
  return {
    projectId: project.id,
    targetRootPath: project.rootPath,
    actionId: action.actionId,
    cliId: action.cliId,
    label: action.label,
    command: action.command,
    args: action.args,
    commandText: action.commandText,
    cwd: action.cwd,
    executionMode: action.executionMode,
    status: result.exitCode === 0 ? "success" : "failed",
    startedAt,
    completedAt: nowIso(),
    exitCode: result.exitCode,
    stdout: clipText(result.stdout),
    stderr: clipText(result.stderr),
    launch: null
  };
}

function materializeAction(database: AppDatabase, project: Project, definition: ProjectCliActionDefinition): ProjectCliAction[] {
  const cli = findProjectCli(database, definition);
  if (!cli) return [];
  const command = cli.commandNames[0] ?? definition.defaultCommand;
  const availability = availabilityFromCli(cli.cliId, cli.availabilityState);
  return [{
    actionId: definition.actionId,
    cliId: cli.cliId,
    cliDisplayName: cli?.displayName ?? definition.cliDisplayName,
    label: definition.label,
    command,
    args: definition.args,
    commandText: formatCommandLine([command, ...definition.args]),
    cwd: project.rootPath,
    cwdPolicy: "target-root",
    executionMode: definition.executionMode,
    writesProject: definition.writesProject,
    requiresConfirmation: definition.requiresConfirmation,
    affectedPaths: definition.affectedSubpaths.map((subpath) => path.join(project.rootPath, subpath)),
    availability
  }];
}

function findProjectCli(database: AppDatabase, definition: ProjectCliActionDefinition): CliHubCli | null {
  const command = definition.defaultCommand.toLowerCase();
  return (
    database.listCliHubClis().find((cli) => cli.sourceType === "custom" && cli.commandNames.some((commandName) => commandName.toLowerCase() === command)) ??
    null
  );
}

function installedProjectCliCommands(database: AppDatabase, project: Project): ProjectCliCommand[] {
  return database
    .listCliHubClis()
    .filter((cli) => (cli.kind === "function" || cli.kind === "dependency") && cli.availabilityState === "available")
    .flatMap((cli) =>
      cli.commandNames.map((command) => ({
        cliId: cli.cliId,
        displayName: cli.displayName,
        kind: cli.kind as ProjectCliCommand["kind"],
        command,
        commandText: formatCommandLine([command]),
        cwd: project.rootPath,
        localPath: cli.localPath ?? cli.resolvedPaths[0] ?? null,
        resolvedPaths: cli.resolvedPaths,
        version: cli.version
      }))
    );
}

function availabilityFromCli(cliId: string, state: CliHubAvailabilityState | null): ProjectCliActionAvailability {
  if (state === "available") {
    return { state: "available", reason: null, cliHubCliId: cliId, cliHubAvailabilityState: state };
  }
  if (state === "unavailable") {
    return {
      state: "unavailable",
      reason: "CLI 当前不可用，请到 CliHub 安装或刷新发现",
      cliHubCliId: cliId,
      cliHubAvailabilityState: state
    };
  }
  return {
    state: "unknown",
    reason: "CliHub 尚未发现该 CLI，请到 CliHub 刷新发现",
    cliHubCliId: cliId,
    cliHubAvailabilityState: state
  };
}

function launchCommand(action: ProjectCliAction): LaunchCommand {
  return { command: action.command, args: action.args, cwd: action.cwd };
}

async function runProjectCliCommand(
  runner: CliHubCommandRunner | null,
  command: string,
  args: string[],
  cwd: string
): Promise<CliHubCommandResult> {
  if (runner) return runner.run(command, args, { cwd, timeoutMs: inlineCommandTimeoutMs });
  return runProcess(command, args, cwd);
}

function runProcess(command: string, args: string[], cwd: string): Promise<CliHubCommandResult> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        cwd,
        encoding: "utf8",
        timeout: inlineCommandTimeoutMs,
        windowsHide: true,
        shell: process.platform === "win32"
      },
      (error, stdout, stderr) => {
        resolve({
          exitCode: error ? childExitCode(error) : 0,
          stdout: clipText(String(stdout ?? "")),
          stderr: clipText(String(stderr ?? "") || (error instanceof Error ? error.message : ""))
        });
      }
    );
  });
}

function childExitCode(error: unknown): number {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "number") return error.code;
  return 1;
}

function commandRunner(options: CliHubRuntimeOptions): CliHubCommandRunner | null {
  return options.commandRunner ?? null;
}

function formatCommandLine(parts: string[]): string {
  return parts.map((part) => (/\s/.test(part) ? `"${part.replaceAll("\"", "\\\"")}"` : part)).join(" ");
}

function clipText(value: string): string {
  const trimmed = value.trim();
  return trimmed.length <= outputLimit ? trimmed : `${trimmed.slice(0, outputLimit)}...`;
}
