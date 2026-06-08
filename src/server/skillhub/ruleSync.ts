import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { openLocalPath } from "../core/localFilesystem.js";
import type {
  LocalOpenResponse,
  Project,
  RuleCreatePreview,
  RuleCreateResult,
  RuleCreateSource,
  RuleFileName,
  RuleFileStatus,
  RuleSyncCommitResult,
  RuleSyncDirection,
  RuleSyncResult,
  RuleSyncStatus
} from "../../shared/types.js";

interface RuleSyncOptions {
  confirmGitInit?: boolean;
  confirmDirectOverwrite?: boolean;
  gitCommand?: string;
}

const ruleFiles: RuleFileName[] = ["AGENTS.md", "CLAUDE.md"];
const commandAvailabilityCache = new Map<string, boolean>();

export const DEFAULT_CLAUDE_RULE_TEMPLATE = `# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

\`\`\`
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
\`\`\`

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
`;

export function getRuleSyncStatus(project: Project, options: Pick<RuleSyncOptions, "gitCommand"> = {}): RuleSyncStatus {
  const gitCommand = options.gitCommand ?? "git";
  const gitAvailable = commandAvailable(gitCommand);
  const gitRoot = gitAvailable ? gitOutput(project.rootPath, ["rev-parse", "--show-toplevel"], gitCommand, false) : null;
  const files = Object.fromEntries(ruleFiles.map((file) => [file, ruleFileStatus(project.rootPath, file, gitRoot, gitCommand)])) as Record<
    RuleFileName,
    RuleFileStatus
  >;
  return {
    projectId: project.id,
    projectRoot: project.rootPath,
    gitAvailable,
    gitRoot,
    files,
    directions: {
      "agents-to-claude": {
        enabled: files["AGENTS.md"].exists,
        reason: files["AGENTS.md"].exists ? null : "AGENTS.md 不存在"
      },
      "claude-to-agents": {
        enabled: files["CLAUDE.md"].exists,
        reason: files["CLAUDE.md"].exists ? null : "CLAUDE.md 不存在"
      }
    }
  };
}

export function prepareRuleFileCreate(
  project: Project,
  file: RuleFileName,
  source: RuleCreateSource,
  options: Pick<RuleSyncOptions, "gitCommand"> = {}
): RuleCreatePreview {
  const status = getRuleSyncStatus(project, options);
  const target = status.files[file];
  if (target.exists) throw new Error(`${file} 已存在`);

  const sourceFile = source === "sync" ? oppositeRuleFile(file) : null;
  const content = sourceFile ? ruleCreateContentFromFile(status, sourceFile) : defaultRuleTemplateFor(file);

  return {
    projectId: project.id,
    projectRoot: project.rootPath,
    file,
    path: target.path,
    source,
    sourceFile,
    content,
    message: sourceFile ? `将从 ${sourceFile} 创建 ${file}` : `将使用默认模板创建 ${file}`
  };
}

export function createRuleFile(
  project: Project,
  file: RuleFileName,
  content: string,
  options: Pick<RuleSyncOptions, "gitCommand"> = {}
): RuleCreateResult {
  const status = getRuleSyncStatus(project, options);
  const target = status.files[file];
  if (target.exists) throw new Error(`${file} 已存在`);
  if (content.trim().length === 0) throw new Error("规则文件内容不能为空");

  fs.writeFileSync(target.path, content, "utf8");
  return {
    projectId: project.id,
    projectRoot: project.rootPath,
    file,
    path: target.path,
    action: "created",
    message: `已创建 ${file}`,
    status: getRuleSyncStatus(project, options)
  };
}

export function createRuleTemplateFile(project: Project, options: Pick<RuleSyncOptions, "gitCommand"> = {}): RuleCreateResult {
  return createRuleFile(project, "CLAUDE.md", DEFAULT_CLAUDE_RULE_TEMPLATE, options);
}

export function openRuleFile(project: Project, file: RuleFileName, options: Pick<RuleSyncOptions, "gitCommand"> = {}): LocalOpenResponse {
  const status = getRuleSyncStatus(project, options);
  const target = status.files[file];
  if (!target.exists) throw new Error(`${file} 不存在`);
  return openLocalPath(target.path);
}

export function applyRuleSync(project: Project, direction: RuleSyncDirection, options: RuleSyncOptions = {}): RuleSyncResult {
  const status = getRuleSyncStatus(project, options);
  const sourceFile: RuleFileName = direction === "agents-to-claude" ? "AGENTS.md" : "CLAUDE.md";
  const targetFile: RuleFileName = direction === "agents-to-claude" ? "CLAUDE.md" : "AGENTS.md";
  const source = status.files[sourceFile];
  const target = status.files[targetFile];
  if (!source.exists) throw new Error(`${sourceFile} 不存在`);
  const sourceContent = fs.readFileSync(source.path, "utf8");

  if (!target.exists) {
    fs.writeFileSync(target.path, sourceContent, "utf8");
    return result(project, direction, sourceFile, targetFile, "written", null, "目标规则文件已创建", options);
  }

  const targetContent = fs.readFileSync(target.path, "utf8");
  if (targetContent === sourceContent) {
    return result(project, direction, sourceFile, targetFile, "noop", null, "两个规则文件内容一致", options);
  }

  if (!status.gitAvailable && !options.confirmDirectOverwrite) {
    return result(project, direction, sourceFile, targetFile, "needs-confirmation", null, "git 不可用，需要确认直接覆盖", options);
  }

  fs.writeFileSync(target.path, sourceContent, "utf8");
  return result(project, direction, sourceFile, targetFile, "overwritten", null, "目标规则文件已直接覆盖", options);
}

