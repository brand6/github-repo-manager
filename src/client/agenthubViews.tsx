import React, { useMemo, useState } from "react";
import type {
  AgentHubAgent,
  AgentHubList,
  AgentHubToolId,
  ProjectAgentApplyResult,
  ProjectAgentState,
  ProjectAgentTargetState,
  ProjectLocalAgent,
  ProjectLocalAgentMigrationTarget,
  SkillHubOpenTarget
} from "../shared/types.js";
import { agentHubToolIds } from "../shared/types.js";

type AgentHubSource = AgentHubList["sources"][number];
type ProjectAgentsTab = "agenthub" | "local";

interface AgentHubSourceGroup {
  source: AgentHubSource;
  agents: AgentHubAgent[];
}

export function AgentHubPage({
  agentHub,
  query,
  busy,
  onQueryChange,
  onPickLocalPath,
  onImportLocal,
  onReimportBuiltin,
  onOpenAgent,
  onReparseAgent,
  onDeleteSource
}: {
  agentHub: AgentHubList | null;
  query: string;
  busy: boolean;
  onQueryChange: (query: string) => void;
  onPickLocalPath: () => Promise<string | null>;
  onImportLocal: (path: string, truthTool: AgentHubToolId) => void;
  onReimportBuiltin: () => void;
  onOpenAgent: (agentId: string, target: SkillHubOpenTarget) => void;
  onReparseAgent: (agentId: string) => void;
  onDeleteSource: (sourceId: string) => void;
}) {
  const [localPath, setLocalPath] = useState("");
  const [truthTool, setTruthTool] = useState<AgentHubToolId>("claude");
  const groups = useMemo(() => groupAgentHubAgents(agentHub), [agentHub]);
  const emptyTitle = query.trim() ? "没有匹配 Agent" : "还没有 AgentHub Agent";

  async function pickLocalPath() {
    const selected = await onPickLocalPath();
    if (selected) setLocalPath(selected);
  }

  return (
    <section className="content agenthub-page">
      <section className="toolbar-panel compact skillhub-search-panel" aria-label="搜索 Agent">
        <label className="field wide">
          搜索 Agent
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="名称、描述、slug、source、truth tool、路径或分类" />
        </label>
      </section>

      <details className="toolbar-panel compact hub-import-panel agenthub-import-panel" role="region" aria-label="Agent 导入">
        <summary>
          <span className="hub-import-title">Agent 导入</span>
          <span className="metric-pill">内置 / 本地</span>
        </summary>
        <div className="hub-import-body skillhub-import-grid">
          <label className="field wide">
            本地 Agent 文件夹
            <input value={localPath} onChange={(event) => setLocalPath(event.target.value)} placeholder="选择包含原生 agent 文件的文件夹" />
          </label>
          <label className="field">
            truth tool
            <select value={truthTool} disabled={busy} onChange={(event) => setTruthTool(event.target.value as AgentHubToolId)}>
              {agentHubToolIds.map((toolId) => (
                <option value={toolId} key={toolId}>
                  {toolId}
                </option>
              ))}
            </select>
          </label>
          <div className="inline-actions">
            <button className="secondary" type="button" disabled={busy} onClick={() => void pickLocalPath()}>
              选择文件夹
            </button>
            <button className="primary" type="button" disabled={busy || !localPath.trim()} onClick={() => onImportLocal(localPath.trim(), truthTool)}>
              导入本地 Agent
            </button>
            <button className="secondary" type="button" disabled={busy} onClick={onReimportBuiltin}>
              重新导入 agency-agents
            </button>
          </div>
        </div>
      </details>

      {!agentHub ? (
        <div className="empty-state">
          <h2>正在读取 AgentHub</h2>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <h2>{emptyTitle}</h2>
          <p>{query.trim() ? "调整搜索条件后再试。" : "导入内置 agency-agents 或本地 agent 文件夹后，会显示在这里。"}</p>
        </div>
      ) : (
        <section className="skillhub-source-list agenthub-source-list" aria-label="AgentHub 来源">
          {groups.map((group) => (
            <details className="skillhub-source-group" key={group.source.id}>
              <summary>
                <span className="skillhub-source-main">
                  <span className="skillhub-source-title">{group.source.label}</span>
                  <span className="metric-pill">{group.source.type}</span>
                  <span className="metric-pill">{group.source.sourceTruthTool}</span>
                </span>
                <span className="skillhub-source-actions">
                  <span className="metric-pill strong">{group.agents.length} 个 Agent</span>
                  <button
                    className="danger"
                    type="button"
                    disabled={busy}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onDeleteSource(group.source.id);
                    }}
                  >
                    删除 source
                  </button>
                </span>
              </summary>
              <div className="skillhub-skill-list">
                {group.agents.map((agent) => (
                  <AgentHubAgentRow key={agent.id} agent={agent} busy={busy} onOpenAgent={onOpenAgent} onReparseAgent={onReparseAgent} />
                ))}
              </div>
            </details>
          ))}
        </section>
      )}
    </section>
  );
}

