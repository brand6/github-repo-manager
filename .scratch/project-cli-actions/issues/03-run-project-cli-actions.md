Status: ready-for-human

# Run Project CLI actions

## Parent

.scratch/project-cli-actions/PRD.md

## What to build

Implement execution for predefined Project CLI actions. Read-only short actions may run through the backend and display stdout/stderr inline. Writeback-like or long-running actions should launch in a visible terminal, with the command and cwd shown before execution.

This slice should execute only registry-defined actions and must not accept arbitrary command text from the UI.

## Acceptance criteria

- [x] The backend exposes an execute operation for a registry-defined action id.
- [x] The execute operation rejects unknown actions.
- [x] The execute operation rejects targetRootPath outside the Project.
- [x] Backend-run actions store/display command, cwd, start time, exit code, stdout, stderr, and status.
- [x] Terminal-run actions launch with cwd equal to the selected Project Group path.
- [x] `codegraph status` can run inline and display output in `项目 CLI 管理`.
- [x] `codegraph init -i`, `codegraph index --force`, and `codegraph sync` use visible terminal execution.
- [x] UI feedback uses the existing global toast/status surface plus row-local result output where appropriate.
- [x] Tests verify command args and cwd for every CodeGraph action.

## Blocked by

- 01-build-project-cli-action-registry.md
- 02-add-project-group-cli-panel.md

## Comments

- 2026-06-08：已新增 `/api/projects/:id/cli-actions/:actionId/execute`。inline 动作通过可注入 runner 执行；terminal 动作用现有 `launchInTerminal`，测试使用 `dryRun` 验证 cwd 和 argv，不依赖真实 CodeGraph。
