Status: ready-for-human

# Add Codex Qwen and Qoder hook renderers

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Extend structured project hook creation, discovery, template sync, template application, and managed disabling from the first renderer to Codex, Qwen, and Qoder. Each renderer must preserve that tool's native hook config shape rather than translating through Claude semantics.

## Acceptance criteria

- [ ] Codex project hooks discover and write `<groupPath>/.codex/hooks.json`.
- [ ] Qwen project hooks discover and write `<groupPath>/.qwen/settings.json` or `.qwen/settings.local.json`.
- [ ] Qoder project hooks discover and write `<groupPath>/.qoder/settings.json` or `.qoder/settings.local.json`.
- [ ] Each renderer exposes only supported event, matcher, handler, timeout, and output fields.
- [ ] Each renderer preserves unrelated config and unrelated hook entries.
- [ ] Each renderer supports sync-to-HookHub without losing its native payload.
- [ ] Each renderer supports applying HookHub templates and disabling only managed entries.
- [ ] Tests cover discovery, create, sync, apply, and disable for Codex, Qwen, and Qoder.

## Blocked by

- .scratch/hookhub-hook-management/issues/03-structured-create-project-hook.md
- .scratch/hookhub-hook-management/issues/04-sync-project-hook-to-hookhub.md
- .scratch/hookhub-hook-management/issues/05-apply-hookhub-template-to-project.md

