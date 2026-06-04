Status: ready-for-human

# Import and export HookHub suites

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Add import and export flows for HookHub suites and native tool hooks. HookHub suite JSON import/export should handle complete suite definitions without project bindings. Native tool hook import should extract the selected tool's hooks section and always create a new suite.

## Acceptance criteria

- [ ] HookHub can export a suite as HookHub suite JSON.
- [ ] Exported suite JSON includes suite metadata and tool hooks payloads.
- [ ] Exported suite JSON does not include project bindings or deployment state.
- [ ] HookHub can import HookHub suite JSON.
- [ ] Importing HookHub suite JSON with a conflicting name offers `覆盖已有 suite`, `重命名后导入为新 suite`, and `取消`.
- [ ] Overwriting an existing suite updates the center suite and marks enabled project bindings outdated when rendered hooks changed.
- [ ] HookHub can import native tool hooks after the user selects a tool.
- [ ] Native import extracts only the selected tool hooks section and creates a new suite.
- [ ] Native import never imports into an existing suite.
- [ ] Native import requires a globally unique suite name.
- [ ] API and UI tests cover suite export, suite import, name conflict handling, overwrite-to-outdated behavior, native import, no existing-suite native merge, and binding omission.

## Blocked by

- .scratch/hookhub-hook-management/issues/01-build-hookhub-suite-library.md
- .scratch/hookhub-hook-management/issues/06-add-codex-qwen-qoder-renderers.md