function AgentHubAgentRow({
  agent,
  busy,
  onOpenAgent,
  onReparseAgent
}: {
  agent: AgentHubAgent;
  busy: boolean;
  onOpenAgent: (agentId: string, target: SkillHubOpenTarget) => void;
  onReparseAgent: (agentId: string) => void;
}) {
  return (
    <details className="skillhub-skill-row agenthub-agent-row">
      <summary>
        <span className="skillhub-skill-title">{agent.name}</span>
        <small>{agent.slug}</small>
        <span className="metric-pill">{agent.sourceTruthTool}</span>
        <span className="metric-pill">{agent.truthRole}</span>
        {agent.category ? <span className="metric-pill">{agent.category}</span> : null}
      </summary>
      <div className="skillhub-skill-body">
        <p>{agent.description ?? "无描述"}</p>
        <div className="project-meta">
          <span>{agent.nativePath}</span>
          {agent.sourceRelativePath ? <span>{agent.sourceRelativePath}</span> : null}
        </div>
        <div className="card-actions">
          <button className="secondary" type="button" disabled={busy} onClick={() => onOpenAgent(agent.id, "document")}>
            打开文件
          </button>
          <button className="secondary" type="button" disabled={busy} onClick={() => onOpenAgent(agent.id, "folder")}>
            打开目录
          </button>
          <button className="secondary" type="button" disabled={busy} onClick={() => onReparseAgent(agent.id)}>
            重新解析
          </button>
        </div>
      </div>
    </details>
  );
}

export function ProjectAgentsPanel({
  state,
  busy,
  lastApply,
  onClose,
  onApplyAgent,
  onSyncBinding,
  onDisableBinding,
  onSyncAll,
  onMigrateLocalAgent
}: {
  state: ProjectAgentState | null;
  busy: boolean;
  lastApply: ProjectAgentApplyResult | null;
  onClose: () => void;
  onApplyAgent: (agentId: string, toolId: AgentHubToolId, conflictMode?: "overwrite" | "migrate-then-overwrite" | "replace-managed" | null) => void;
  onSyncBinding: (bindingId: string) => void;
  onDisableBinding: (bindingId: string, mode?: "keep-file" | "delete-with-backup" | null) => void;
  onSyncAll: () => void;
  onMigrateLocalAgent: (localAgent: ProjectLocalAgent, target: ProjectLocalAgentMigrationTarget) => void;
}) {
  const [activeTab, setActiveTab] = useState<ProjectAgentsTab>("agenthub");

  return (
    <aside className="side-panel project-agents-panel" aria-label="项目 Agent 管理">
      <header>
        <div>
          <span className="eyebrow">AgentHub</span>
          <h2>Agent</h2>
        </div>
        <button className="secondary" type="button" onClick={onClose} disabled={busy}>
          关闭
        </button>
      </header>
      {state ? <p className="path-line">{state.targetRootPath}</p> : null}
      <div className="segmented-tabs project-skill-tabs" role="tablist" aria-label="Agent 类型">
        <button className={activeTab === "agenthub" ? "active" : ""} type="button" role="tab" aria-selected={activeTab === "agenthub"} onClick={() => setActiveTab("agenthub")}>
          AgentHub Agent
        </button>
        <button className={activeTab === "local" ? "active" : ""} type="button" role="tab" aria-selected={activeTab === "local"} onClick={() => setActiveTab("local")}>
          本地 Agent
        </button>
      </div>
      {activeTab === "agenthub" ? (
        <ProjectAgentHubTab
          state={state}
          busy={busy}
          lastApply={lastApply}
          onApplyAgent={onApplyAgent}
          onSyncBinding={onSyncBinding}
          onDisableBinding={onDisableBinding}
          onSyncAll={onSyncAll}
        />
      ) : (
        <ProjectLocalAgentTab state={state} busy={busy} onMigrateLocalAgent={onMigrateLocalAgent} />
      )}
    </aside>
  );
}

