Status: ready-for-human

# Discover project tool hook state

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Build the first project-side tracer bullet: every project root/subproject group exposes a `Hooks` action, the side panel opens scoped to that group path, and the panel discovers each supported tool's current hooks section and HookHub binding state.

This slice should display one row per `project/group + tool`, not one row per individual hook.

## Acceptance criteria

- [ ] Each project detail root/subproject group has a `Hooks` button.
- [ ] Clicking `Hooks` opens a side panel scoped to that group's full path.
- [ ] The panel shows supported tool rows for Claude, Codex, Qwen, and Qoder.
- [ ] Each tool row shows config path, scope, suite binding if any, hooks summary, and status.
- [ ] Status can be `current`, `outdated`, `drifted`, `missing`, `unmanaged`, or `invalid`.
- [ ] Status detection uses only the tool hooks section and binding fingerprint, not unrelated config fields.
- [ ] Invalid configs are shown with parse errors and are not rewritten.
- [ ] Unmanaged hooks are visible but cannot be cleared directly.
- [ ] API and UI tests cover group scoping, tool rows, all statuses, unmanaged display, invalid parse display, and ignoring unrelated settings changes.

## Blocked by

- .scratch/hookhub-hook-management/issues/01-build-hookhub-suite-library.md

