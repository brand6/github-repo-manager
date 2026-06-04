Status: ready-for-human

# Edit project tool hooks as a suite

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Let the user create and edit hooks from the project Hook panel at the `project/group + tool` level. Project-side new hook creation should create a HookHub suite, require a globally unique suite name, and immediately apply that suite to the current group/tool. Later project-side edits modify the current project hooks first, producing `drifted` state when they diverge from HookHub.

This slice should start with one supported renderer and keep the UI shaped around complete hooks-section editing rather than individual hook component management.

## Acceptance criteria

- [ ] A project tool row can start a structured hooks editor for the selected group/tool.
- [ ] Creating hooks from the project panel requires a globally unique suite name.
- [ ] Saving a new project hook setup creates a HookHub suite with the selected tool payload.
- [ ] The new suite is immediately applied to the current group/tool and a binding is recorded.
- [ ] The editor writes only the selected tool's `hooks` section and preserves unrelated settings.
- [ ] Editing a bound project tool modifies the project hooks section first and marks the binding `drifted` when it differs from HookHub.
- [ ] Duplicate equivalent trigger conditions can be saved, but the editor shows a repeated-execution warning.
- [ ] API and UI tests cover project-side create, unique suite name validation, immediate binding, hooks-section write, unrelated setting preservation, and drift after local edit.

## Blocked by

- .scratch/hookhub-hook-management/issues/02-discover-project-tool-hook-state.md