export function commitRuleSyncTarget(project: Project, direction: RuleSyncDirection, options: RuleSyncOptions = {}): RuleSyncCommitResult {
  const status = getRuleSyncStatus(project, options);
  const targetFile: RuleFileName = direction === "agents-to-claude" ? "CLAUDE.md" : "AGENTS.md";
  const target = status.files[targetFile];
  const gitCommand = options.gitCommand ?? "git";

  if (!target.exists) {
    return commitResult(project, direction, targetFile, "noop", null, "目标规则文件不存在，无需 commit", options);
  }
  if (!status.gitAvailable) {
    return commitResult(project, direction, targetFile, "noop", null, "git 不可用，无法 commit", options);
  }
  if (status.gitRoot && target.gitManaged && !target.dirty) {
    return commitResult(project, direction, targetFile, "noop", null, "目标规则文件没有未提交内容", options);
  }

  if (!status.gitRoot) {
    gitOutput(project.rootPath, ["init"], gitCommand);
  }

  const backupCommit = commitOnlyRuleFile(project.rootPath, target.path, targetFile, gitCommand);
  return commitResult(project, direction, targetFile, "committed", backupCommit, "目标规则文件已 commit", options);
}

function ruleFileStatus(projectRoot: string, file: RuleFileName, gitRoot: string | null, gitCommand: string): RuleFileStatus {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  const stat = exists ? fs.statSync(filePath) : null;
  const gitManaged = exists && gitRoot ? gitExit(projectRoot, ["ls-files", "--error-unmatch", "--", file], gitCommand) === 0 : null;
  const dirty = exists && gitRoot && gitManaged ? Boolean(gitOutput(projectRoot, ["status", "--porcelain", "--", file], gitCommand, false)) : null;
  return {
    file,
    path: filePath,
    exists,
    mtime: stat ? stat.mtime.toISOString() : null,
    gitManaged,
    dirty
  };
}

function commitOnlyRuleFile(projectRoot: string, filePath: string, file: RuleFileName, gitCommand: string): string | null {
  gitOutput(projectRoot, ["add", "--", filePath], gitCommand);
  gitOutput(projectRoot, ["commit", "-m", `chore: 同步规则前备份 ${file}`, "--", filePath], gitCommand);
  return currentHead(projectRoot, gitCommand);
}

function oppositeRuleFile(file: RuleFileName): RuleFileName {
  return file === "CLAUDE.md" ? "AGENTS.md" : "CLAUDE.md";
}

function ruleCreateContentFromFile(status: RuleSyncStatus, file: RuleFileName): string {
  const source = status.files[file];
  if (!source.exists) throw new Error(`${file} 不存在`);
  return fs.readFileSync(source.path, "utf8");
}

function defaultRuleTemplateFor(file: RuleFileName): string {
  if (file === "CLAUDE.md") return DEFAULT_CLAUDE_RULE_TEMPLATE;
  return DEFAULT_CLAUDE_RULE_TEMPLATE.replace("# CLAUDE.md", "# AGENTS.md");
}

function currentHead(projectRoot: string, gitCommand: string): string | null {
  return gitOutput(projectRoot, ["rev-parse", "HEAD"], gitCommand, false);
}

function result(
  project: Project,
  direction: RuleSyncDirection,
  sourceFile: RuleFileName,
  targetFile: RuleFileName,
  action: RuleSyncResult["action"],
  backupCommit: string | null,
  message: string,
  options: Pick<RuleSyncOptions, "gitCommand">
): RuleSyncResult {
  return {
    projectId: project.id,
    projectRoot: project.rootPath,
    direction,
    sourceFile,
    targetFile,
    action,
    backupCommit,
    message,
    status: getRuleSyncStatus(project, options)
  };
}

function commitResult(
  project: Project,
  direction: RuleSyncDirection,
  targetFile: RuleFileName,
  action: RuleSyncCommitResult["action"],
  backupCommit: string | null,
  message: string,
  options: Pick<RuleSyncOptions, "gitCommand">
): RuleSyncCommitResult {
  return {
    projectId: project.id,
    projectRoot: project.rootPath,
    direction,
    targetFile,
    action,
    backupCommit,
    message,
    status: getRuleSyncStatus(project, options)
  };
}

function commandAvailable(command: string): boolean {
  const cached = commandAvailabilityCache.get(command);
  if (cached !== undefined) return cached;
  const available = spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0;
  commandAvailabilityCache.set(command, available);
  return available;
}

function gitExit(cwd: string, args: string[], gitCommand: string): number | null {
  const output = spawnSync(gitCommand, args, { cwd, encoding: "utf8" });
  return output.status;
}

function gitOutput(cwd: string, args: string[], gitCommand: string, required = true): string | null {
  const output = spawnSync(gitCommand, args, { cwd, encoding: "utf8" });
  if (output.status !== 0) {
    if (!required) return null;
    throw new Error((output.stderr || output.stdout || "git command failed").trim());
  }
  return output.stdout.trim();
}
