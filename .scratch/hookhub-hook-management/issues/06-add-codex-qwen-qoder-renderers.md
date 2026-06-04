Status: ready-for-human

# Add Codex Qwen and Qoder hooks-section renderers

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Extend hooks-section discovery, suite payload editing, suite application, sharing, replacement, and status detection across Codex, Qwen, and Qoder. Each renderer should treat the tool's `hooks` section as the replaceable unit and preserve unrelated settings.

## Acceptance criteria

- [ ] Codex hooks discover and write `<groupPath>/.codex/hooks.json`.
- [ ] Qwen hooks discover and write `<groupPath>/.qwen/settings.json` or `.qwen/settings.local.json`.
- [ ] Qoder hooks discover and write `<groupPath>/.qoder/settings.json` or `.qoder/settings.local.json`.
- [ ] Each renderer reads and writes complete hooks sections rather than individual managed hook ids.
- [ ] Each renderer preserves unrelated config and unrelated root fields.
- [ ] Each renderer supports project-side create, share-to-HookHub, suite apply, status detection, and replacement backup.
- [ ] Renderer capability checks generate automatic partial/unsupported explanations in expanded suite details; fully supported targets do not need extra text.
- [ ] Tests cover discovery, create, share, apply, status detection, replacement, and unrelated-setting preservation for Codex, Qwen, and Qoder.

## Blocked by

- .scratch/hookhub-hook-management/issues/03-edit-project-tool-hooks-as-suite.md
- .scratch/hookhub-hook-management/issues/04-share-project-tool-hooks-to-hookhub.md
- .scratch/hookhub-hook-management/issues/05-apply-suite-with-replacement-and-backup.md

