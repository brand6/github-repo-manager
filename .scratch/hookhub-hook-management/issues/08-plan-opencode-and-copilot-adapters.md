Status: ready-for-human

# Plan OpenCode and Copilot hook adapters

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Add a follow-up design and discovery-only slice for OpenCode and Copilot so HookHub can display their current hook/plugin state without pretending they are the same as Claude/Codex/Qwen/Qoder JSON hooks. OpenCode should be treated as plugin-file based. Copilot should distinguish local CLI hooks from cloud-agent repository hooks.

This issue is intentionally discovery and planning first. Structured writing for these targets should be a later PRD or explicitly approved follow-up issue.

## Acceptance criteria

- [ ] HookHub project discovery shows OpenCode plugin presence from `.opencode/plugins/` and relevant `opencode.json` plugin entries.
- [ ] HookHub project discovery shows Copilot repository hook files under `.github/hooks/*.json` where present.
- [ ] OpenCode is marked as plugin-file based and not supported by structured JSON hook creation in MVP.
- [ ] Copilot is marked with CLI vs cloud-agent execution differences and not supported by structured creation in MVP.
- [ ] No OpenCode or Copilot files are written by this slice.
- [ ] The output includes a follow-up recommendation for whether OpenCode/Copilot should become structured HookHub targets.
- [ ] Tests cover discovery-only display and unsupported-state messaging.

## Blocked by

- .scratch/hookhub-hook-management/issues/02-discover-project-native-hooks.md

