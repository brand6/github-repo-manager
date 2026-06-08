Status: ready-for-human

# Build Project CLI action registry

## Parent

.scratch/project-cli-actions/PRD.md

## What to build

Add the backend registry and shared types for project-scoped CLI actions. The registry should return predefined actions grouped by CLI for a given `projectId` and `targetRootPath`, using CliHub availability to mark whether each action can currently run.

This slice should not add the project detail UI yet and should not execute commands yet.

## Acceptance criteria

- [x] A Project CLI action type exists with CLI identity, action id, label, command, args, cwd policy, execution mode, writeback metadata, and availability state.
- [x] The backend exposes a list operation for project CLI actions scoped by `projectId` and `targetRootPath`.
- [x] The list operation rejects `targetRootPath` values outside the Project.
- [x] CodeGraph actions are defined for `init -i`, `status`, `index --force`, and `sync`.
- [x] CodeGraph actions use the selected Project Group path as cwd.
- [x] CodeGraph writeback-like actions identify `<targetRootPath>/.codegraph/` as the affected path.
- [x] The registry reads CliHub availability for `codegraph` without creating or updating CliHub rows in this slice.
- [x] Tests cover root group and subproject group action listing.

## Blocked by

None - can start immediately

## Comments

- 2026-06-08：已实现 shared types、后端 registry 和 `/api/projects/:id/cli-actions`。CodeGraph 只从 CliHub 自定义 CLI 记录中识别，不 seed 内置 CliHub 行。
