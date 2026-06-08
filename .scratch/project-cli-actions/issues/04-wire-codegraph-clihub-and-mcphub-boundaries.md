Status: ready-for-human

# Wire CodeGraph CliHub and McpHub boundaries

## Parent

.scratch/project-cli-actions/PRD.md

## What to build

Treat CodeGraph as a custom function CLI registered through CliHub, and document the later McpHub application boundary. CodeGraph must not be added to the built-in function CLI inventory. Project CLI actions should only appear after CliHub has a custom CLI record whose parsed `commandNames` includes `codegraph`; those actions initialize and inspect `.codegraph/`. Applying `codegraph serve --mcp` to tools remains a McpHub concern.

This slice should not implement the McpHub `codegraph` server unless a separate McpHub issue is opened.

## Acceptance criteria

- [x] CliHub does not add a built-in `codegraph` function CLI row.
- [x] CliHub custom install-command flow can register `npm install -g @colbymchenry/codegraph` and parse `commandNames: ["codegraph"]`.
- [x] The custom `codegraph` row can be refreshed through CliHub discovery and can report PATH availability without requiring CodeGraph to be installed in tests.
- [x] Project CLI registry discovers CodeGraph actions from a custom CliHub CLI record whose `commandNames` includes `codegraph`.
- [x] CodeGraph is not added to `ToolId`.
- [x] CodeGraph does not appear as a project session tool.
- [x] Tests cover custom CodeGraph registration, discovery, Project Group action listing, inline execution, terminal launch dry-run, and target-root boundary behavior.

## Blocked by

- .scratch/clihub-cli-management/issues/03-model-install-channels-and-provider-parsing.md

## Comments

- 2026-06-08: 根据产品决策调整范围：CodeGraph 不是内置 function CLI，而是通过 CliHub 自定义功能 CLI 登记；Project CLI 面板只消费这个自定义记录。
- 2026-06-08: 已通过后端和 UI 测试覆盖自定义 `codegraph` 登记、发现、Project Group 目标目录、只读 inline 动作、可见终端动作和越界 targetRootPath 拒绝。
