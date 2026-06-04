Status: ready-for-human

# Share project tool hooks to HookHub

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Let the user upload the current `project/group + tool` hooks section as a new HookHub suite. Sharing reads only the current tool's hooks section, creates a suite with one initial tool payload, and leaves the project config unchanged.

This slice supports unmanaged hooks becoming reusable and drifted managed hooks being saved as a new suite.

## Acceptance criteria

- [ ] An unmanaged project tool hooks section exposes an `上传到 HookHub` action.
- [ ] A drifted project tool exposes `把当前 hooks 另存为新 suite`.
- [ ] Sharing requires a globally unique suite name and optional description/risk notes/env-name metadata.
- [ ] Sharing creates a new suite with only the selected tool payload.
- [ ] Sharing does not import or merge hooks from other tools in the same group.
- [ ] The new suite can later be edited in HookHub to add other tool payloads.
- [ ] Sharing does not modify the source project config file.
- [ ] API and UI tests cover unmanaged sharing, drifted save-as-new-suite, unique name validation, one-tool initial payload, no cross-tool merge, and no-file-rewrite behavior.

## Blocked by

- .scratch/hookhub-hook-management/issues/02-discover-project-tool-hook-state.md

