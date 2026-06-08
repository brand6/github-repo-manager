import React from "react";
import type { ProjectCliAction, ProjectCliActionRunResult, ProjectCliActionState, ProjectCliCommand } from "../shared/types.js";

export function ProjectCliPanel({
  state,
  busy,
  lastResult,
  onClose,
  onRunAction
}: {
  state: ProjectCliActionState | null;
  busy: boolean;
  lastResult: ProjectCliActionRunResult | null;
  onClose: () => void;
  onRunAction: (action: ProjectCliAction) => void;
}) {
  return (
    <aside className="side-panel project-cli-panel" aria-label="项目 CLI 管理">
      <header>
        <div>
          <span className="eyebrow">CliHub</span>
          <h2>项目 CLI 管理</h2>
        </div>
        <button className="secondary" type="button" onClick={onClose} disabled={busy}>
          关闭
        </button>
      </header>

      {!state ? (
        <div className="muted">正在读取项目 CLI 命令...</div>
      ) : (
        <>
          <p className="path-line">{state.targetRootPath}</p>
          <div className="project-cli-group-list">
            {state.groups.length === 0 ? (
              <div className="empty-state compact">没有可用项目 CLI 命令或动作</div>
            ) : (
              state.groups.map((group) => (
                <section className="project-cli-group" key={group.cliId} aria-label={`${group.displayName} CLI`}>
                  <div className="project-cli-group-header">
                    <strong>{group.displayName}</strong>
                    <span className={`metric-pill${group.availability.state === "available" ? "" : " danger"}`}>
                      {availabilityLabel(group.availability.state)}
                    </span>
                  </div>
                  {group.availability.reason ? <p className="muted compact">{group.availability.reason}</p> : null}
                  {(group.commands ?? []).length ? (
                    <div className="project-cli-command-list">
                      {(group.commands ?? []).map((command) => (
                        <ProjectCliCommandRow key={`${command.cliId}:${command.command}`} command={command} />
                      ))}
                    </div>
                  ) : null}
                  {group.actions.length ? (
                    <div className="project-cli-action-list">
                      {group.actions.map((action) => (
                        <ProjectCliActionRow
                          key={action.actionId}
                          action={action}
                          busy={busy}
                          result={lastResult?.actionId === action.actionId ? lastResult : null}
                          onRunAction={onRunAction}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              ))
            )}
          </div>
        </>
      )}
    </aside>
  );
}

function ProjectCliCommandRow({ command }: { command: ProjectCliCommand }) {
  return (
    <article className="project-cli-command-row">
      <div className="project-cli-action-main">
        <div className="project-cli-action-title">
          <strong>{command.command}</strong>
          <span className="metric-pill">{commandKindLabel(command.kind)}</span>
          {command.version ? <span className="metric-pill">{command.version}</span> : null}
        </div>
        <dl className="project-cli-action-meta">
          <dt>cwd</dt>
          <dd>{command.cwd}</dd>
          <dt>command</dt>
          <dd>{command.commandText}</dd>
          {command.localPath ? (
            <>
              <dt>path</dt>
              <dd>{command.localPath}</dd>
            </>
          ) : null}
        </dl>
      </div>
    </article>
  );
}

function ProjectCliActionRow({
  action,
  busy,
  result,
  onRunAction
}: {
  action: ProjectCliAction;
  busy: boolean;
  result: ProjectCliActionRunResult | null;
  onRunAction: (action: ProjectCliAction) => void;
}) {
  const unavailable = action.availability.state !== "available";
  return (
    <article className="project-cli-action-row">
      <div className="project-cli-action-main">
        <div className="project-cli-action-title">
          <strong>{action.label}</strong>
          <span className="metric-pill">{modeLabel(action.executionMode)}</span>
          {action.writesProject ? <span className="metric-pill warning">写项目目录</span> : <span className="metric-pill">只读</span>}
        </div>
        <dl className="project-cli-action-meta">
          <dt>cwd</dt>
          <dd>{action.cwd}</dd>
          <dt>command</dt>
          <dd>{action.commandText}</dd>
          {action.affectedPaths.length ? (
            <>
              <dt>影响路径</dt>
              <dd>{action.affectedPaths.join("；")}</dd>
            </>
          ) : null}
        </dl>
      </div>
      <button
        className={action.executionMode === "terminal" ? "primary" : "secondary"}
        type="button"
        disabled={busy || unavailable}
        title={action.availability.reason ?? action.commandText}
        onClick={() => onRunAction(action)}
      >
        {action.label}
      </button>
      {result ? <ProjectCliActionResult result={result} /> : null}
    </article>
  );
}

function ProjectCliActionResult({ result }: { result: ProjectCliActionRunResult }) {
  const output = result.stderr || result.stdout;
  const message =
    result.status === "launched"
      ? "已打开可见终端"
      : result.status === "success"
        ? `运行完成，exit ${result.exitCode ?? 0}`
        : `运行失败，exit ${result.exitCode ?? "unknown"}`;
  return (
    <div className={`inline-warning ${result.status === "success" || result.status === "launched" ? "success" : ""}`} role="status">
      <span>{message}</span>
      {output ? <pre className="operation-output">{output}</pre> : null}
    </div>
  );
}

function availabilityLabel(state: ProjectCliAction["availability"]["state"]): string {
  if (state === "available") return "可用";
  if (state === "unavailable") return "不可用";
  return "未发现";
}

function modeLabel(mode: ProjectCliAction["executionMode"]): string {
  return mode === "terminal" ? "可见终端" : "面板输出";
}

function commandKindLabel(kind: ProjectCliCommand["kind"]): string {
  return kind === "function" ? "功能 CLI" : "依赖 CLI";
}
