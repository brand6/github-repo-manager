Status: ready-for-human

# Add Project Group CLI panel

## Parent

.scratch/project-cli-actions/PRD.md

## What to build

Add a `CLI` entry to each Project Group in the project detail view and open a side panel named `项目 CLI 管理`. The panel should mirror the existing project Skill/MCP/Hook panel shape: scoped to one `targetRootPath`, grouped by resource type, and driven by backend state.

This slice should render available actions and previews but should not execute commands yet.

## Acceptance criteria

- [x] Each Root Group and Subproject Group shows a `CLI` button with the existing project-side action controls.
- [x] Clicking `CLI` opens a complementary side panel named `项目 CLI 管理`.
- [x] The panel shows the current Project Group path.
- [x] Actions are grouped by CLI display name.
- [x] CodeGraph actions display their command, cwd, execution mode, and affected path.
- [x] Unavailable CLI state is visible and points the user back to CliHub availability/install state.
- [x] Child Project Groups request actions with the child group targetRootPath, not the Project root.
- [x] UI tests cover opening the panel from root and child groups.

## Blocked by

- 01-build-project-cli-action-registry.md

## Comments

- 2026-06-08：已在 Project Group action 区加入 `CLI` 入口，并新增 `项目 CLI 管理` 侧边栏。UI 测试覆盖 child group 使用自身 `targetRootPath`。
