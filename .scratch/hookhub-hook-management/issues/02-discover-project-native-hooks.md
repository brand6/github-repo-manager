Status: ready-for-human

# Discover project native hooks

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Build the first project-side tracer bullet: every project root/subproject group exposes a `Hooks` action, the side panel opens scoped to that group path, and the `本地 Hooks` tab discovers native hook config for supported tools without editing it.

This slice should display managed and unmanaged local hooks, invalid config states, config path, scope, event, matcher, handler summaries, and whether HookHub has ownership for each entry.

## Acceptance criteria

- [ ] Each project detail root/subproject group has a `Hooks` button.
- [ ] Clicking `Hooks` opens a side panel scoped to that group's full path.
- [ ] The side panel includes `本地 Hooks`、`新建 Hook`、`HookHub Hooks` tabs.
- [ ] `本地 Hooks` reads Claude, Codex, Qwen, and Qoder project hook config locations for the selected group path.
- [ ] Discovered hooks show `toolId`, config path, scope, event, matcher, handler type, command or endpoint summary, and managed/unmanaged status.
- [ ] Existing parse failures are shown as local config errors without rewriting files.
- [ ] Unmanaged local hooks cannot be disabled or deleted from HookHub in this slice.
- [ ] API and UI tests cover group scoping, local discovery, unmanaged display, managed status, and parse failure display.

## Blocked by

- .scratch/hookhub-hook-management/issues/01-build-hookhub-center-template-library.md

