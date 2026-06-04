Status: ready-for-human

# Plan OpenCode and Copilot hook suites

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Add a discovery and planning slice for OpenCode and Copilot so HookHub can display their current hook/plugin state without pretending they share the same hooks-section model as Claude, Codex, Qwen, and Qoder. OpenCode should be treated as plugin-file based. Copilot should distinguish local CLI hooks from cloud-agent repository hooks.

This issue is intentionally discovery and planning first. Structured writing for these targets should be a later PRD or explicitly approved follow-up issue.

## Acceptance criteria

- [ ] HookHub project discovery shows OpenCode plugin presence from `.opencode/plugins/` and relevant `opencode.json` plugin entries where present.
- [ ] HookHub project discovery shows Copilot repository hook files under `.github/hooks/*.json` where present.
- [ ] OpenCode is marked as plugin-file based and not supported by structured hooks-section suite writing in MVP.
- [ ] Copilot is marked with CLI vs cloud-agent execution differences and not supported by structured suite writing in MVP.
- [ ] No OpenCode or Copilot files are written by this slice.
- [ ] The output includes a follow-up recommendation for whether OpenCode/Copilot should become suite targets and what their replacement boundary would be.
- [ ] Tests cover discovery-only display and unsupported-state messaging.

## Blocked by

- .scratch/hookhub-hook-management/issues/02-discover-project-tool-hook-state.md