function ProjectAgentHubTab({
  state,
  busy,
  lastApply,
  onApplyAgent,
  onSyncBinding,
  onDisableBinding,
  onSyncAll
}: {
  state: ProjectAgentState | null;
  busy: boolean;
  lastApply: ProjectAgentApplyResult | null;
  onApplyAgent: (agentId: string, toolId: AgentHubToolId, conflictMode?: "overwrite" | "migrate-then-overwrite" | "replace-managed" | null) => void;
  onSyncBinding: (bindingId: string) => void;
  onDisableBinding: (bindingId: string, mode?: "keep-file" | "delete-with-backup" | null) => void;
  onSyncAll: () => void;
}) {
  const [query, setQuery] = useState("");
  const filteredAgents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (state?.agents ?? []).filter((agent) => {
      if (!normalized) return true;
      return [agent.name, agent.description ?? "", agent.slug, agent.source?.label ?? "", agent.sourceTruthTool, agent.truthRole, agent.category ?? ""]
        .join("\n")
        .toLowerCase()
        .includes(normalized);
    });
  }, [query, state]);
  const groups = useMemo(() => groupAgentHubAgents(state ? { sources: state.sources, agents: filteredAgents } : null), [filteredAgents, state]);

  if (!state) return <div className="muted">正在读取项目 Agent...</div>;

  return (
    <div className="project-agenthub-tab-panel" role="tabpanel">
      <label className="field wide">
        搜索 Agent
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="筛选 AgentHub Agent" />
      </label>
      <div className="inline-actions">
        <button className="secondary" type="button" disabled={busy} onClick={onSyncAll}>
          同步 outdated
        </button>
      </div>
      {lastApply?.requiresConfirmation ? (
        <div className="inline-warning">
          {lastApply.conflicts.length ? "目标路径已有 unmanaged Agent；请选择覆盖或迁移后覆盖。" : "目标路径已有冲突或 drifted 内容，需要确认。"}
        </div>
      ) : null}
      {groups.length === 0 ? (
        <div className="empty-state compact">没有可用 Agent</div>
      ) : (
        <div className="project-skill-list">
          {groups.map((group) => (
            <details className="project-skill-source-group skillhub-source-group" key={group.source.id}>
              <summary>
                <span className="skillhub-source-main">
                  <span className="skillhub-source-title">{group.source.label}</span>
                  <span className="metric-pill">{group.source.sourceTruthTool}</span>
                </span>
                <span className="metric-pill strong">{group.agents.length} 个 Agent</span>
              </summary>
              <div className="project-skill-source-body">
                {group.agents.map((agent) => (
                  <ProjectAgentRow
                    key={agent.id}
                    agent={agent}
                    targets={state.targets.filter((target) => target.agent.id === agent.id)}
                    busy={busy}
                    onApplyAgent={onApplyAgent}
                    onSyncBinding={onSyncBinding}
                    onDisableBinding={onDisableBinding}
                  />
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectAgentRow({
  agent,
  targets,
  busy,
  onApplyAgent,
  onSyncBinding,
  onDisableBinding
}: {
  agent: AgentHubAgent;
  targets: ProjectAgentTargetState[];
  busy: boolean;
  onApplyAgent: (agentId: string, toolId: AgentHubToolId, conflictMode?: "overwrite" | "migrate-then-overwrite" | "replace-managed" | null) => void;
  onSyncBinding: (bindingId: string) => void;
  onDisableBinding: (bindingId: string, mode?: "keep-file" | "delete-with-backup" | null) => void;
}) {
  return (
    <details className="skill-target-row agent-target-row">
      <summary>
        <span>{agent.name}</span>
        <span className="metric-pill">{agent.sourceTruthTool}</span>
        <span className="metric-pill">{agent.truthRole}</span>
      </summary>
      <p>{agent.description ?? "无描述"}</p>
      <div className="tool-chip-list">
        {targets.map((target) => {
          const checked = Boolean(target.binding);
          return (
            <label className="tool-target-chip" key={`${agent.id}:${target.toolId}`} title={target.reason ?? target.outputPath}>
              <input
                type="checkbox"
                checked={checked}
                disabled={busy}
                onChange={(event) => {
                  if (event.target.checked) {
                    onApplyAgent(agent.id, target.toolId);
                    return;
                  }
                  if (target.binding) onDisableBinding(target.binding.id);
                }}
              />
              <span>{target.toolId}</span>
              <span className={statusClass(target.status)}>{target.status}</span>
            </label>
          );
        })}
      </div>
      <div className="card-actions">
        {targets
          .filter((target) => target.binding)
          .map((target) => (
            <React.Fragment key={`${target.toolId}:actions`}>
              <button className="secondary" type="button" disabled={busy || target.status !== "outdated" || !target.binding} onClick={() => target.binding && onSyncBinding(target.binding.id)}>
                同步 {target.toolId}
              </button>
              <button
                className="danger"
                type="button"
                disabled={busy || !target.binding}
                onClick={() => {
                  if (!target.binding) return;
                  if (target.status === "drifted") {
                    const keep = window.confirm("项目文件已 drifted。确定仅移除 binding 并保留文件？取消则备份后删除。");
                    onDisableBinding(target.binding.id, keep ? "keep-file" : "delete-with-backup");
                    return;
                  }
                  onDisableBinding(target.binding.id);
                }}
              >
                禁用 {target.toolId}
              </button>
            </React.Fragment>
          ))}
      </div>
    </details>
  );
}

function ProjectLocalAgentTab({
  state,
  busy,
  onMigrateLocalAgent
}: {
  state: ProjectAgentState | null;
  busy: boolean;
  onMigrateLocalAgent: (localAgent: ProjectLocalAgent, target: ProjectLocalAgentMigrationTarget) => void;
}) {
  const [targetSourceId, setTargetSourceId] = useState("project-local-agents");
  const migrationSources = useMemo(() => state?.sources.filter((source) => source.type === "local-import") ?? [], [state]);

  if (!state) return <div className="muted">正在读取本地 Agent...</div>;
  return (
    <div className="project-local-agent-tab-panel" role="tabpanel">
      <label className="field wide">
        迁移到
        <select value={targetSourceId} disabled={busy} onChange={(event) => setTargetSourceId(event.target.value)}>
          <option value="project-local-agents">project-local-agents</option>
          {migrationSources.map((source) => (
            <option value={source.id} key={source.id}>
              {source.label}
            </option>
          ))}
          <option value="__new__">新建 source</option>
        </select>
      </label>
      {state.localAgents.length === 0 ? (
        <div className="empty-state compact">没有发现本地 Agent</div>
      ) : (
        <div className="project-local-skill-group-list">
          {state.localAgents.map((localAgent) => (
            <details className="project-local-skill-row skillhub-skill-row" key={localAgent.id}>
              <summary>
                <span className="skillhub-skill-title">{localAgent.name ?? localAgent.slug}</span>
                <span className="metric-pill">{localAgent.toolId}</span>
                <span className={statusClass(localAgent.status)}>{localAgent.status}</span>
              </summary>
              <div className="skillhub-skill-body">
                <p>{localAgent.description ?? "无描述"}</p>
                <small>{localAgent.outputPath}</small>
                {localAgent.reason ? <div className="inline-warning">{localAgent.reason}</div> : null}
                <div className="card-actions">
                  <button
                    className="primary"
                    type="button"
                    disabled={busy || !localAgent.migratable}
                    onClick={() => onMigrateLocalAgent(localAgent, migrationTarget(targetSourceId))}
                  >
                    迁移到 AgentHub
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function migrationTarget(value: string): ProjectLocalAgentMigrationTarget {
  if (value === "__new__") {
    const label = window.prompt("新 AgentHub source label", "project-local-agents") || "project-local-agents";
    return { type: "new-source", label };
  }
  return { type: "existing-source", sourceId: value };
}

function groupAgentHubAgents(agentHub: Pick<AgentHubList, "sources" | "agents"> | null): AgentHubSourceGroup[] {
  if (!agentHub) return [];
  const sourceMap = new Map(agentHub.sources.map((source) => [source.id, source]));
  const groups = new Map<string, AgentHubSourceGroup>();
  for (const source of agentHub.sources) groups.set(source.id, { source, agents: [] });
  for (const agent of agentHub.agents) {
    const source = agent.source ?? sourceMap.get(agent.sourceId);
    if (!source) continue;
    const group = groups.get(source.id) ?? { source, agents: [] };
    group.agents.push(agent);
    groups.set(source.id, group);
  }
  return [...groups.values()].filter((group) => group.agents.length > 0);
}

function statusClass(status: string): string {
  return `metric-pill hook-status hook-status-${status}`;
}
